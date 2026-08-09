<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\QuestionRandomizationConfig;
use App\Models\SoalTa;
use App\Models\SoalTk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuestionRandomizationController extends Controller
{
    private function model(string $category): string
    {
        abort_unless(in_array($category, ['ta', 'tk'], true), 404);
        return $category === 'ta' ? SoalTa::class : SoalTk::class;
    }

    private function available(string $model, int $modulId): array
    {
        return [
            'easy' => $model::where('modul_id', $modulId)->where('difficulty', 'easy')->count(),
            'medium' => $model::where('modul_id', $modulId)->where('difficulty', 'medium')->count(),
            'hard' => $model::where('modul_id', $modulId)->where('difficulty', 'hard')->count(),
            'unlabeled' => $model::where('modul_id', $modulId)->whereNull('difficulty')->count(),
            'total' => $model::where('modul_id', $modulId)->count(),
        ];
    }

    public function show(string $category, int $modulId): JsonResponse
    {
        $model = $this->model($category);
        $config = QuestionRandomizationConfig::firstOrCreate(
            ['modul_id' => $modulId, 'category' => $category],
            ['easy_count' => 5, 'medium_count' => 4, 'hard_count' => 1, 'enabled' => false],
        );
        return response()->json(['config' => $config, 'available' => $this->available($model, $modulId)]);
    }

    public function update(Request $request, string $category, int $modulId): JsonResponse
    {
        $model = $this->model($category);
        $data = $request->validate([
            'easy_count' => ['required', 'integer', 'min:0'],
            'medium_count' => ['required', 'integer', 'min:0'],
            'hard_count' => ['required', 'integer', 'min:0'],
            'enabled' => ['required', 'boolean'],
        ]);
        $available = $this->available($model, $modulId);
        $total = $data['easy_count'] + $data['medium_count'] + $data['hard_count'];
        if ($data['enabled'] && $available['unlabeled'] > 0) return response()->json(['message' => "Masih ada {$available['unlabeled']} soal yang belum memiliki difficulty."], 422);
        if ($total < 1) return response()->json(['message' => 'Total soal minimal 1.'], 422);
        $config = QuestionRandomizationConfig::updateOrCreate(['modul_id' => $modulId, 'category' => $category], $data);
        return response()->json(['message' => 'Konfigurasi randomisasi berhasil disimpan.', 'config' => $config, 'available' => $available]);
    }

    public function difficulty(Request $request, string $category, int $questionId): JsonResponse
    {
        $model = $this->model($category);
        $data = $request->validate(['difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])]]);
        $question = $model::findOrFail($questionId);
        $question->update(['difficulty' => $data['difficulty']]);
        return response()->json(['message' => 'Difficulty berhasil diperbarui.', 'difficulty' => $question->difficulty]);
    }
}
