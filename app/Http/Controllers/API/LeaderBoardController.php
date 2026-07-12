<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeaderBoardController extends Controller
{
    private function buildLeaderboardQuery(?int $kelasId = null): Builder
    {
        $query = DB::table('praktikans')
            ->leftJoin('nilais', 'praktikans.id', '=', 'nilais.praktikan_id')
            ->leftJoin('kelas', 'praktikans.kelas_id', '=', 'kelas.id')
            ->select([
                'praktikans.id as praktikan_id',
                'praktikans.nama as praktikan_name',
                'praktikans.nim as praktikan_nim',
                'kelas.kelas as kelas_name',
            ])
            ->selectRaw('AVG(nilais.avg) as average_nilai')
            ->selectRaw('AVG(nilais.rating) as average_rating')
            ->selectRaw('COUNT(nilais.id) as nilai_count')
            ->selectRaw('COUNT(CASE WHEN nilais.rating IS NOT NULL THEN 1 END) as rating_count')
            ->selectRaw('MAX(nilais.updated_at) as last_submitted_at')
            ->groupBy('praktikans.id', 'praktikans.nama', 'praktikans.nim', 'kelas.kelas');

        if ($kelasId) {
            $query->where('praktikans.kelas_id', $kelasId);
        }

        return $query
            ->havingRaw('COUNT(nilais.id) > 0')
            ->orderByDesc('average_nilai')
            ->orderByDesc('average_rating')
            ->orderByDesc('rating_count')
            ->orderBy('praktikans.nama');
    }

    private function formatLeaderboard(Collection $rows): Collection
    {
        return $rows->map(static function ($row) {
            $averageNilai = $row->average_nilai !== null ? round((float) $row->average_nilai, 2) : null;
            $averageRating = $row->average_rating !== null ? round((float) $row->average_rating, 2) : null;

            return [
                'praktikan_id' => (int) $row->praktikan_id,
                'nama' => $row->praktikan_name,
                'nim' => $row->praktikan_nim,
                'kelas' => $row->kelas_name,
                'average_nilai' => $averageNilai,
                'average_rating' => $averageRating,
                'nilai_count' => (int) $row->nilai_count,
                'rating_count' => (int) $row->rating_count,
                'last_submitted_at' => $row->last_submitted_at,
            ];
        })->values();
    }

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kelas_id' => ['nullable', 'integer', 'exists:kelas,id'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = $this->buildLeaderboardQuery($validated['kelas_id'] ?? null);

        if (! empty($validated['limit'])) {
            $query->limit((int) $validated['limit']);
        }

        $leaderboard = $this->formatLeaderboard($query->get());

        return response()->json([
            'status' => 'success',
            'leaderboard' => $leaderboard,
            'message' => 'Leaderboard retrieved successfully.',
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $query = $this->buildLeaderboardQuery($id);

        if (! empty($validated['limit'])) {
            $query->limit((int) $validated['limit']);
        }

        $leaderboard = $this->formatLeaderboard($query->get());

        if ($leaderboard->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data untuk kelas dengan ID ini.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'leaderboard' => $leaderboard,
            'message' => 'Leaderboard retrieved successfully.',
        ]);
    }

    public function detail(Request $request, int $praktikanId): JsonResponse
    {
        $records = DB::table('nilais')
            ->join('praktikans', 'nilais.praktikan_id', '=', 'praktikans.id')
            ->leftJoin('kelas', 'praktikans.kelas_id', '=', 'kelas.id')
            ->leftJoin('moduls', 'nilais.modul_id', '=', 'moduls.id')
            ->leftJoin('asistens', 'nilais.asisten_id', '=', 'asistens.id')
            ->where('praktikans.id', $praktikanId)
            ->select([
                'praktikans.id as praktikan_id',
                'praktikans.nama as praktikan_name',
                'praktikans.nim as praktikan_nim',
                'kelas.kelas as kelas_name',
                'moduls.id as modul_id',
                'moduls.judul as modul_name',
                'nilais.tp',
                'nilais.ta',
                'nilais.d1',
                'nilais.d2',
                'nilais.d3',
                'nilais.d4',
                'nilais.l1',
                'nilais.l2',
                'nilais.avg',
                'nilais.rating',
                'nilais.updated_at as nilai_updated_at',
                'asistens.id as asisten_id',
                'asistens.nama as asisten_name',
                'asistens.kode as asisten_code',
            ])
            ->orderBy('nilais.updated_at', 'desc')
            ->orderBy('moduls.judul')
            ->get();

        if ($records->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Nilai untuk praktikan ini tidak ditemukan.',
            ], 404);
        }

        $praktikan = [
            'id' => (int) $records->first()->praktikan_id,
            'nama' => $records->first()->praktikan_name,
            'nim' => $records->first()->praktikan_nim,
            'kelas' => $records->first()->kelas_name,
        ];

        $modules = $records->map(static function ($row) {
            $scores = [
                'tp' => $row->tp !== null ? round((float) $row->tp, 2) : null,
                'ta' => $row->ta !== null ? round((float) $row->ta, 2) : null,
                'd1' => $row->d1 !== null ? round((float) $row->d1, 2) : null,
                'd2' => $row->d2 !== null ? round((float) $row->d2, 2) : null,
                'd3' => $row->d3 !== null ? round((float) $row->d3, 2) : null,
                'd4' => $row->d4 !== null ? round((float) $row->d4, 2) : null,
                'l1' => $row->l1 !== null ? round((float) $row->l1, 2) : null,
                'l2' => $row->l2 !== null ? round((float) $row->l2, 2) : null,
            ];

            return [
                'modul_id' => $row->modul_id !== null ? (int) $row->modul_id : null,
                'modul_name' => $row->modul_name,
                'average' => $row->avg !== null ? round((float) $row->avg, 2) : null,
                'rating' => $row->rating !== null ? round((float) $row->rating, 2) : null,
                'scores' => $scores,
                'asisten' => [
                    'id' => $row->asisten_id !== null ? (int) $row->asisten_id : null,
                    'nama' => $row->asisten_name,
                    'kode' => $row->asisten_code,
                ],
                'updated_at' => $row->nilai_updated_at,
            ];
        });

        $summary = [
            'nilai_count' => $modules->count(),
            'rating_count' => $modules->whereNotNull('rating')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'praktikan' => $praktikan,
            'modules' => $modules->values(),
            'summary' => $summary,
        ]);
    }
}
