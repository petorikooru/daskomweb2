<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JawabanJurnal;
use App\Models\Modul;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JawabanJurnalController extends Controller
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
    public function store(Request $request)
    {
        try {
            $request->validate([
                '0.praktikan_id' => 'required|integer',
                '0.modul_id' => 'required|integer',
                '*.soal_id' => 'required|integer',
                '*.jawaban' => 'nullable|string',
                '*.attachment_url' => 'nullable|string',
                '*.attachment_file_id' => 'nullable|string',
            ]);
            JawabanJurnal::where('praktikan_id', $request->input('0.praktikan_id'))
                ->where('modul_id', $request->input('0.modul_id'))
                ->delete();
            foreach ($request->all() as $index => $data) {
                JawabanJurnal::create([
                    'praktikan_id' => $data['praktikan_id'],
                    'modul_id' => $data['modul_id'],
                    'soal_id' => $data['soal_id'],
                    'jawaban' => empty($data['jawaban']) ? '-' : $data['jawaban'],
                    'attachment_url' => $data['attachment_url'] ?? null,
                    'attachment_file_id' => $data['attachment_file_id'] ?? null,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Jawaban jurnal berhasil disimpan.',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menyimpan jawaban jurnal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(int $idModul): JsonResponse
    {
        try {
            $praktikan = auth('praktikan')->user();

            if (! $praktikan) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized.',
                ], 401);
            }

            $modul = Modul::findOrFail($idModul);
            if ($modul->isQuestionTypeUnlocked('jurnal')) {
                $jawaban = JawabanJurnal::where('praktikan_id', $praktikan->id)
                    ->where('modul_id', $idModul)
                    ->get();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Jawaban Jurnal Berhasil diambil',
                    'jawaban_jurnal' => $jawaban,
                ], 200);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Jawaban masih terkunci.',
            ], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Modul Tidak ditemukan Hub ATC',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi Kesalahan saat mengambil data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function showAsisten(int $praktikanId, int $modulId)
    {
        try {
            $jawaban = JawabanJurnal::with('soal_jurnal')
                ->where('praktikan_id', $praktikanId)
                ->where('modul_id', $modulId)
                ->get()
                ->map(function (JawabanJurnal $item) {
                    return [
                        'soal_id' => $item->soal_id,
                        'soal_text' => $item->soal_jurnal?->soal,
                        'jawaban' => $item->jawaban,
                        'attachment_url' => $item->attachment_url,
                        'attachment_file_id' => $item->attachment_file_id,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'jawaban_jurnal' => $jawaban,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Jawaban tidak ditemukan.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data.',
                'error' => $e->getMessage(),
            ], 500);
        }
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
}
