<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProcurementController;

/*
|--------------------------------------------------------------------------
| Procurement Routes
|--------------------------------------------------------------------------
|
| Routes for procurement logging
| Admin Officer logs received items with supplier details
|
*/

Route::prefix('admin')->group(function () {
    Route::prefix('procurements')->group(function () {
    // List and log
    Route::get('/', [ProcurementController::class, 'index']);
    Route::post('/', [ProcurementController::class, 'store']);
    
    // Statistics
    Route::get('/statistics', [ProcurementController::class, 'statistics']);
    });
});
