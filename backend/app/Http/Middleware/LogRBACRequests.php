<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class LogRBACRequests
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (str_contains($request->path(), 'rbac')) {
            Log::info('🔍 MIDDLEWARE: RBAC Request Intercepted', [
                'method' => $request->method(),
                'path' => $request->path(),
                'full_url' => $request->fullUrl(),
                'has_auth' => $request->hasHeader('Authorization'),
                'has_body' => $request->getContent() !== '',
                'body_preview' => substr($request->getContent(), 0, 200),
                'headers' => $request->headers->all()
            ]);
        }

        $response = $next($request);

        if (str_contains($request->path(), 'rbac')) {
            Log::info('🔍 MIDDLEWARE: RBAC Response', [
                'status' => $response->status(),
                'content_preview' => substr($response->getContent(), 0, 200)
            ]);
        }

        return $response;
    }
}
