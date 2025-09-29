<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/admin/stats', function () {
    try {
        // Example statistics, replace with real queries as needed
        $userCount = DB::table('users')->count();
        $officeCount = DB::table('sol_offices')->count();
        $clientCount = DB::table('clients')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $userCount,
                'offices' => $officeCount,
                'clients' => $clientCount,
            ]
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});
