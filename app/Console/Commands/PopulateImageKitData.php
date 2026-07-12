<?php

namespace App\Console\Commands;

use App\Models\Asisten;
use App\Models\Praktikan;
use App\Services\ImageKitService;
use Illuminate\Console\Command;

class PopulateImageKitData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'imagekit:populate
                            {--dry-run : Run without making changes}
                            {--type=all : Type to populate (asisten, praktikan, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Populate database with existing ImageKit profile pictures from /KODEASISTEN.webp or /KODEPRAKTIKAN.webp patterns';

    protected ImageKitService $imageKitService;

    public function __construct(ImageKitService $imageKitService)
    {
        parent::__construct();
        $this->imageKitService = $imageKitService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $type = $this->option('type');

        $this->info('Starting ImageKit data population...');

        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        try {
            if (in_array($type, ['asisten', 'all'])) {
                $this->populateAsistenImages($isDryRun);
            }

            // if (in_array($type, ['praktikan', 'all'])) {
            //     $this->populatePraktikanImages($isDryRun);
            // }

            $this->info('✓ ImageKit data population completed successfully');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error: '.$e->getMessage());

            return Command::FAILURE;
        }
    }

    protected function populateAsistenImages(bool $isDryRun): void
    {
        $this->info('Processing Asisten profile pictures...');

        $assistants = Asisten::all();
        $updated = 0;
        $skipped = 0;
        $moved = 0;
        $client = $this->imageKitService->getClient();
        $targetFolder = '/FOTO-ASISTEN-WEBP';

        // Fetch all files in target folder in one API call
        $this->line('Fetching existing files from ImageKit...');
        $allTargetFiles = $client->listFiles([
            'path' => $targetFolder,
            'limit' => 1000,
        ]);

        // Create a lookup map for faster searching
        $targetFilesMap = [];
        if (! empty($allTargetFiles->result)) {
            foreach ($allTargetFiles->result as $file) {
                $targetFilesMap[$file->name] = $file;
            }
        }

        // Fetch all files from root
        $allRootFiles = $client->listFiles([
            'path' => '/',
            'limit' => 1000,
        ]);

        $rootFilesMap = [];
        if (! empty($allRootFiles->result)) {
            foreach ($allRootFiles->result as $file) {
                $rootFilesMap[$file->name] = $file;
            }
        }

        $this->line('Processing '.count($assistants).' assistants...');
        $progressBar = $this->output->createProgressBar(count($assistants));
        $progressBar->start();

        foreach ($assistants as $asisten) {
            $fileName = "{$asisten->kode}.webp";
            $targetPath = "{$targetFolder}{$fileName}";

            try {
                // Check if file exists in target folder (using pre-fetched data)
                if (isset($targetFilesMap[$fileName])) {
                    $file = $targetFilesMap[$fileName];

                    if (! $isDryRun) {
                        $asisten->foto_asistens()->updateOrCreate(
                            ['kode' => $asisten->kode],
                            [
                                'foto' => $file->url,
                                'file_id' => $file->fileId,
                            ]
                        );
                    }

                    $updated++;
                    $progressBar->advance();

                    continue;
                }

                // Check if file exists in root (using pre-fetched data)
                if (isset($rootFilesMap[$fileName])) {
                    $file = $rootFilesMap[$fileName];

                    if (! $isDryRun) {
                        $moveResponse = $this->imageKitService->moveFile(
                            $file->filePath,
                            $targetFolder
                        );

                        $statusCode = $moveResponse->responseMetadata['statusCode'] ?? null;

                        if ($statusCode === 204) {
                            // Move succeeded, fetch the file details from new location
                            $movedFiles = $client->listFiles([
                                'searchQuery' => "filePath=\"{$targetPath}\"",
                            ]);

                            if (! empty($movedFiles->result)) {
                                $movedFile = $movedFiles->result[0];

                                $asisten->foto_asistens()->updateOrCreate(
                                    ['kode' => $asisten->kode],
                                    [
                                        'foto' => $movedFile->url,
                                        'file_id' => $movedFile->fileId,
                                    ]
                                );

                                $moved++;
                                $updated++;
                            } else {
                                $skipped++;
                            }
                        } else {
                            $skipped++;
                        }
                    } else {
                        $moved++;
                        $updated++;
                    }

                    $progressBar->advance();

                    continue;
                }

                // No file found
                $skipped++;
            } catch (\Exception $e) {
                $skipped++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();
        $this->info("Asisten: {$updated} ".($isDryRun ? 'would be updated' : 'updated').($moved > 0 ? ", {$moved} moved" : '').', '.$skipped.' skipped');
    }

    protected function populatePraktikanImages(bool $isDryRun): void
    {
        $this->info('Processing Praktikan profile pictures...');

        $praktikans = Praktikan::whereNull('profile_picture_file_id')->get();

        if ($praktikans->isEmpty()) {
            $this->info('All praktikans already have profile pictures');

            return;
        }

        $updated = 0;
        $skipped = 0;
        $client = $this->imageKitService->getClient();

        // Fetch all files from root in one API call
        $this->line('Fetching existing files from ImageKit...');
        $allFiles = $client->listFiles([
            'path' => '/',
            'limit' => 1000,
        ]);

        // Create a lookup map for faster searching
        $filesMap = [];
        if (! empty($allFiles->result)) {
            foreach ($allFiles->result as $file) {
                $filesMap[$file->name] = $file;
            }
        }

        $this->line('Processing '.count($praktikans).' praktikans...');
        $progressBar = $this->output->createProgressBar(count($praktikans));
        $progressBar->start();

        foreach ($praktikans as $praktikan) {
            $fileName = "{$praktikan->nim}.webp";

            try {
                // Check if file exists (using pre-fetched data)
                if (isset($filesMap[$fileName])) {
                    $file = $filesMap[$fileName];

                    if (! $isDryRun) {
                        $praktikan->update([
                            'profile_picture_url' => $file->url,
                            'profile_picture_file_id' => $file->fileId,
                        ]);
                    }

                    $updated++;
                } else {
                    $skipped++;
                }
            } catch (\Exception $e) {
                $skipped++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();
        $this->info("Praktikan: {$updated} ".($isDryRun ? 'would be updated' : 'updated').', '.$skipped.' skipped');
    }
}
