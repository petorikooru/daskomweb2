<?php

namespace App\Http\Controllers\API;

use App\Enums\TipeSoal;
use App\Http\Controllers\Controller;
use App\Models\Praktikan;
use App\Models\SoalComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SoalCommentController extends Controller
{
    public function showByModul(string $tipeSoal, int $modulId): JsonResponse
    {
        $type = TipeSoal::tryFromRequest($tipeSoal);

        if (! $type) {
            return response()->json([
                'success' => false,
                'message' => 'Tipe soal tidak valid.',
            ], 422);
        }

        $modelClass = $type->modelClass();

        $soalIds = $modelClass::query()
            ->where('modul_id', $modulId)
            ->pluck('id');

        if ($soalIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $comments = SoalComment::query()
            ->forType($type)
            ->whereIn('soal_id', $soalIds)
            ->forTotClasses()
            ->with(['praktikan:id,kelas_id,nama', 'praktikan.kelas:id,kelas'])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    public function store(Request $request, int $praktikanId, string $tipeSoal, int $soalId): JsonResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $type = TipeSoal::tryFromRequest($tipeSoal);

        if (! $type) {
            return response()->json([
                'success' => false,
                'message' => 'Tipe soal tidak valid.',
            ], 422);
        }

        /** @var Praktikan|null $praktikan */
        $praktikan = Praktikan::query()->with('kelas')->find($praktikanId);

        if (! $praktikan) {
            return response()->json([
                'success' => false,
                'message' => 'Praktikan tidak ditemukan.',
            ], 404);
        }

        $authenticated = $request->user('praktikan');

        if ($authenticated && (int) $authenticated->id !== (int) $praktikan->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan menambahkan komentar untuk praktikan lain.',
            ], 403);
        }

        if (! $this->practikanBelongsToTotClass($praktikan)) {
            return response()->json([
                'success' => false,
                'message' => 'Komentar soal hanya tersedia untuk kelas TOT.',
            ], 403);
        }

        $question = $type->findQuestion($soalId);

        if (! $question) {
            return response()->json([
                'success' => false,
                'message' => 'Soal tidak ditemukan.',
            ], 404);
        }

        $comment = SoalComment::query()->create([
            'soal_id' => $question->id,
            'tipe_soal' => $type->value,
            'praktikan_id' => $praktikan->id,
            'comment' => trim($validated['comment']),
        ])->load(['praktikan:id,kelas_id,nama', 'praktikan.kelas:id,kelas']);

        return response()->json([
            'success' => true,
            'data' => $comment,
        ], 201);
    }

    private function practikanBelongsToTotClass(Praktikan $praktikan): bool
    {
        $kelasName = $praktikan->kelas->kelas ?? '';

        return $kelasName !== '' && str_starts_with(strtoupper($kelasName), 'TOT');
    }
}
