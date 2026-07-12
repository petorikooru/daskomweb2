<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Asisten;
use App\Models\Polling;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PollingsController extends Controller
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
        $validator = Validator::make($request->all(), [
            '*.polling_id' => 'required|integer|exists:jenis_pollings,id',
            '*.kode' => 'required|string|exists:asistens,kode',
            '*.praktikan_id' => 'required|integer|exists:praktikans,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            foreach ($request->all() as $submission) {
                $asisten = Asisten::where('kode', $submission['kode'])->first();
                if (! $asisten) {
                    throw new \Exception("Asisten with code {$submission['kode']} not found.");
                }

                $polling = Polling::where('praktikan_id', $submission['praktikan_id'])
                    ->where('polling_id', $submission['polling_id'])
                    ->first();

                if ($polling) {
                    $polling->update([
                        'asisten_id' => $asisten->id,
                        'updated_at' => now(),
                    ]);
                } else {
                    Polling::create([
                        'asisten_id' => $asisten->id,
                        'polling_id' => $submission['polling_id'],
                        'praktikan_id' => $submission['praktikan_id'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'All pollings submitted successfully',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while processing the request.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $asisten = DB::table('pollings')
                ->join('asistens', 'asistens.id', '=', 'pollings.asisten_id')
                ->where('pollings.polling_id', $id)
                ->select('asistens.id', 'asistens.nama', 'asistens.kode', DB::raw('count(pollings.id) as total'))
                ->groupBy('asistens.id', 'asistens.nama', 'asistens.kode')
                ->orderBy('total', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'polling' => $asisten,
                'message' => 'Poll count by assistant code retrieved successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred while retrieving the data.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request) // praktikan
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
