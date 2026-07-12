<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SoalFitb;
use Illuminate\Http\Request;

class SoalFITBController extends Controller
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
    public function store(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'soal' => 'required|string|max:10000',
                'enable_file_upload' => 'sometimes|boolean',
            ]);
            // Cek duplikasi soal
            $existingSoal = SoalFitb::where('modul_id', $id)
                ->where('soal', $request->soal)
                ->first();
            if ($existingSoal) {
                return response()->json([
                    'message' => 'Soal sudah terdaftar.',
                ], 400);
            }
            $soal = SoalFitb::create([
                'modul_id' => $id,
                'soal' => $validated['soal'],
                'enable_file_upload' => $request->boolean('enable_file_upload'),
            ]);

            return response()->json([
                'message' => 'Soal berhasil ditambahkan',
                'data' => $soal,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menyimpan soal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $all_fitb = SoalFitb::where('modul_id', $id)->get();
            if ($all_fitb->isEmpty()) {
                return response()->json([
                    'message' => "Soal dengan modul ID $id tidak ditemukan.",
                ], 404);
            }

            return response()->json([
                'message' => 'Soal FITB retrieved successfully.',
                'data' => $all_fitb,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil soal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $validated = $request->validate([
                'modul_id' => 'required|integer|exists:moduls,id',
                'soal' => 'required|string|max:1000',
                'enable_file_upload' => 'sometimes|boolean',
            ]);
            $soal = SoalFitb::find($id);
            if (! $soal) {
                return response()->json([
                    'message' => "Soal dengan ID $id tidak ditemukan.",
                ], 404);
            }
            // Cek duplikasi soal baru
            $duplicateSoal = SoalFitb::where('modul_id', $validated['modul_id'])
                ->where('soal', $validated['soal'])
                ->where('id', '!=', $id)
                ->first();
            if ($duplicateSoal) {
                return response()->json([
                    'message' => 'Soal sudah terdaftar.',
                ], 400);
            }
            $soal->update([
                'modul_id' => $validated['modul_id'],
                'soal' => $validated['soal'],
                'enable_file_upload' => array_key_exists('enable_file_upload', $validated)
                    ? (bool) $validated['enable_file_upload']
                    : ($soal->enable_file_upload ?? false),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Soal berhasil diperbarui.',
                'data' => $soal,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat memperbarui soal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $soal = SoalFitb::find($id);
            if (! $soal) {
                return response()->json([
                    'message' => "Soal dengan ID $id tidak ditemukan.",
                ], 404);
            }
            $soal->delete();

            return response()->json([
                'message' => 'Soal berhasil dihapus.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus soal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reset()
    {
        try {
            SoalFitb::truncate();

            return response()->json([
                'message' => 'Semua soal berhasil dihapus.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat menghapus semua soal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
