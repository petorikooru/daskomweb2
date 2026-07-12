<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ImageKitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageKitAuthController extends Controller
{
    public function __construct(
        protected ImageKitService $imageKitService
    ) {}

    /**
     * Generate authentication parameters for client-side ImageKit uploads
     */
    public function generateAuth(): JsonResponse
    {
        try {
            $authParams = $this->imageKitService->generateAuthParameters();

            return response()->json([
                'success' => true,
                'data' => $authParams,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate authentication parameters.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle server-side file upload to ImageKit
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'fileName' => 'nullable|string',
            'folder' => 'nullable|string',
            'useUniqueFileName' => 'nullable',
        ]);

        try {
            $file = $request->file('file');
            $fileName = $request->input('fileName', $file->getClientOriginalName());
            $folder = $request->input('folder', '/');

            // Convert useUniqueFileName to boolean (handles '1', '0', 'true', 'false', true, false, null)
            $useUniqueFileName = filter_var(
                $request->input('useUniqueFileName', true),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? true;

            // Read file contents
            $fileContents = file_get_contents($file->getRealPath());

            // Prepare upload parameters
            $uploadParams = [
                'file' => base64_encode($fileContents),
                'fileName' => $fileName,
                'folder' => $folder,
                'useUniqueFileName' => $useUniqueFileName,
            ];

            // Upload to ImageKit
            $result = $this->imageKitService->getClient()->upload($uploadParams);

            // Check for errors
            if (isset($result->error)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload file to ImageKit.',
                    'error' => $result->error->message ?? 'Unknown error',
                ], 500);
            }

            // Return normalized response
            return response()->json([
                'success' => true,
                'data' => [
                    'fileId' => $result->result->fileId,
                    'url' => $result->result->url,
                    'filePath' => $result->result->filePath,
                    'thumbnailUrl' => $result->result->thumbnailUrl ?? null,
                    'name' => $result->result->name,
                    'size' => $result->result->size,
                    'fileType' => $result->result->fileType,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
