<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Asisten;
use App\Models\LaporanPraktikan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanPraktikanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pesan' => 'required_without:laporan|string',
            'laporan' => 'required_without:pesan|string',
            'modul_id' => 'required|integer|exists:moduls,id',
            'praktikan_id' => 'required|integer|exists:praktikans,id',
            'asisten_id' => 'required_without:kode|nullable|integer|exists:asistens,id',
            'kode' => 'required_without:asisten_id|nullable|string|max:3',
            'rating' => 'nullable|numeric|min:0|max:5',
            'rating_praktikum' => 'nullable|numeric|min:0|max:5',
            'rating_asisten' => 'nullable|numeric|min:0|max:5',
        ]);

        $message = $validated['pesan'] ?? $validated['laporan'] ?? '';
        $trimmedMessage = trim($message);

        if ($trimmedMessage === '') {
            return response()->json([
                'status' => 'error',
                'message' => 'Pesan feedback tidak boleh kosong.',
            ], 422);
        }

        $assistant = null;

        if (! empty($validated['asisten_id'])) {
            $assistant = Asisten::find($validated['asisten_id']);
        }

        if (! $assistant && ! empty($validated['kode'])) {
            $assistant = Asisten::where('kode', $validated['kode'])->first();
        }

        if (! $assistant) {
            return response()->json([
                'status' => 'error',
                'message' => 'Asisten tidak ditemukan. Mohon konfirmasi dengan tim JIN/FYN.',
            ], 404);
        }

        $ratingPraktikum = $validated['rating_praktikum'] ?? $validated['rating'] ?? null;
        $ratingAsisten = $validated['rating_asisten'] ?? null;

        $laporan = LaporanPraktikan::create([
            'pesan' => $trimmedMessage,
            'asisten_id' => $assistant->id,
            'modul_id' => $validated['modul_id'],
            'praktikan_id' => $validated['praktikan_id'],
            'rating_praktikum' => $ratingPraktikum,
            'rating_asisten' => $ratingAsisten,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Feedback berhasil dikirim.',
            'laporan_id' => $laporan->id,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Ambil laporan berdasarkan ID asisten
        $laporan = LaporanPraktikan::where('asisten_id', $id)
            ->leftJoin('moduls', 'moduls.id', '=', 'laporan_praktikans.modul_id')
            ->leftJoin('praktikans', 'praktikans.id', '=', 'laporan_praktikans.praktikan_id')
            ->leftJoin('kelas', 'kelas.id', '=', 'praktikans.kelas_id')
            ->select(
                'laporan_praktikans.id',
                'laporan_praktikans.pesan',
                'laporan_praktikans.rating_praktikum',
                'laporan_praktikans.rating_asisten',
                'laporan_praktikans.created_at',
                'laporan_praktikans.updated_at',
                'laporan_praktikans.asisten_id',
                'laporan_praktikans.modul_id',
                'laporan_praktikans.praktikan_id',
                'moduls.judul as modul_judul',
                'kelas.kelas as kelas',
                'kelas.id as id_kelas',
                'kelas.hari as hari',
                'kelas.shift as shift',
                'praktikans.nim as nim',
                'praktikans.nama as nama'
            )
            ->get();
        // Cek jika tidak ada laporan ditemukan
        if ($laporan->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada laporan yang ditemukan untuk asisten ini.',
            ], 404);
        }

        // Return laporan
        return response()->json([
            'status' => 'success',
            'laporan' => $laporan,
            'message' => 'Laporan praktikan retrieved successfully.',
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function unmarkedSummary(): JsonResponse
    {
        $summary = LaporanPraktikan::query()
            ->join('asistens', 'asistens.id', '=', 'laporan_praktikans.asisten_id')
            ->leftJoin('nilais', function ($join) {
                $join->on('nilais.praktikan_id', '=', 'laporan_praktikans.praktikan_id')
                    ->on('nilais.modul_id', '=', 'laporan_praktikans.modul_id')
                    ->on('nilais.asisten_id', '=', 'laporan_praktikans.asisten_id');
            })
            ->whereNull('nilais.id')
            ->groupBy('asistens.id', 'asistens.nama', 'asistens.kode')
            ->orderByDesc(DB::raw('COUNT(DISTINCT laporan_praktikans.id)'))
            ->get([
                'asistens.id',
                'asistens.nama',
                'asistens.kode',
                DB::raw('COUNT(DISTINCT laporan_praktikans.id) as unmarked_reports'),
                DB::raw('COUNT(DISTINCT laporan_praktikans.praktikan_id) as unmarked_praktikan'),
            ]);

        $data = $summary->map(static function ($row) {
            return [
                'asisten' => [
                    'id' => (int) $row->id,
                    'nama' => $row->nama,
                    'kode' => $row->kode,
                ],
                'totals' => [
                    'laporan' => (int) $row->unmarked_reports,
                    'praktikan' => (int) $row->unmarked_praktikan,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
