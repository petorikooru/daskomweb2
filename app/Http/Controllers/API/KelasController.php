<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Modul;
use App\Models\Praktikum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class KelasController extends Controller
{
    public function index()
    {
        try {
            $kelas = Kelas::all();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas retrieved successfully.',
                'kelas' => $kelas,
            ], 200);
        } catch (\Exception $e) {
            return redirect('/register?mode=praktikan')->with('error', $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'kelas' => 'required|string|unique:kelas,kelas',
            'shift' => 'required|integer',
            'hari' => 'required|string',
            'totalGroup' => 'required|integer',
            'isEnglish' => 'required|boolean',
            'is_tot' => 'nullable|boolean',
        ]);
        try {
            $kelasName = Str::upper($request->kelas);
            $hari = Str::upper($request->hari);

            $isEnglish = $request->boolean('isEnglish');
            if ($this->kelasNameIndicatesEnglish($kelasName)) {
                $isEnglish = true;
            }

            $isTot = $request->has('is_tot')
                ? $request->boolean('is_tot')
                : $this->kelasNameIndicatesTot($kelasName);

            $moduls = Modul::where('isEnglish', $isEnglish)->get();
            if ($moduls->isEmpty()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Modul belum ada, silahkan tambahkan modul terlebih dahulu.',
                ], 400);
            }
            $countSameShift = Kelas::where('shift', $request->shift)
                ->where('hari', $request->hari)
                ->count();
            if ($countSameShift >= 2) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Shift ini sudah ada 2.',
                ], 400);
            }
            $kelas = Kelas::create([
                'kelas' => $kelasName,
                'shift' => $request->shift,
                'hari' => $hari,
                'totalGroup' => $request->totalGroup,
                'isEnglish' => $isEnglish ? 1 : 0,
                'is_tot' => $isTot ? 1 : 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach ($moduls as $modul) {
                foreach (['DK1', 'DK2'] as $dk) {
                    Praktikum::create([
                        'kelas_id' => $kelas->id,
                        'modul_id' => $modul->id,
                        'dk' => $dk,
                        'isActive' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil ditambahkan.',
                'kelas' => $kelas,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create kelas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // public function update(Request $request, $id)
    // {
    //     $request->validate([
    //         'kelas' => 'required|min:8|max:10|string',
    //         'hari' => 'required|string',
    //         'shift' => 'required|integer',
    //         'totalGroup' => 'required|min:1|max:20|integer',
    //     ]);
    //     try {
    //         $kelas = Kelas::findOrFail($id);
    //         $shiftConflict = Kelas::where('shift', $request->shift)
    //             ->where('hari', $request->hari)
    //             ->where('id', '!=', $id)
    //             ->exists();
    //         if ($shiftConflict) {
    //             return response()->json([
    //                 'status' => 'error',
    //                 'message' => 'Shift ini sudah digunakan.',
    //             ], 400);
    //         }
    //         $kelas->update([
    //             'kelas' => Str::upper($request->kelas),
    //             'hari' => Str::upper($request->hari),
    //             'shift' => $request->shift,
    //             'totalGroup' => $request->totalGroup,
    //             'updated_at' => now(),
    //         ]);
    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'Kelas berhasil diupdate.',
    //             'kelas' => $kelas,
    //         ], 200);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Failed to update kelas.',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

    public function update(Request $request, $id)
    {
        $request->validate([
            'kelas' => 'required|min:8|max:10|string',
            'hari' => 'required|string',
            'shift' => 'required|integer',
            'totalGroup' => 'required|min:1|max:20|integer',
            'isEnglish' => 'required|boolean',
            'is_tot' => 'nullable|boolean',
        ]);

        try {
            $kelas = Kelas::findOrFail($id);
            $shiftConflict = Kelas::where('shift', $request->shift)
                ->where('hari', $request->hari)
                ->where('id', '!=', $id)
                ->exists();

            if ($shiftConflict) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Shift ini sudah digunakan.',
                ], 400);
            }

            $kelasName = Str::upper($request->kelas);
            $hari = Str::upper($request->hari);

            $isEnglish = $request->boolean('isEnglish');
            if ($this->kelasNameIndicatesEnglish($kelasName)) {
                $isEnglish = true;
            }

            $isTot = $request->has('is_tot')
                ? $request->boolean('is_tot')
                : ($kelas->is_tot ?? false);

            if (! $request->has('is_tot') && $this->kelasNameIndicatesTot($kelasName)) {
                $isTot = true;
            }

            $kelas->update([
                'kelas' => $kelasName,
                'hari' => $hari,
                'shift' => $request->shift,
                'totalGroup' => $request->totalGroup,
                'isEnglish' => $isEnglish ? 1 : 0,
                'is_tot' => $isTot ? 1 : 0,
                'updated_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil diupdate.',
                'kelas' => $kelas,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update kelas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // public function destroy($id)
    // {
    //     try {
    //         $kelas = Kelas::findOrFail($id);
    //         DB::transaction(function () use ($kelas) {
    //             $praktikums = Praktikum::where('kelas_id', $kelas->id);
    //             Deadline::whereIn('praktikums_id', $praktikums->pluck('id'))->delete();
    //             $praktikums->delete();
    //             $kelas->delete();
    //         });
    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'Kelas berhasil dihapus.',
    //         ], 200);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Failed to delete kelas.',
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

    public function destroy($id)
    {
        try {
            $kelas = Kelas::findOrFail($id);
            DB::transaction(function () use ($kelas) {
                $praktikums = Praktikum::where('kelas_id', $kelas->id);
                $praktikums->delete();
                $kelas->delete();
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil dihapus.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete kelas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function reset()
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('praktikans')->truncate();
            DB::table('kelas')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas dan data terkait berhasil direset.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reset data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function kelasNameIndicatesEnglish(string $kelasName): bool
    {
        return str_contains($kelasName, 'INT');
    }

    private function kelasNameIndicatesTot(string $kelasName): bool
    {
        return str_contains($kelasName, 'TOT');
    }
}
