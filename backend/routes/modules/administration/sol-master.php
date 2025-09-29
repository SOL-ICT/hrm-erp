<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\SOLOfficeController;

Route::prefix('admin/sol-offices')->name('admin.sol-offices.')->group(function () {

    // Data endpoints (must come before parameterized routes)
    Route::get('/data/states-lgas', [SOLOfficeController::class, 'getStatesLgas'])
        ->name('states-lgas');
    Route::get('/data/statistics', [SOLOfficeController::class, 'getStatistics'])
        ->name('statistics');

    // Bulk operations
    Route::patch('/bulk/status', [SOLOfficeController::class, 'bulkUpdateStatus'])
        ->name('bulk-status');

    // Basic CRUD operations
    Route::get('/', [SOLOfficeController::class, 'index'])
        ->name('index');
    Route::post('/', [SOLOfficeController::class, 'store'])
        ->name('store');

    // Parameterized routes (must come last with constraints)
    Route::get('/{id}', [SOLOfficeController::class, 'show'])
        ->name('show')
        ->where('id', '[0-9]+');
    Route::put('/{id}', [SOLOfficeController::class, 'update'])
        ->name('update')
        ->where('id', '[0-9]+');
    Route::delete('/{id}', [SOLOfficeController::class, 'destroy'])
        ->name('destroy')
        ->where('id', '[0-9]+');
});
