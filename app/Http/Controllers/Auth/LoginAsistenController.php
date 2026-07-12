<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AsistenLoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class LoginAsistenController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [ // ini gantii yahh
            // data that u wanna pass
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(AsistenLoginRequest $request): RedirectResponse
    {
        try {
            // code...
            $request->authenticate();

            $request->session()->regenerate();
            $user = Auth::guard('asisten')->user();
            $role = Role::find($user->role_id);
            $permissions = $role->permissions;
            $allPermissions = $role->permissions->pluck('name');

            $token = $user->createToken($role->name, [...$allPermissions])->plainTextToken;

            $cookie = cookie('auth', $token, 60, null, null, true, true, false, 'None');

            return redirect()->intended(RouteServiceProvider::ASSISTANT)
                ->header('X-XSRF-TOKEN', csrf_token())
                ->header('Authorization', $token)
                ->cookie($cookie);

        } catch (\Throwable $th) {
            return redirect()->back()->with('error', $th->getMessage());
        }

    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {

        $user = Auth::guard('asisten')->user();

        $user->tokens()->delete();

        Auth::guard('asisten')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
