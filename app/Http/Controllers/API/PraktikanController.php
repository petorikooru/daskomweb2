<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePraktikanRequest;
use App\Http\Requests\UpdatePraktikanRequest;
use App\Http\Resources\PraktikanResource;
use App\Models\Asisten;
use App\Models\LaporanPraktikan;
use App\Models\Nilai;
use App\Models\Praktikan;
use App\Services\ImageKitService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class PraktikanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(5, min($perPage, 1000));
        $search = trim((string) $request->input('search', ''));
        $kelasId = $request->input('kelas_id');
        $dk = $request->input('dk');

        $praktikans = Praktikan::query()
            ->with('kelas')
            ->when($search !== '', static function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('nama', 'like', "%{$search}%")
                        ->orWhere('nim', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($kelasId, static fn ($query) => $query->where('kelas_id', $kelasId))
            ->when($dk, static fn ($query) => $query->where('dk', $dk))
            ->orderBy('nama')
            ->paginate($perPage)
            ->appends($request->query());

        return PraktikanResource::collection($praktikans)
            ->additional([
                'success' => true,
                'filters' => [
                    'search' => $search !== '' ? $search : null,
                    'kelas_id' => $kelasId ? (int) $kelasId : null,
                    'dk' => $dk ?: null,
                ],
            ])
            ->response();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePraktikanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $praktikan = Praktikan::create([
                'nama' => $validated['nama'],
                'nim' => $validated['nim'],
                'email' => $validated['email'],
                'nomor_telepon' => $validated['nomor_telepon'],
                'alamat' => $validated['alamat'],
                'kelas_id' => $validated['kelas_id'],
                'dk' => $validated['dk'],
                'password' => Hash::make($validated['password']),
            ]);

            $praktikan->assignRole('PRAKTIKAN');

            return (new PraktikanResource($praktikan->load('kelas')))
                ->additional([
                    'success' => true,
                    'message' => 'Praktikan berhasil ditambahkan.',
                ])
                ->response()
                ->setStatusCode(201);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menambahkan praktikan.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Praktikan $praktikan): JsonResponse
    {
        return (new PraktikanResource($praktikan->load('kelas')))
            ->additional([
                'success' => true,
            ])
            ->response();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePraktikanRequest $request, Praktikan $praktikan): JsonResponse
    {
        $validated = $request->validated();

        try {
            $updatePayload = [
                'nama' => $validated['nama'],
                'nim' => $validated['nim'],
                'email' => $validated['email'],
                'nomor_telepon' => $validated['nomor_telepon'],
                'alamat' => $validated['alamat'],
                'kelas_id' => $validated['kelas_id'],
                'dk' => $validated['dk'],
            ];

            if (! empty($validated['password'])) {
                $updatePayload['password'] = Hash::make($validated['password']);
            }

            $praktikan->update($updatePayload);

            return (new PraktikanResource($praktikan->fresh('kelas')))
                ->additional([
                    'success' => true,
                    'message' => 'Praktikan berhasil diperbarui.',
                ])
                ->response();
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui praktikan.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Praktikan $praktikan): JsonResponse
    {
        try {
            $praktikan->tokens()->delete();
            $praktikan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Praktikan berhasil dihapus.',
            ]);
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23000') {
                return response()->json([
                    'success' => false,
                    'message' => 'Praktikan tidak dapat dihapus karena masih memiliki relasi aktif.',
                    'error' => $exception->getMessage(),
                ], 409);
            }

            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus praktikan.',
                'error' => $exception->getMessage(),
            ], 500);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus praktikan.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    public function setPraktikan(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'nim' => 'required|exists:praktikans,nim',
            'modul_id' => 'required|exists:moduls,id',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors(),
            ], 400);
        }

        try {
            // Get the current logged in asisten (full user model)
            $asisten = Auth::user();
            $asisten_id = Auth::id();

            if (! $asisten) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asisten not found for this user',
                ], 404);
            }

            // Get the praktikan by NIM
            $praktikan = Praktikan::where('nim', $request->nim)->first();

            if (! $praktikan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Praktikan with this NIM not found',
                ], 404);
            }

            $laporanPraktikan = LaporanPraktikan::firstOrCreate(
                [
                    'praktikan_id' => $praktikan->id,
                    'modul_id' => $request->modul_id,
                ],
                [
                    'asisten_id' => $asisten->id,
                    'pesan' => 'pulled by '.$asisten->kode,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $nilai = Nilai::where('praktikan_id', $praktikan->id)
                ->where('modul_id', $request->modul_id)
                ->first();

            if ($nilai) {
                $nilai->asisten_id = $asisten->id;
                $nilai->updated_at = now();
                $nilai->save();
            }
            $laporanPraktikan->asisten_id = $asisten->id;
            $laporanPraktikan->pesan = 'pulled by '.$asisten->kode;
            $laporanPraktikan->updated_at = now();
            $laporanPraktikan->save();

            return response()->json([
                'success' => true,
                'message' => 'Praktikan successfully assigned to asisten',
                'data' => [
                    'laporan_praktikan' => $laporanPraktikan,
                    'nilai' => $nilai ?? null,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning praktikan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getAssignedPraktikan(Request $request): JsonResponse
    {
        $assistant = $request->user('asisten');

        if (! $assistant) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $assignments = LaporanPraktikan::with([
                'praktikan.kelas',
                'modul',
            ])
                ->where('asisten_id', $assistant->id)
                ->latest('updated_at')
                ->get();

            if ($assignments->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Belum ada praktikan yang ditarik.',
                ]);
            }

            $nilaiLookup = Nilai::where('asisten_id', $assistant->id)
                ->whereIn('praktikan_id', $assignments->pluck('praktikan_id'))
                ->whereIn('modul_id', $assignments->pluck('modul_id'))
                ->get()
                ->keyBy(fn (Nilai $nilai) => $nilai->praktikan_id.'-'.$nilai->modul_id);

            $data = $assignments->map(static function (LaporanPraktikan $assignment) use ($nilaiLookup) {
                $praktikan = $assignment->praktikan;
                $kelas = $praktikan?->kelas;
                $nilai = $nilaiLookup->get($assignment->praktikan_id.'-'.$assignment->modul_id);
                $timestamp = $assignment->updated_at ?? $assignment->created_at;

                return [
                    'id' => $assignment->id,
                    'pesan' => $assignment->pesan,
                    'rating_praktikum' => $assignment->rating_praktikum,
                    'rating_asisten' => $assignment->rating_asisten,
                    'timestamps' => [
                        'assigned_at' => optional($assignment->created_at)->toIso8601String(),
                        'updated_at' => optional($assignment->updated_at)->toIso8601String(),
                    ],
                    'datetime' => [
                        'date' => optional($timestamp)->toDateString(),
                        'time' => optional($timestamp)->format('H:i:s'),
                    ],
                    'modul' => [
                        'id' => $assignment->modul?->id,
                        'judul' => $assignment->modul?->judul,
                    ],
                    'praktikan' => [
                        'id' => $praktikan?->id,
                        'nama' => $praktikan?->nama,
                        'nim' => $praktikan?->nim,
                        'kelas' => $kelas ? [
                            'id' => $kelas->id,
                            'nama' => $kelas->kelas,
                            'hari' => $kelas->hari,
                            'shift' => $kelas->shift,
                        ] : null,
                        'dk' => $praktikan?->dk,
                        'profile_picture_url' => $praktikan?->profile_picture_url,
                    ],
                    'nilai' => $nilai ? [
                        'id' => $nilai->id,
                        'tp' => $nilai->tp,
                        'ta' => $nilai->ta,
                        'd1' => $nilai->d1,
                        'd2' => $nilai->d2,
                        'd3' => $nilai->d3,
                        'd4' => $nilai->d4,
                        'l1' => $nilai->l1,
                        'l2' => $nilai->l2,
                        'avg' => $nilai->avg,
                        'rating' => $nilai->rating,
                        'updated_at' => optional($nilai->updated_at)->toIso8601String(),
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data praktikan.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the praktikan's password.
     */
    public function setPassword(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'nim' => 'required|exists:praktikans,nim',
            'password' => 'required|min:6',
        ], [
            'nim.required' => 'NIM harus diisi',
            'nim.exists' => 'NIM tidak ditemukan dalam database',
            'password.required' => 'Password baru harus diisi',
            'password.min' => 'Password baru minimal 6 karakter',
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors(),
                ], 422);
            }

            return back()->withErrors($validator)->withInput();
        }

        try {
            // Find the praktikan by NIM
            $praktikan = Praktikan::where('nim', $request->nim)->first();

            if (! $praktikan) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Praktikan tidak ditemukan',
                    ], 404);
                }

                return back()->with('error', 'Praktikan tidak ditemukan');
            }

            // Update the password
            $praktikan->password = Hash::make($request->password);
            $praktikan->save();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Password Praktikan berhasil diperbarui',
                ], 200);
            }

            return redirect()->back()->with('success', 'Password Praktikan berhasil diperbarui');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Terjadi kesalahan saat memperbarui password',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return back()->with('error', 'Terjadi kesalahan saat memperbarui password');
        }
    }

    /**
     * Change password of praktikan by themself
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        try {
            $praktikan = Praktikan::find(auth()->guard('praktikan')->user()->id);

            if (! $praktikan) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Praktikan not found.',
                    ], 404);
                }

                return redirect()->back()->withErrors([
                    'error' => 'Praktikan not found.',
                ]);
            }

            if (! Hash::check($request->current_password, $praktikan->password)) {
                $message = 'Password saat ini tidak sesuai';

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

            $praktikan->password = Hash::make($request->password);
            $praktikan->save();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Password berhasil diubah',
                ]);
            }

            return redirect()->back()->with('success', 'Password berhasil diubah');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Gagal mengubah password.',
                    'error' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'Gagal mengubah password: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Update praktikan profile picture with ImageKit metadata
     */
    /**
     * Update authenticated praktikan's profile
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nomor_telepon' => 'required|string',
            'email' => 'required|email',
            'alamat' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $praktikan = auth()->guard('praktikan')->user();

            if (! $praktikan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.',
                ], 401);
            }

            $praktikan->nomor_telepon = $request->nomor_telepon;
            $praktikan->email = $request->email;
            $praktikan->alamat = $request->alamat;
            $praktikan->save();

            return redirect()->back()->with('success', 'Profile updated successfully.');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update praktikan profile picture
     */
    public function updateProfilePicture(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file_id' => 'required|string',
            'url' => 'required|string|url',
            'file_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $praktikan = auth()->guard('praktikan')->user();

            if (! $praktikan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.',
                ], 401);
            }

            $imageKitService = app(ImageKitService::class);

            // If an old image exists, delete it from ImageKit
            if ($praktikan->profile_picture_file_id) {
                try {
                    $imageKitService->deleteFile($praktikan->profile_picture_file_id);
                } catch (\Exception $e) {
                    // Log but don't fail - old file might already be deleted
                    report($e);
                }
            }

            // Update praktikan with new ImageKit metadata
            $praktikan->update([
                'profile_picture_url' => $request->url,
                'profile_picture_file_id' => $request->file_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture updated successfully.',
                'data' => [
                    'profile_picture_url' => $praktikan->profile_picture_url,
                    'profile_picture_file_id' => $praktikan->profile_picture_file_id,
                ],
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile picture.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete praktikan profile picture
     */
    public function deleteProfilePicture(): JsonResponse
    {
        try {
            $praktikan = auth()->guard('praktikan')->user();

            if (! $praktikan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.',
                ], 401);
            }

            $imageKitService = app(ImageKitService::class);

            // If an image exists, delete it from ImageKit
            if ($praktikan->profile_picture_file_id) {
                $imageKitService->deleteFile($praktikan->profile_picture_file_id);
            }

            // Clear profile picture fields
            $praktikan->update([
                'profile_picture_url' => null,
                'profile_picture_file_id' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture deleted successfully.',
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile picture.',
                'error' => $exception->getMessage(),
            ], 500);
        }
    }
}
