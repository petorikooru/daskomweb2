<?php

namespace App\Providers;

use App\Models\Asisten;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        Horizon::auth(function (Request $request): bool {
            $authenticatedUser = $request->user();

            if ($authenticatedUser instanceof Asisten) {
                return true;
            }

            $asisten = $request->user('asisten');

            return $asisten instanceof Asisten;
        });
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user = null): bool {
            if ($user instanceof Asisten) {
                return true;
            }

            return Auth::guard('asisten')->check();
        });
    }
}
