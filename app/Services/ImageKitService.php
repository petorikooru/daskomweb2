<?php

namespace App\Services;

use ImageKit\ImageKit;

class ImageKitService
{
    protected ImageKit $client;

    protected string $publicKey;

    protected string $privateKey;

    protected string $endpointUrl;

    public function __construct()
    {
        $this->publicKey = config('services.imagekit.public_key');
        $this->privateKey = config('services.imagekit.private_key');
        $this->endpointUrl = config('services.imagekit.endpoint_url');

        $this->client = new ImageKit(
            $this->publicKey,
            $this->privateKey,
            $this->endpointUrl
        );
    }

    public function getClient(): ImageKit
    {
        return $this->client;
    }

    /**
     * Generate authentication parameters for client-side uploads
     */
    public function generateAuthParameters(): array
    {
        $authParams = $this->client->getAuthenticationParameters();

        return [
            'token' => $authParams->token,
            'expire' => $authParams->expire,
            'signature' => $authParams->signature,
            'publicKey' => $this->publicKey,
            'urlEndpoint' => $this->endpointUrl,
        ];
    }

    /**
     * Normalize metadata from client upload response
     */
    public function normalizeMetadata(array $clientResponse): array
    {
        return [
            'file_id' => $clientResponse['fileId'] ?? null,
            'url' => $clientResponse['url'] ?? null,
            'file_path' => $clientResponse['filePath'] ?? null,
            'thumbnail_url' => $clientResponse['thumbnailUrl'] ?? null,
        ];
    }

    /**
     * Delete a file by fileId
     */
    public function deleteFile(string $fileId): void
    {
        $this->client->deleteFile($fileId);
    }

    /**
     * Move a file to a new folder
     */
    public function moveFile(string $sourceFilePath, string $destinationPath): object
    {
        return $this->client->move([
            'sourceFilePath' => $sourceFilePath,
            'destinationPath' => $destinationPath,
        ]);
    }
}
