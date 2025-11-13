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
        'api/attendance/upload-with-direct-matching',
        '/api/attendance/upload-with-direct-matching',
    ];

    /**
     * ✅ SECURE SOLUTION: Granular CSRF handling based on authentication method
     */
    public function handle($request, \Closure $next)
    {
        // Get the current path
        $path = $request->path();

        // 1. Always bypass CSRF for explicit API routes
        if (str_starts_with($path, 'api/') || str_starts_with($path, '/api/')) {
            return $next($request);
        }

        // 2. Check if request has Authorization header (token-based auth)
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            // Token-based auth doesn't need CSRF protection
            return $next($request);
        }

        // 3. Allow XMLHttpRequest with proper CORS headers (SPA requests)
        if (
            $request->hasHeader('X-Requested-With') &&
            $request->header('X-Requested-With') === 'XMLHttpRequest' &&
            $this->isValidCorsRequest($request)
        ) {
            return $next($request);
        }

        // 4. For all other requests (traditional web forms), use CSRF protection
        return parent::handle($request, $next);
    }

    /**
     * Check if the request is a valid CORS request from allowed origins
     */
    private function isValidCorsRequest($request)
    {
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
        ];

        return in_array($origin, $allowedOrigins);
    }
}
