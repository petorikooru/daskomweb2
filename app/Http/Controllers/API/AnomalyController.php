<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Nilai;
use App\Models\Praktikan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnomalyController extends Controller
{
    public function attendance(Request $request): JsonResponse
    {
        $limit = max(min((int) $request->query('limit', 200), 1000), 1);
        $kelasId = $request->query('kelas_id');
        $modulId = $request->query('modul_id');
        $dk = $request->query('dk');

        $query = Praktikan::query()
            ->select([
                'praktikans.id as praktikan_id',
                'praktikans.nama as praktikan_name',
                'praktikans.nim',
                'kelas.id as kelas_id',
                'kelas.kelas as kelas_name',
                'moduls.id as modul_id',
                'moduls.judul as modul_name',
                'praktikums.id as praktikum_id',
                'praktikums.dk',
                'praktikums.ended_at',
                'praktikums.status',
            ])
            ->join('kelas', 'kelas.id', '=', 'praktikans.kelas_id')
            ->join('praktikums', 'praktikums.kelas_id', '=', 'kelas.id')
            ->join('moduls', 'moduls.id', '=', 'praktikums.modul_id')
            ->leftJoin('laporan_praktikans as lp', function ($join) {
                $join->on('lp.praktikan_id', '=', 'praktikans.id')
                    ->on('lp.modul_id', '=', 'praktikums.modul_id');
            })
            ->where('praktikums.status', 'completed')
            ->whereNull('lp.id');

        if ($kelasId) {
            $query->where('kelas.id', $kelasId);
        }

        if ($modulId) {
            $query->where('moduls.id', $modulId);
        }

        if ($dk) {
            $query->where('praktikums.dk', strtoupper($dk));
        }

        $rows = $query
            ->orderBy('kelas.kelas')
            ->orderBy('moduls.judul')
            ->orderBy('praktikans.nama')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'count' => $rows->count(),
            ],
        ]);
    }

    public function nilai(Request $request): JsonResponse
    {
        $nonMultipleOnly = $request->boolean('non_multiple');
        $overLimitOnly = $request->boolean('over_limit');
        $kelasId = $request->query('kelas_id');
        $modulId = $request->query('modul_id');

        $fields = ['tp', 'ta', 'd1', 'd2', 'd3', 'd4', 'l1', 'l2', 'avg'];

        $query = Nilai::query()->with([
            'praktikan:id,nama,nim',
            'kelas:id,kelas',
            'modul:id,judul',
            'asisten:id,nama,kode,nomor_telepon,id_line,instagram',
        ]);

        if ($kelasId) {
            $query->where('kelas_id', $kelasId);
        }

        if ($modulId) {
            $query->where('modul_id', $modulId);
        }

        $items = $query
            ->orderByDesc('updated_at')
            ->get();

        $filtered = $items
            ->map(function (Nilai $nilai) use ($fields, $nonMultipleOnly, $overLimitOnly) {
                $flags = [
                    'non_multiple' => [],
                    'over_limit' => [],
                ];

                foreach ($fields as $field) {
                    $value = $nilai->{$field};
                    if ($value === null) {
                        continue;
                    }

                    if (! $this->isMultipleOfFive($value)) {
                        $flags['non_multiple'][] = $field;
                    }

                    if ($value > 100) {
                        $flags['over_limit'][] = $field;
                    }
                }

                $shouldInclude = true;

                if ($nonMultipleOnly && empty($flags['non_multiple'])) {
                    $shouldInclude = false;
                }

                if ($overLimitOnly && empty($flags['over_limit'])) {
                    $shouldInclude = false;
                }

                if (! $shouldInclude) {
                    return null;
                }

                return [
                    'id' => $nilai->id,
                    'praktikan' => [
                        'id' => $nilai->praktikan_id,
                        'nama' => $nilai->praktikan->nama ?? null,
                        'nim' => $nilai->praktikan->nim ?? null,
                    ],
                    'kelas' => [
                        'id' => $nilai->kelas_id,
                        'nama' => $nilai->kelas->kelas ?? null,
                    ],
                    'modul' => [
                        'id' => $nilai->modul_id,
                        'judul' => $nilai->modul->judul ?? null,
                    ],
                    'scores' => collect($fields)->mapWithKeys(fn ($field) => [$field => $nilai->{$field}])->all(),
                    'flags' => $flags,
                    'asisten' => $nilai->asisten ? [
                        'id' => $nilai->asisten_id,
                        'nama' => $nilai->asisten->nama,
                        'kode' => $nilai->asisten->kode,
                        'nomor_telepon' => $nilai->asisten->nomor_telepon,
                        'id_line' => $nilai->asisten->id_line,
                        'instagram' => $nilai->asisten->instagram,
                    ] : null,
                    'updated_at' => $nilai->updated_at,
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'data' => $filtered->values(),
            'meta' => [
                'count' => $filtered->count(),
            ],
        ]);
    }

    private function isMultipleOfFive(?float $value): bool
    {
        if ($value === null) {
            return true;
        }

        $scaled = (int) round($value * 100);

        return $scaled % 500 === 0;
    }
}
