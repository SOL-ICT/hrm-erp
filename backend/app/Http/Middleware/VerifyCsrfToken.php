<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
        '/api/*',
        'sanctum/*',
        '/sanctum/*',
    ];

    /**
     * ✅ FINAL SOLUTION: Override handle method directly
     */
    public function handle($request, \Closure $next)
    {
        // Get the current path
        $path = $request->path();

        // Always bypass CSRF for API routes
        if (str_starts_with($path, 'api/') || str_starts_with($path, '/api/')) {
            return $next($request);
        }

        // Always bypass CSRF for requests with XMLHttpRequest header
        if (
            $request->hasHeader('X-Requested-With') &&
            $request->header('X-Requested-With') === 'XMLHttpRequest'
        ) {
            return $next($request);
        }

        // Always bypass CSRF for JSON requests
        if ($request->expectsJson()) {
            return $next($request);
        }

        // For all other requests, use normal CSRF protection
        return parent::handle($request, $next);
    }
}
