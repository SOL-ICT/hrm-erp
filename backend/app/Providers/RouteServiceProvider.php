<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });

        // ✅ FIX 1: Explicit Model Bindings to prevent role conflicts
        $this->configureModelBindings();
    }

    /**
     * Configure explicit model bindings to prevent conflicts
     */
    protected function configureModelBindings(): void
    {
        // Explicit model bindings to prevent route parameter conflicts
        Route::model('client', \App\Models\Client::class);
        Route::model('solOffice', \App\Models\SOLOffice::class);
        Route::model('serviceLocation', \App\Models\ServiceLocation::class);
        Route::model('serviceRequest', \App\Models\ServiceRequest::class);
        Route::model('user_role', \App\Models\Role::class); // Rename to avoid conflict

        // Custom binding for role to avoid conflicts with other parameters
        Route::bind('role', function ($value) {
            return \App\Models\Role::where('id', $value)
                ->orWhere('slug', $value)
                ->firstOrFail();
        });
    }
}
