<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ConfirmablePasswordController extends Controller
{
    public function store(Request $request)
    {
        // Validasi password
        $request->validate([
            'password' => 'required|string',
        ]);

        // Cek apakah password yang dimasukkan sesuai dengan yang ada di database
        if (! Hash::check($request->password, Auth::user()->password)) {
            return back()->withErrors(['password' => 'Password tidak sesuai.']);
        }

        // Password benar
        return response()->json(['message' => 'Password berhasil dikonfirmasi.']);
    }
}
