<?php

namespace App\Services\Praktikum;

use App\Models\Praktikan;
use App\Models\Praktikum;
use App\Models\SoalFitb;
use App\Models\SoalJurnal;
use App\Models\SoalMandiri;
use App\Models\SoalTa;
use App\Models\SoalTk;
use Illuminate\Contracts\Cache\Factory as CacheFactory;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class QuestionProgressService
{
    private CacheRepository $cacheStore;

    private string $storeName;

    public function __construct(private CacheFactory $cacheFactory)
    {
        $this->storeName = (string) config('cache.snapshot_store', 'redis');
        $this->cacheStore = $this->cacheFactory->store($this->storeName);
    }

    /**
     * @return array{
     *     praktikumId:int,
     *     activePhase:string,
     *     phaseMap:array<string, array<string, mixed>>,
     *     totals:array<string, int>,
     *     participants:array<int, array{id:int,nim:string,nama:string,phaseKey:string,answeredCount:int,totalQuestions:int,lastUpdateAt:?string}>,
     *     generatedAt:string
     * }
     */
    public function buildForPraktikum(Praktikum $praktikum): array
    {
        $praktikum->loadMissing([
            'kelas.praktikans:id,nim,nama,kelas_id,dk',
            'modul:id',
        ]);

        $kelas = $praktikum->kelas;
        if (! $kelas) {
            return $this->emptyPayload($praktikum, 'preparation');
        }

        $participants = $kelas->praktikans ?? collect();
        $participantCollection = $participants instanceof Collection ? $participants : collect($participants);
        $participantCollection = $participantCollection
            ->filter(static fn (Praktikan $praktikan) => $praktikan->dk === $praktikum->dk);

        $activePhase = $praktikum->current_phase ?? 'preparation';

        $phaseMap = $this->phaseMap();

        if (! array_key_exists($activePhase, $phaseMap)) {
            $activePhase = 'preparation';
        }

        $questionTotals = $this->computeQuestionTotals((int) $praktikum->modul_id);

        $rows = $participantCollection
            ->sortBy(fn (Praktikan $praktikan) => $praktikan->nim)
            ->values()
            ->map(function (Praktikan $praktikan) use ($praktikum, $phaseMap, $questionTotals, $activePhase) {
                return $this->buildParticipantProgress(
                    $praktikum,
                    $praktikan,
                    $phaseMap[$activePhase],
                    $questionTotals
                );
            })
            ->all();

        return [
            'praktikumId' => $praktikum->id,
            'activePhase' => $activePhase,
            'phaseMap' => $phaseMap,
            'totals' => $questionTotals,
            'participants' => $rows,
            'generatedAt' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     praktikumId:int,
     *     activePhase:string,
     *     phaseMap:array<string, array<string, mixed>>,
     *     totals:array<string, int>,
     *     participants:array<int, array{id:int,nim:string,nama:string,phaseKey:string,answeredCount:int,totalQuestions:int,lastUpdateAt:?string}>,
     *     generatedAt:string
     * }|null
     */
    public function buildForIdentifiers(int $kelasId, int $modulId, ?string $dk = null): ?array
    {
        $praktikum = Praktikum::with(['kelas.praktikans:id,nim,nama,kelas_id,dk', 'modul:id'])
            ->where('kelas_id', $kelasId)
            ->where('modul_id', $modulId)
            ->when($dk !== null, static fn ($query) => $query->where('dk', $dk))
            ->whereIn('status', ['running', 'paused'])
            ->latest('updated_at')
            ->first();

        if (! $praktikum) {
            $praktikum = Praktikum::with(['kelas.praktikans:id,nim,nama,kelas_id,dk', 'modul:id'])
                ->where('kelas_id', $kelasId)
                ->where('modul_id', $modulId)
                ->when($dk !== null, static fn ($query) => $query->where('dk', $dk))
                ->latest('updated_at')
                ->first();
        }

        if (! $praktikum) {
            return null;
        }

        return $this->buildForPraktikum($praktikum);
    }

    private function emptyPayload(Praktikum $praktikum, string $phaseKey): array
    {
        return [
            'praktikumId' => $praktikum->id,
            'activePhase' => $phaseKey,
            'phaseMap' => $this->phaseMap(),
            'totals' => $this->computeQuestionTotals((int) $praktikum->modul_id),
            'participants' => [],
            'generatedAt' => Carbon::now()->toIso8601String(),
        ];
    }

    private function buildParticipantProgress(
        Praktikum $praktikum,
        Praktikan $praktikan,
        array $phaseMeta,
        array $totals
    ): array {
        $modulId = (int) $praktikum->modul_id;
        $snapshotKey = $phaseMeta['snapshotKey'] ?? null;
        $variant = $phaseMeta['variant'] ?? 'none';

        $totalQuestions = $this->resolveTotalQuestions($praktikan->id, $modulId, $snapshotKey, $phaseMeta['totalKey'] ?? null, $totals);

        $answeredCount = 0;
        $lastUpdateAt = null;

        if ($snapshotKey !== null) {
            $snapshot = $this->cacheStore->get($this->cacheKey($praktikan->id, $modulId, $snapshotKey));

            if (is_array($snapshot)) {
                $answers = $snapshot['jawaban'] ?? [];
                if ($answers instanceof Collection) {
                    $answers = $answers->all();
                }

                if (is_array($answers)) {
                    $answeredCount = $this->countAnswers($answers, $variant);
                }

                $lastUpdateAt = $snapshot['updated_at'] ?? ($snapshot['created_at'] ?? null);
            }
        }

        return [
            'id' => $praktikan->id,
            'nim' => $praktikan->nim,
            'nama' => $praktikan->nama,
            'phaseKey' => $phaseMeta['phaseKey'],
            'answeredCount' => $answeredCount,
            'totalQuestions' => $totalQuestions,
            'lastUpdateAt' => $lastUpdateAt,
        ];
    }

    private function resolveTotalQuestions(
        int $praktikanId,
        int $modulId,
        ?string $snapshotKey,
        ?string $totalKey,
        array $totals
    ): int {
        if ($snapshotKey !== null) {
            $snapshot = $this->cacheStore->get($this->cacheKey($praktikanId, $modulId, "{$snapshotKey}_questions"));

            if (is_array($snapshot)) {
                $questionIds = $snapshot['question_ids'] ?? $snapshot['questions'] ?? null;

                if (is_array($questionIds)) {
                    return count(array_unique(array_filter($questionIds, static fn ($value) => $value !== null)));
                }
            }
        }

        if ($totalKey !== null && array_key_exists($totalKey, $totals)) {
            return (int) $totals[$totalKey];
        }

        return 0;
    }

    private function countAnswers(array $answers, string $variant): int
    {
        $count = 0;

        foreach ($answers as $value) {
            if ($this->hasAnsweredValue($value)) {
                $count++;
            }
        }

        return $count;
    }

    private function hasAnsweredValue(mixed $value): bool
    {
        if (is_string($value)) {
            $normalized = trim($value);

            return $normalized !== '' && $normalized !== '-';
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return true;
        }

        if (is_array($value)) {
            foreach ($value as $item) {
                if ($this->hasAnsweredValue($item)) {
                    return true;
                }
            }

            return false;
        }

        if (is_object($value)) {
            $stringable = method_exists($value, '__toString') ? (string) $value : null;

            if ($stringable !== null) {
                return $this->hasAnsweredValue($stringable);
            }
        }

        return $value !== null;
    }

    private function computeQuestionTotals(int $modulId): array
    {
        $taTotal = SoalTa::where('modul_id', $modulId)->count();
        $fitbTotal = SoalFitb::where('modul_id', $modulId)->count();
        $jurnalTotal = SoalJurnal::where('modul_id', $modulId)->count();
        $mandiriTotal = SoalMandiri::where('modul_id', $modulId)->count();
        $tkTotal = SoalTk::where('modul_id', $modulId)->count();

        return [
            'ta' => $taTotal,
            'fitb' => $fitbTotal,
            'jurnal' => $jurnalTotal,
            'fitb_jurnal' => $fitbTotal + $jurnalTotal,
            'mandiri' => $mandiriTotal,
            'tk' => $tkTotal,
        ];
    }

    private function phaseMap(): array
    {
        return [
            'preparation' => [
                'phaseKey' => 'preparation',
                'label' => 'Preparation',
                'snapshotKey' => null,
                'totalKey' => null,
                'variant' => 'none',
            ],
            'ta' => [
                'phaseKey' => 'ta',
                'label' => 'Tes Awal',
                'snapshotKey' => 'ta',
                'totalKey' => 'ta',
                'variant' => 'multiple-choice',
            ],
            'fitb_jurnal' => [
                'phaseKey' => 'fitb_jurnal',
                'label' => 'FITB & Jurnal',
                'snapshotKey' => 'jurnal',
                'totalKey' => 'fitb_jurnal',
                'variant' => 'essay',
            ],
            'mandiri' => [
                'phaseKey' => 'mandiri',
                'label' => 'Mandiri',
                'snapshotKey' => 'mandiri',
                'totalKey' => 'mandiri',
                'variant' => 'essay',
            ],
            'tk' => [
                'phaseKey' => 'tk',
                'label' => 'Tes Keterampilan',
                'snapshotKey' => 'tk',
                'totalKey' => 'tk',
                'variant' => 'multiple-choice',
            ],
            'feedback' => [
                'phaseKey' => 'feedback',
                'label' => 'Feedback',
                'snapshotKey' => null,
                'totalKey' => null,
                'variant' => 'none',
            ],
        ];
    }

    private function cacheKey(int $praktikanId, int $modulId, string $suffix): string
    {
        return "autosave_snapshot:{$praktikanId}:{$modulId}:{$suffix}";
    }
}
