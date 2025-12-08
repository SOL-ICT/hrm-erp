<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add CORS handling for API routes
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\LogRBACRequests::class,
        ]);

        // Trust proxies if needed (optional, but helpful for development)
        $middleware->trustProxies(at: '*');

        // You can also configure stateful API here if needed
        $middleware->statefulApi();

        // Register cache response middleware
        $middleware->alias([
            'cache.response' => \App\Http\Middleware\CacheResponseMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Check for offer expiry daily at 6:00 AM
        $schedule->command('offers:check-expiry')
            ->dailyAt('06:00')
            ->withoutOverlapping()
            ->runInBackground();
    })
    ->create();
