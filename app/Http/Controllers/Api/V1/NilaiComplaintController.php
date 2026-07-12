<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Nilai;
use App\Models\NilaiComplaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NilaiComplaintController extends Controller
{
    public function store(Request $request)
    {
        $praktikan = Auth::guard('praktikan')->user();

        if (! $praktikan) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'nilai_id' => 'required|exists:nilais,id',
            'message' => 'required|string|min:10|max:1000',
        ]);

        // Verify the nilai belongs to the authenticated praktikan
        $nilai = Nilai::find($validated['nilai_id']);
        if ($nilai->praktikan_id !== $praktikan->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke nilai ini',
            ], 403);
        }

        // Check if complaint already exists for this nilai
        $existingComplaint = NilaiComplaint::where('nilai_id', $validated['nilai_id'])
            ->where('praktikan_id', $praktikan->id)
            ->where('status', 'pending')
            ->first();

        if ($existingComplaint) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah memiliki complaint pending untuk nilai ini',
            ], 422);
        }

        $complaint = NilaiComplaint::create([
            'nilai_id' => $validated['nilai_id'],
            'praktikan_id' => $praktikan->id,
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Komplain nilai berhasil dikirim',
            'data' => $complaint,
        ], 201);
    }

    public function index()
    {
        $praktikan = Auth::guard('praktikan')->user();

        if (! $praktikan) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $complaints = NilaiComplaint::where('praktikan_id', $praktikan->id)
            ->with(['nilai.modul', 'nilai.asisten'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $complaints,
        ]);
    }

    public function getForAsisten()
    {
        $asisten = Auth::guard('asisten')->user();

        if (! $asisten) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $complaints = NilaiComplaint::whereHas('nilai', function ($query) use ($asisten) {
            $query->where('asisten_id', $asisten->id);
        })
            ->with(['nilai.modul', 'praktikan'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $complaints,
        ]);
    }

    public function updateStatus(Request $request, NilaiComplaint $complaint)
    {
        $asisten = Auth::guard('asisten')->user();

        if (! $asisten) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // Verify the complaint's nilai belongs to the authenticated asisten
        if ($complaint->nilai->asisten_id !== $asisten->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke complaint ini',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,resolved,rejected',
            'notes' => 'nullable|string|max:1000',
        ]);

        $complaint->update([
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? $complaint->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status complaint berhasil diperbarui',
            'data' => $complaint->load(['nilai.modul', 'praktikan']),
        ]);
    }
}
