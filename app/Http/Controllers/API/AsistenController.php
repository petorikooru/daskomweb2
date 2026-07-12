<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Asisten;
use App\Models\FotoAsisten;
use App\Services\ImageKitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class AsistenController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $query = Asisten::query()
                ->leftJoin('foto_asistens', 'foto_asistens.kode', '=', 'asistens.kode')
                ->withAvg('laporan_praktikans as rating', 'rating_asisten')
                ->orderBy('asistens.kode', 'asc');

            if (auth()->guard('asisten')->user()) {
                $query->leftJoin('roles', 'roles.id', '=', 'asistens.role_id')
                    ->select(
                        'asistens.id',
                        'asistens.nama',
                        'asistens.kode',
                        'foto_asistens.foto',
                        'roles.name as role',
                        'asistens.role_id',
                        'asistens.nomor_telepon',
                        'asistens.id_line',
                        'asistens.instagram',
                        'asistens.deskripsi'
                    );
            } else {
                $query->select(
                    'asistens.id',
                    'asistens.nama',
                    'asistens.kode',
                    'foto_asistens.foto',
                    'asistens.nomor_telepon',
                    'asistens.id_line',
                    'asistens.instagram',
                    'asistens.deskripsi'
                );
            }

            $asisten = $query->get();

            return response()->json([
                'success' => true,
                'asisten' => $asisten,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve Asisten.',
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {

        $request->validate([
            'nomor_telepon' => 'required|string',
            'id_line' => 'required|string',
            'instagram' => 'required|string',
            'deskripsi' => 'required|string',
            // 'password' => 'required|string',
        ]);
        try {
            $asisten = Asisten::find(auth()->guard('asisten')->user()->id);
            if (! $asisten) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asisten not found.',
                ], 404);
            }
            $asisten->nomor_telepon = $request->nomor_telepon;
            $asisten->id_line = $request->id_line;
            $asisten->instagram = $request->instagram;
            $asisten->deskripsi = $request->deskripsi;
            $asisten->save();

            return redirect()->back()->with('success', 'Asisten updated successfully.');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update Asisten.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updatePp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file_id' => 'required|string',
            'url' => 'required|string|url',
            'file_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator->errors());
        }

        try {
            $user = auth('asisten')->user();
            $imageKitService = app(ImageKitService::class);

            // Find existing record
            $foto = FotoAsisten::where('kode', $user->kode)->first();

            // If an old image exists, delete it from ImageKit
            if ($foto && $foto->file_id) {
                try {
                    $imageKitService->deleteFile($foto->file_id);
                } catch (\Exception $e) {
                    // Log but don't fail - old file might already be deleted
                    report($e);
                }
            }

            // Create or update FotoAsisten entry with metadata from client
            if ($foto) {
                $foto->update([
                    'foto' => $request->url,
                    'file_id' => $request->file_id,
                ]);
            } else {
                FotoAsisten::create([
                    'kode' => $user->kode,
                    'foto' => $request->url,
                    'file_id' => $request->file_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return back()->with('success', 'Profile picture updated successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Something went wrong: '.$e->getMessage());
        }
    }

    public function destroyPp()
    {
        try {
            $imageKitService = app(ImageKitService::class);
            $user = auth('asisten')->user();

            // Find existing record
            $foto = FotoAsisten::where('kode', $user->kode)->first();

            // If an image exists, delete it from ImageKit
            if ($foto && $foto->file_id) {
                $imageKitService->deleteFile($foto->file_id);
                FotoAsisten::where('kode', $user->kode)->delete();
            }

            return back()->with('success', 'Profile picture deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete profile picture: '.$e->getMessage());
        }
    }

    /**
     * change password of asisten fixed
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        try {

            $asisten = Asisten::find(auth()->guard('asisten')->user()->id);

            if (! $asisten) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Asisten not found.',
                    ], 404);
                }

                return redirect()->back()->withErrors([
                    'error' => 'Asisten not found.',
                ]);
            }

            if (! Hash::check($request->current_password, $asisten->password)) {
                $message = 'Password Sebelunmnya tidak sesuai';

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => $message,
                        'errors' => [
                            'current_password' => [$message],
                        ],
                    ], 422);
                }

                return redirect()->back()->withErrors([
                    'current_password' => $message,
                ]);
            }

            $asisten->password = Hash::make($request->password);
            $asisten->save();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Password berhasil diubah',
                ]);
            }

            return redirect()->back()->with('success', 'Password berhasil diubah');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'gagal mengubah password',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'gagal mengubah password: '.$e->getMessage(),
            ]);
        }
    }

    public function destroy(Request $request)
    {
        try {
            $data = request()->input('asistens', []);

            if (empty($data)) {
                return redirect(route('manage-role'))->with('error', 'No data provided.');
            }

            foreach ($data as $kode) {
                $asisten = Asisten::where('kode', $kode)->first();

                if (! $asisten) {
                    return redirect(route('manage-role'))->with('error', "Asisten with kode $kode not found.");
                }

                $role = Role::find($asisten->role_id);
                if ($role) {
                    $asisten->removeRole($role->name);
                }

                $asisten->delete();
            }

            // Return success message
            return redirect(route('manage-role'))->with('success', 'Selected Asistens deleted successfully.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Asisten or Role not found.',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete Asisten.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
