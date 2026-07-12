<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Praktikan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredPraktikanController extends Controller
{
    /**
     * Display the registration view.
     */
    public function getKelas()
    {
        try {
            $kelas = Kelas::all();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas retrieved successfully.',
                'kelas' => $kelas,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve kelas.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function create(): Response
    {
        return Inertia::render('Auth/Register'); // ini pake path yg bener
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        try {
            // Validate the request
            $validatedData = $request->validate([
                'nama' => 'required|string|max:255',
                'nim' => 'required|string|max:12|unique:praktikans,nim',
                'nomor_telepon' => 'required|string|max:15',
                'email' => 'required|string|email',
                'kelas_id' => 'required|integer|exists:kelas,id',
                'dk' => 'required|string|in:DK1,DK2',
                'alamat' => 'required|string',
                'password' => 'required|string',
            ]);

            // Create the Praktikan
            $praktikan = Praktikan::create([
                'nama' => $validatedData['nama'],
                'nim' => $validatedData['nim'],
                'kelas_id' => $validatedData['kelas_id'],
                'dk' => $validatedData['dk'],
                'alamat' => $validatedData['alamat'],
                'email' => $validatedData['email'],
                'nomor_telepon' => $validatedData['nomor_telepon'],
                'password' => Hash::make($validatedData['password']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign role
            $praktikan->assignRole('PRAKTIKAN');

            return redirect()->back()
                ->with('success', 'Praktikan registered successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Catch validation errors
            return redirect()->back()
                ->withErrors($e->validator)
                ->withInput();
        } catch (\Exception $e) {
            // Catch unexpected errors
            return redirect('/register?mode=praktikan')
                ->with('error', 'An unexpected error occurred. Please try again.')
                ->withInput();
        }
    }

    public function lupaPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'new_password' => 'required|min:8',
            'confirm_password' => 'required|same:new_password',
        ]);

        try {
            // For a password reset, we might need to find the user by other identifiers
            // like email or username if we don't have a reliable ID
            $user = null;

            if ($request->has('id') && $request->id) {
                $user = Praktikan::find($request->id);
            }

            if ($request->has('email') && $request->email) {
                $user = Praktikan::where('email', $request->email)->first();
            }

            if (! $user) {
                return back()->withErrors([
                    'error' => 'User tidak ditemukan. Silakan periksa kembali data yang dimasukkan.',
                ]);
            }

            // Update the password
            $user->password = Hash::make($request->new_password);
            $user->save();

            return back()->with('success', 'Password berhasil diubah.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Terjadi kesalahan: '.$e->getMessage(),
            ]);
        }
    }
}
