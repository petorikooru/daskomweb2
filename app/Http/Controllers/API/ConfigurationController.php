<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Configuration;
use Illuminate\Http\Request;

class ConfigurationController extends Controller
{
    /**
     * ALL CONF GOES HERE web conf, TP conf, Unlock ans conf
     */
    public function index()
    {
        try {
            $config = Configuration::first();

            if ($config) {
                $config->refreshTpActivationFromSchedule();
            }

            return response()->json([
                'success' => true,
                'config' => $config,
                'message' => 'Configuration retrieved successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve configuration.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        try {
            $scheduleEnabled = filter_var(
                $request->input('tp_schedule_enabled', false),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false;

            $scheduleStartRules = ['nullable', 'date'];
            $scheduleEndRules = ['nullable', 'date', 'after:tp_schedule_start_at'];

            if ($scheduleEnabled) {
                $scheduleStartRules[0] = 'required';
                $scheduleEndRules[0] = 'required';
            }

            // Validasi data
            $request->validate([
                'tp_activation' => 'required|integer|in:0,1',
                'tubes_activation' => 'required|integer|in:0,1',
                'polling_activation' => 'required|integer|in:0,1',
                'registrationPraktikan_activation' => 'required|integer|in:0,1',
                'registrationAsisten_activation' => 'required|integer|in:0,1',
                'tp_schedule_enabled' => ['sometimes', 'boolean'],
                'tp_schedule_start_at' => $scheduleStartRules,
                'tp_schedule_end_at' => $scheduleEndRules,
            ]);

            // Cari atau buat record configuration
            $config = Configuration::firstOrNew(['id' => 1]);

            // Update data
            $config->tp_activation = $request->tp_activation;
            $config->tubes_activation = $request->tubes_activation;
            $config->polling_activation = $request->polling_activation;
            $config->registrationPraktikan_activation = $request->registrationPraktikan_activation;
            $config->registrationAsisten_activation = $request->registrationAsisten_activation;
            $config->tp_schedule_enabled = $scheduleEnabled;
            $config->tp_schedule_start_at = $scheduleEnabled ? $request->tp_schedule_start_at : null;
            $config->tp_schedule_end_at = $scheduleEnabled ? $request->tp_schedule_end_at : null;

            $editor = $request->user();
            $config->kode_asisten = $editor?->kode ?? 'UNK';
            $config->save();
            $config->flushTpScheduleCache();
            $config->refreshTpActivationFromSchedule(true);

            return response()->json([
                'config' => $config,
                'success' => true,
                'message' => 'Configuration updated successfully.',
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update configuration.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
