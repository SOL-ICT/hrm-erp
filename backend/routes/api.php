<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Test API endpoint
Route::get('/test', function () {
    return response()->json([
        'message' => 'HRM ERP API is working!',
        'version' => '1.0.0',
        'timestamp' => now(),
        'status' => 'success'
    ]);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'database' => 'connected',
        'api' => 'running',
        'environment' => app()->environment()
    ]);
});

// Get all users (for testing)
Route::get('/users', function () {
    return response()->json([
        'users' => User::all(),
        'count' => User::count()
    ]);
});

// Authentication routes
Route::post('/register', function (Request $request) {
    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8',
    ]);

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => bcrypt($request->password),
    ]);

    return response()->json([
        'message' => 'User created successfully',
        'user' => $user
    ], 201);
});

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // HRM Dashboard routes
    Route::prefix('hrm')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'message' => 'HRM Dashboard data',
                'modules' => ['employees', 'payroll', 'leaves', 'departments'],
                'stats' => [
                    'total_employees' => User::count(),
                    'active_employees' => User::count(),
                    'departments' => 0,
                    'pending_leaves' => 0
                ]
            ]);
        });

        // Employee routes (placeholder for future development)
        Route::get('/employees', function () {
            return response()->json([
                'employees' => User::all(),
                'message' => 'Employee list (using users table for now)'
            ]);
        });

        Route::get('/departments', function () {
            return response()->json([
                'departments' => [],
                'message' => 'Departments will be implemented when team finalizes structure'
            ]);
        });

        Route::get('/payroll', function () {
            return response()->json([
                'payroll' => [],
                'message' => 'Payroll module - coming soon'
            ]);
        });

        Route::get('/leaves', function () {
            return response()->json([
                'leaves' => [],
                'message' => 'Leave management - coming soon'
            ]);
        });
    });
});
