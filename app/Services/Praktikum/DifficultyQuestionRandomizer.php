<?php

namespace App\Services\Praktikum;

use App\Models\Praktikan;
use App\Models\QuestionRandomizationConfig;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class DifficultyQuestionRandomizer
{
    public const LEVELS = ['easy', 'medium', 'hard'];

    public function config(int $modulId, string $category): ?QuestionRandomizationConfig
    {
        return QuestionRandomizationConfig::where('modul_id', $modulId)->where('category', $category)->first();
    }

    public function counts(int $modulId, string $category): ?array
    {
        $config = $this->config($modulId, $category);
        if (!$config?->enabled) return null;
        return ['easy' => $config->easy_count, 'medium' => $config->medium_count, 'hard' => $config->hard_count];
    }

    public function randomize(Builder $query, array $counts): Collection
    {
        $result = collect();

        foreach (self::LEVELS as $level) {
            $wanted = (int) ($counts[$level] ?? 0);
            if (!$wanted) continue;

            $questions = (clone $query)
                ->where('difficulty', $level)
                ->inRandomOrder()
                ->take($wanted)
                ->get();

            $result = $result->merge($questions);
        }

        return $result->shuffle()->values();
    }

    public function restore(Builder $query, Collection $ids, array $counts): Collection
    {
        $byId = (clone $query)->whereIn('id', $ids)->get()->keyBy('id');
        $stored = $ids->map(fn ($id) => $byId->get($id))->filter()->values();
        $result = collect();

        foreach (self::LEVELS as $level) {
            $wanted = (int) ($counts[$level] ?? 0);
            if (!$wanted) continue;

            $kept = $stored
                ->filter(fn ($question) => $question->difficulty === $level)
                ->take($wanted)
                ->values();

            $missing = max(0, $wanted - $kept->count());

            if ($missing > 0) {
                $excludedIds = $result->merge($kept)->pluck('id');

                $extra = (clone $query)
                    ->where('difficulty', $level)
                    ->whereNotIn('id', $excludedIds)
                    ->inRandomOrder()
                    ->take($missing)
                    ->get();

                $kept = $kept->merge($extra);
            }

            $result = $result->merge($kept);
        }

        return $result->values();
    }

    public function isTot(?Praktikan $praktikan): bool
    {
        if (!$praktikan) return false;

        $praktikan->loadMissing('kelas');
        $kelas = $praktikan->kelas;

        if ($kelas && $kelas->is_tot !== null) return (bool) $kelas->is_tot;

        $name = strtoupper($kelas->kelas ?? '');

        return $name !== '' && str_contains($name, 'TOT');
    }

    public function scoreTotal(?Praktikan $praktikan, int $modulId, string $category, string $modelClass): int
    {
        $query = $modelClass::where('modul_id', $modulId);
        $bankTotal = (clone $query)->count();

        if ($this->isTot($praktikan)) return $bankTotal;

        $counts = $this->counts($modulId, $category);

        if (!$counts) return min(10, $bankTotal);

        $total = 0;

        foreach (self::LEVELS as $level) {
            $wanted = (int) ($counts[$level] ?? 0);
            $available = (clone $query)->where('difficulty', $level)->count();
            $total += min($wanted, $available);
        }

        return $total;
    }
}
