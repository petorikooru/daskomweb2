<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Configuration;
use App\Models\Modul;
use App\Models\Tugaspendahuluan;
use Illuminate\Http\Request;

class TugasPendahuluanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            // Ambil data tugas pendahuluan dengan eager load activeKelas
            $tugas = Tugaspendahuluan::with('activeKelas:id')
                ->leftJoin('moduls', 'moduls.id', '=', 'tugaspendahuluans.modul_id')
                ->select('tugaspendahuluans.*', 'moduls.judul as nama_modul', 'moduls.isEnglish as modul_is_english')
                ->get();

            if ($tugas->isEmpty()) {
                $modules = Modul::select('id')->get();

                foreach ($modules as $module) {
                    Tugaspendahuluan::firstOrCreate(
                        ['modul_id' => $module->id],
                        [
                            'pembahasan' => 'empty',
                            'isActive' => 0,
                        ]
                    );
                }

                $tugas = Tugaspendahuluan::with('activeKelas:id')
                    ->leftJoin('moduls', 'moduls.id', '=', 'tugaspendahuluans.modul_id')
                    ->select('tugaspendahuluans.*', 'moduls.judul as nama_modul', 'moduls.isEnglish as modul_is_english')
                    ->get();
            }

            // Transform to include active_kelas_ids array
            $tugasTransformed = $tugas->map(function ($item) {
                $data = $item->toArray();
                $data['active_kelas_ids'] = $item->activeKelas->pluck('id')->values()->all();
                unset($data['active_kelas']);

                return $data;
            });

            $configuration = Configuration::select(
                'id',
                'tp_activation',
                'tp_schedule_enabled',
                'tp_schedule_start_at',
                'tp_schedule_end_at'
            )->first();
            if ($configuration) {
                $configuration->refreshTpActivationFromSchedule();
            }
            $tpActive = $configuration ? (bool) $configuration->tp_activation : true;

            $activeRegular = $tugas->first(function ($item) {
                return (int) ($item->isActive ?? 0) === 1 && (int) ($item->modul_is_english ?? 0) !== 1;
            });

            $activeEnglish = $tugas->first(function ($item) {
                return (int) ($item->isActive ?? 0) === 1 && (int) ($item->modul_is_english ?? 0) === 1;
            });

            return response()->json([
                'status' => 'success',
                'data' => $tugasTransformed,
                'meta' => [
                    'tp_active' => $tpActive,
                    'active_regular_modul_id' => $activeRegular->modul_id ?? null,
                    'active_english_modul_id' => $activeEnglish->modul_id ?? null,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat mengambil data tugas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        // Validasi input
        $request->validate([
            'data' => 'required|array',
            'data.*.id' => 'required|integer|exists:tugaspendahuluans,id',
            'data.*.isActive' => 'required|integer|in:0,1',
            'data.*.kelas_ids' => 'sometimes|array',
            'data.*.kelas_ids.*' => 'integer|exists:kelas,id',
        ]);

        try {
            $updatedTugas = [];
            foreach ($request->data as $item) {
                $tugas = Tugaspendahuluan::find($item['id']);

                if (! $tugas) {
                    return response()->json([
                        'message' => "Tugas dengan ID {$item['id']} tidak ditemukan.",
                    ], 404);
                }

                // Update status isActive
                $tugas->isActive = $item['isActive'];
                $tugas->updated_at = now();
                $tugas->save();

                // Sync active classes if provided
                if (array_key_exists('kelas_ids', $item)) {
                    $tugas->activeKelas()->sync($item['kelas_ids'] ?? []);
                }

                // Reload with active kelas
                $tugas->load('activeKelas:id');
                $tugasData = $tugas->toArray();
                $tugasData['active_kelas_ids'] = $tugas->activeKelas->pluck('id')->values()->all();
                unset($tugasData['active_kelas']);

                $updatedTugas[] = $tugasData;
            }

            return response()->json([
                'status' => 'success',
                'data' => $updatedTugas,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan saat mengupdate tugas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
