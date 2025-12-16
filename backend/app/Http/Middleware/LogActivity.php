<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->user()) {
            return $response;
        }

        $sensitiveRoutes = ['login', 'logout', 'register', 'password', 'staff', 'clients', 'invoices', 'claims', 'policies'];

        foreach ($sensitiveRoutes as $route) {
            if (str_contains($request->path(), $route)) {
                activity()
                    ->causedBy($request->user())
                    ->withProperties([
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'method' => $request->method(),
                        'url' => $request->fullUrl(),
                        'input' => $this->sanitizeInput($request->except(['password', 'password_confirmation'])),
                        'response_code' => $response->getStatusCode(),
                    ])
                    ->log($request->method() . ' ' . $request->path());
                break;
            }
        }

        return $response;
    }

    private function sanitizeInput($input)
    {
        $sensitive = ['password', 'token', 'ssn', 'credit_card', 'account_number'];
        foreach ($sensitive as $field) {
            if (isset($input[$field])) {
                $input[$field] = '[REDACTED]';
            }
        }
        return $input;
    }
    
    public function terminate($request, $response)
    {
        // Middleware doesn't need terminate phase
        // All logging happens in handle() method
    }
}