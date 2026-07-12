<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\JawabanFitb;
use App\Models\Modul;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JawabanFITBController extends Controller
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
            JawabanFitb::where('praktikan_id', $request->input('0.praktikan_id'))
                ->where('modul_id', $request->input('0.modul_id'))
                ->delete();
            for ($i = 0; $i < count($request->all()); $i++) {
                JawabanFitb::create([
                    'praktikan_id' => $request->input($i.'.praktikan_id'),
                    'modul_id' => $request->input($i.'.modul_id'),
                    'soal_id' => $request->input($i.'.soal_id'),
                    'jawaban' => $request->input($i.'.jawaban') == '' ? '-' : $request->input($i.'.jawaban'),
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Data berhasil disimpan.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyimpan data.',
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
            if ($modul->isQuestionTypeUnlocked('fitb')) {
                $jawaban = JawabanFitb::where('praktikan_id', $praktikan->id)
                    ->where('modul_id', $idModul)
                    ->get();

                return response()->json([
                    'status' => 'success',
                    'jawaban_fitb' => $jawaban,
                    'message' => 'Jawaban berhasil diambil.',
                ], 200);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Jawaban masih terkunci.',
            ], 403);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Modul tidak ditemukan.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function showAsisten(int $praktikanId, int $modulId)
    {
        try {
            $jawaban = JawabanFitb::with('soal_fitb')
                ->where('praktikan_id', $praktikanId)
                ->where('modul_id', $modulId)
                ->get()
                ->map(function (JawabanFitb $item) {
                    return [
                        'soal_id' => $item->soal_id,
                        'soal_text' => $item->soal_fitb?->soal,
                        'jawaban' => $item->jawaban,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'jawaban_fitb' => $jawaban,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Jawaban FITB tidak ditemukan.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menemukan jawaban.',
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
