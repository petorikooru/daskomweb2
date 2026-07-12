<?php

namespace App\Adapter;

use ImageKit\ImageKit;
use League\Flysystem\Config;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\StorageAttributes;
use League\Flysystem\UnableToCheckDirectoryExistence;
use League\Flysystem\UnableToCreateDirectory;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToSetVisibility;
use League\MimeTypeDetection\FinfoMimeTypeDetector;

class ImageKitAdapter implements FilesystemAdapter
{
    protected ImageKit $client;

    protected $options;

    public function __construct(ImageKit $client, $options = [])
    {
        $this->client = $client;
        $this->options = $options;
    }

    public function getClient(): ImageKit
    {
        return $this->client;
    }

    public function fileExists(string $path): bool
    {
        $location = $this->getFileFolderNames($path);

        $file = $this->client->listFiles([
            'name' => $location['file'],
            'path' => $location['directory'],
        ]);

        if (empty($file->result)) {
            return false;
        }

        return true;
    }

    public function directoryExists(string $path): bool
    {
        $location = $this->getFileFolderNames($path);

        $directory = $this->client->listFiles([
            'name' => $location['file'],
            'includeFolder' => true,
        ]);

        if (empty($directory->result)) {
            return false;
        }

        if ($directory->result[0]->type != 'folder') {
            throw new UnableToCheckDirectoryExistence;
        }

        return true;
    }

    public function write(string $path, string $contents, Config $config): void
    {
        $this->upload($path, $contents);
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        $this->upload($path, $contents);
    }

    public function read(string $path): string
    {
        return stream_get_contents($this->readStream($path));
    }

    public function readStream($path)
    {
        if (! strlen($path)) {
            throw new UnableToReadFile('Path should not be empty.');
        }

        $file = $this->searchFile($path);

        return @fopen($file->url, 'rb');
    }

    public function delete(string $fileId): void
    {
        $this->client->deleteFile($fileId);
    }

    public function deleteDirectory(string $path): void
    {
        $delete = $this->client->deleteFolder($path);

        if ($delete->err != null) {
            throw new UnableToReadFile('Directory not found.');
        }
    }

    public function createDirectory(string $path, Config $config): void
    {
        $create = $this->client->createFolder($path);

        if (! empty($create->err)) {
            throw new UnableToCreateDirectory;
        }
    }

    public function setVisibility(string $path, string $visibility): void
    {
        throw UnableToSetVisibility::atLocation($path, 'Adapter does not support visibility controls.');
    }

    public function visibility(string $path): FileAttributes
    {
        throw UnableToSetVisibility::atLocation($path, 'Adapter does not support visibility controls.');
    }

    public function mimeType(string $path): FileAttributes
    {
        return new FileAttributes($path, null, null, null, (new FinfoMimeTypeDetector)->detectMimeTypeFromPath($path));
    }

    public function lastModified(string $path): FileAttributes
    {
        $file = $this->searchFile($path);

        $meta = $this->client->getFileDetails($file->fileId);

        return new FileAttributes($path, null, null, strtotime($meta->result->updatedAt));
    }

    public function fileSize(string $path): FileAttributes
    {

        $file = $this->searchFile($path);

        $meta = $this->client->getFileMetaData($file->fileId);

        return new FileAttributes($path, $meta->success->size ?? null);
    }

    public function listContents(string $path, bool $deep = false): iterable
    {

        $list = $this->client->listFiles([
            'path' => $path,
            'includeFolder' => $deep,
        ]);

        foreach ($list->success as $item) {
            yield $this->normalizeObject($item);
        }
    }

    public function copy(string $source, string $destination, Config $config): void
    {

        $source = $this->searchFile($source);

        if ($source->type == 'file') {
            $this->client->copy($source->filePath, $destination);
        } else {
            $this->client->copyFolder($source->filePath, $destination);
        }
    }

    public function move(string $source, string $destination, Config $config): void
    {

        $asset = $this->searchFile($source);

        if ($asset->type == 'folder') {
            $this->client->moveFolder($source, $destination);
        } else {
            $this->client->move($source, $destination);
        }
    }

    public function searchFile($path)
    {

        $location = $this->getFileFolderNames($path);

        // Get file from old path
        $file = $this->client->listFiles([
            'name' => $location['file'] ?? '',
            'path' => $location['directory'],
            'includeFolder' => true,
        ]);

        if (empty($file->result)) {
            throw new UnableToReadFile('File or directory not found.');
        }

        return $file->result[0];
    }

    public function getFileFolderNames(string $path)
    {

        if (! $path) {
            return false;
        }

        $folder = '/';
        $fileName = $path;

        // Check for folders in path (file name)
        $folders = explode('/', $path);
        if (count($folders) > 1) {
            $fileName = end($folders);
            $folder = str_replace('/'.end($folders), '', $path);
        }

        return [
            'file' => $fileName,
            'directory' => $folder,
        ];
    }

    public function upload(string $path, $contents)
    {

        $location = $this->getFileFolderNames($path);

        if ($location === false) {
            return false;
        }

        // If not resource or URL - base64 encode
        if (! is_resource($contents) && ! filter_var($contents, FILTER_VALIDATE_URL)) {
            $contents = 'data:image/png;base64,'.base64_encode(file_get_contents($contents));
        }
        // $contents = base64_encode($contents);

        $upload = $this->client->upload([
            'file' => $contents,
            'fileName' => $location['file'],
            'useUniqueFileName' => false,
            'folder' => $location['directory'],
        ]);

        return $upload;
    }

    protected function normalizeObject(object $item): StorageAttributes
    {
        return match ($item->type) {

            'folder' => new DirectoryAttributes(
                $item->folderPath,
                null,
                strtotime($item->updatedAt),
                ['id' => $item->folderId]
            ),

            'file' => new FileAttributes(
                $item->filePath,
                $item->size,
                null,
                strtotime($item->updatedAt),
                $item->mime ?? null,
                ['id' => $item->fileId]
            )
        };
    }
}
