<?php

namespace App\Http\Controllers\API;

use App\Events\PraktikumProgressUpdated;
use App\Http\Controllers\Controller;
use App\Models\Praktikan;
use App\Services\Praktikum\QuestionProgressService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Cache\Repository as CacheRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\Rule;

class AutosaveSnapshotController extends Controller
{
    private const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;

    private const QUESTION_TTL_SECONDS = 60 * 60 * 24;

    private const SUPPORTED_SOAL_TYPES = [
        'ta',
        'tk',
        'jurnal',
        'fitb',
        'mandiri',
        'tm',
        'tp',
    ];

    private string $cacheStore;

    public function __construct(private QuestionProgressService $progressService)
    {
        $this->cacheStore = (string) config('cache.snapshot_store', 'redis');
    }

    private function cache(): CacheRepository
    {
        return Cache::store($this->cacheStore);
    }

    private function cacheKey(int $praktikanId, int $modulId, string $tipeSoal): string
    {
        return "autosave_snapshot:{$praktikanId}:{$modulId}:{$tipeSoal}";
    }

    private function cachePattern(int $praktikanId, ?int $modulId = null, ?string $tipeSoal = null): string
    {
        if ($modulId === null) {
            return $tipeSoal
                ? "autosave_snapshot:{$praktikanId}:*:{$tipeSoal}"
                : "autosave_snapshot:{$praktikanId}:*";
        }

        if ($tipeSoal !== null) {
            return "autosave_snapshot:{$praktikanId}:{$modulId}:{$tipeSoal}";
        }

        return "autosave_snapshot:{$praktikanId}:{$modulId}:*";
    }

    private function getRedisKeys(string $pattern): array
    {
        if ($this->cacheStore !== 'redis') {
            return [];
        }

        try {
            $redis = Redis::connection('cache');
            $keys = $redis->keys($pattern);

            $prefix = config('database.redis.options.prefix', '');
            if ($prefix === '' || empty($keys)) {
                return $keys;
            }

            return array_map(static function (string $key) use ($prefix) {
                if (str_starts_with($key, $prefix)) {
                    return substr($key, strlen($prefix));
                }

                return $key;
            }, $keys);
        } catch (\Throwable $exception) {
            report($exception);

            return [];
        }
    }

    private function resolvePraktikan(Request $request): Praktikan
    {
        $praktikan = $request->user('praktikan');

        if (! $praktikan instanceof Praktikan) {
            throw new AuthorizationException;
        }

        return $praktikan;
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul_id' => ['nullable', 'integer'],
            'tipe_soal' => ['nullable', 'string'],
        ]);

        $praktikanId = $this->resolvePraktikan($request)->id;
        $modulId = $validated['modul_id'] ?? null;
        $tipeSoal = $validated['tipe_soal'] ?? null;

        $cache = $this->cache();
        $snapshots = [];

        if ($modulId && $tipeSoal) {
            $key = $this->cacheKey($praktikanId, $modulId, $tipeSoal);
            $snapshot = $cache->get($key);

            if ($snapshot !== null) {
                $snapshots[] = $snapshot;
            }

            return response()->json([
                'success' => true,
                'data' => $snapshots,
            ]);
        }

        if ($modulId) {
            $pattern = $this->cachePattern($praktikanId, $modulId);
            $keys = $this->getRedisKeys($pattern);

            foreach ($keys as $key) {
                $snapshot = $cache->get($key);
                if ($snapshot !== null) {
                    $snapshots[] = $snapshot;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $snapshots,
            ]);
        }

        if ($praktikanId) {
            $pattern = $this->cachePattern($praktikanId);
            $keys = $this->getRedisKeys($pattern);

            foreach ($keys as $key) {
                $snapshot = $cache->get($key);
                if ($snapshot !== null) {
                    $snapshots[] = $snapshot;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $snapshots,
            ]);
        }

        $keys = $this->getRedisKeys('autosave_snapshot:*');
        foreach ($keys as $key) {
            $snapshot = $cache->get($key);
            if ($snapshot !== null) {
                $snapshots[] = $snapshot;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $snapshots,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul_id' => ['required', 'integer', 'exists:moduls,id'],
            'tipe_soal' => ['required', Rule::in(self::SUPPORTED_SOAL_TYPES)],
            'jawaban' => ['required', 'array'],
        ]);

        $praktikanId = $this->resolvePraktikan($request)->id;

        $cache = $this->cache();
        $key = $this->cacheKey(
            $praktikanId,
            (int) $validated['modul_id'],
            $validated['tipe_soal']
        );

        $existing = $cache->get($key);
        $timestamp = Carbon::now()->toISOString();

        $payload = [
            'praktikan_id' => $praktikanId,
            'modul_id' => (int) $validated['modul_id'],
            'tipe_soal' => $validated['tipe_soal'],
            'jawaban' => $validated['jawaban'],
            'updated_at' => $timestamp,
            'created_at' => $existing['created_at'] ?? $timestamp,
        ];

        $ttl = (int) config('cache.snapshot_ttl', self::DEFAULT_TTL_SECONDS);
        $cache->put($key, $payload, $ttl);

        $this->broadcastProgressUpdates([
            [
                'praktikan_id' => $praktikanId,
                'modul_id' => (int) $validated['modul_id'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function bulkUpsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.modul_id' => ['required', 'integer', 'exists:moduls,id'],
            'items.*.tipe_soal' => ['required', Rule::in(self::SUPPORTED_SOAL_TYPES)],
            'items.*.jawaban' => ['required', 'array'],
        ]);

        $cache = $this->cache();
        $ttl = (int) config('cache.snapshot_ttl', self::DEFAULT_TTL_SECONDS);
        $timestamp = Carbon::now()->toISOString();

        $praktikanId = (int) $this->resolvePraktikan($request)->id;

        $pairs = [];

        foreach ($validated['items'] as $item) {
            $key = $this->cacheKey(
                $praktikanId,
                (int) $item['modul_id'],
                $item['tipe_soal']
            );

            $existing = $cache->get($key);

            $payload = [
                'praktikan_id' => $praktikanId,
                'modul_id' => (int) $item['modul_id'],
                'tipe_soal' => $item['tipe_soal'],
                'jawaban' => $item['jawaban'],
                'updated_at' => $timestamp,
                'created_at' => $existing['created_at'] ?? $timestamp,
            ];

            $cache->put($key, $payload, $ttl);

            $pairs[] = [
                'praktikan_id' => $praktikanId,
                'modul_id' => (int) $item['modul_id'],
            ];
        }

        $this->broadcastProgressUpdates($pairs);

        return response()->json([
            'success' => true,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul_id' => ['required', 'integer', 'exists:moduls,id'],
            'tipe_soal' => ['nullable', Rule::in(self::SUPPORTED_SOAL_TYPES)],
        ]);

        $cache = $this->cache();
        $deleted = 0;

        $praktikanId = (int) $this->resolvePraktikan($request)->id;
        $modulId = (int) $validated['modul_id'];

        if (! empty($validated['tipe_soal'])) {
            $key = $this->cacheKey($praktikanId, $modulId, $validated['tipe_soal']);
            if ($cache->forget($key)) {
                $deleted++;
            }

            $this->broadcastProgressUpdates([
                [
                    'praktikan_id' => $praktikanId,
                    'modul_id' => $modulId,
                ],
            ]);

            return response()->json([
                'success' => true,
                'deleted' => $deleted,
            ]);
        }

        foreach (self::SUPPORTED_SOAL_TYPES as $tipeSoal) {
            $key = $this->cacheKey($praktikanId, $modulId, $tipeSoal);
            if ($cache->forget($key)) {
                $deleted++;
            }
        }

        $this->broadcastProgressUpdates([
            [
                'praktikan_id' => $praktikanId,
                'modul_id' => $modulId,
            ],
        ]);

        return response()->json([
            'success' => true,
            'deleted' => $deleted,
        ]);
    }

    public function storeQuestionIds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul_id' => ['required', 'integer', 'exists:moduls,id'],
            'tipe_soal' => ['required', Rule::in(['ta', 'tk', 'mandiri'])],
            'question_ids' => ['required', 'array', 'min:1'],
            'question_ids.*' => ['integer'],
        ]);

        $praktikanId = (int) $this->resolvePraktikan($request)->id;

        $cache = $this->cache();
        $suffix = "{$validated['tipe_soal']}_questions";
        $key = $this->cacheKey(
            $praktikanId,
            (int) $validated['modul_id'],
            $suffix
        );

        if ($cache->has($key)) {
            $existing = $cache->get($key);

            return response()->json([
                'success' => true,
                'question_ids' => $existing['question_ids'] ?? [],
                'created_at' => $existing['created_at'] ?? null,
                'message' => 'Question IDs already stored.',
            ]);
        }

        $timestamp = Carbon::now()->toISOString();
        $payload = [
            'praktikan_id' => $praktikanId,
            'modul_id' => (int) $validated['modul_id'],
            'tipe_soal' => $suffix,
            'question_ids' => $validated['question_ids'],
            'updated_at' => $timestamp,
            'created_at' => $timestamp,
        ];

        $ttl = (int) config('cache.question_snapshot_ttl', self::QUESTION_TTL_SECONDS);
        $cache->put($key, $payload, $ttl);

        $this->broadcastProgressUpdates([
            [
                'praktikan_id' => $praktikanId,
                'modul_id' => (int) $validated['modul_id'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'question_ids' => $validated['question_ids'],
            'message' => 'Question IDs stored successfully.',
        ]);
    }

    public function getQuestionIds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modul_id' => ['required', 'integer', 'exists:moduls,id'],
            'tipe_soal' => ['required', Rule::in(['ta', 'tk', 'mandiri'])],
        ]);

        $praktikanId = (int) $this->resolvePraktikan($request)->id;

        $cache = $this->cache();
        $suffix = "{$validated['tipe_soal']}_questions";
        $key = $this->cacheKey(
            $praktikanId,
            (int) $validated['modul_id'],
            $suffix
        );

        $snapshot = $cache->get($key);
        if ($snapshot === null) {
            return response()->json([
                'success' => true,
                'question_ids' => [],
                'has_stored_questions' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'question_ids' => $snapshot['question_ids'] ?? [],
            'has_stored_questions' => true,
            'created_at' => $snapshot['created_at'] ?? null,
        ]);
    }

    private function broadcastProgressUpdates(array $pairs): void
    {
        if (empty($pairs)) {
            return;
        }

        $praktikanIds = array_values(array_unique(array_map(
            static fn (array $pair): int => (int) ($pair['praktikan_id'] ?? 0),
            $pairs
        )));

        if (empty($praktikanIds)) {
            return;
        }

        $praktikans = Praktikan::query()
            ->select(['id', 'kelas_id', 'dk'])
            ->whereIn('id', $praktikanIds)
            ->get()
            ->keyBy('id');

        $targets = [];

        foreach ($pairs as $pair) {
            $praktikanId = (int) ($pair['praktikan_id'] ?? 0);
            $modulId = (int) ($pair['modul_id'] ?? 0);

            if ($praktikanId === 0 || $modulId === 0) {
                continue;
            }

            $praktikan = $praktikans->get($praktikanId);
            if (! $praktikan || ! $praktikan->kelas_id) {
                continue;
            }

            $key = $praktikan->kelas_id.':'.$praktikan->dk.':'.$modulId;

            if (! isset($targets[$key])) {
                $targets[$key] = [
                    'kelas_id' => (int) $praktikan->kelas_id,
                    'dk' => $praktikan->dk,
                    'modul_id' => $modulId,
                ];
            }
        }

        foreach ($targets as $target) {
            $progress = $this->progressService->buildForIdentifiers(
                $target['kelas_id'],
                $target['modul_id'],
                $target['dk'] ?? null
            );

            if (! $progress || empty($progress['praktikumId'])) {
                continue;
            }

            broadcast(new PraktikumProgressUpdated($progress['praktikumId'], $progress));
        }
    }
}
