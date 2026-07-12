<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateBroadcasting
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try to authenticate with praktikan guard
        if (Auth::guard('praktikan')->check()) {
            Auth::shouldUse('praktikan');
            $request->setUserResolver(function () {
                return Auth::guard('praktikan')->user();
            });

            return $next($request);
        }

        // Try to authenticate with asisten guard
        if (Auth::guard('asisten')->check()) {
            Auth::shouldUse('asisten');
            $request->setUserResolver(function () {
                return Auth::guard('asisten')->user();
            });

            return $next($request);
        }

        // Fallback to default web guard
        if (Auth::guard('web')->check()) {
            Auth::shouldUse('web');

            return $next($request);
        }

        // No authenticated user found
        return response()->json(['message' => 'Unauthenticated.'], 403);
    }
}
