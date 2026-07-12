<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Praktikum;
use App\Services\Praktikum\QuestionProgressService;
use Illuminate\Http\JsonResponse;

class PraktikumProgressController extends Controller
{
    public function __construct(private QuestionProgressService $progressService) {}

    public function show(Praktikum $praktikum): JsonResponse
    {
        $praktikum->loadMissing(['kelas.praktikans:id,nim,nama,kelas_id,dk', 'modul:id']);

        $payload = $this->progressService->buildForPraktikum($praktikum);

        return response()->json([
            'status' => 'success',
            'praktikum_id' => $praktikum->id,
            'data' => $payload,
        ]);
    }
}
