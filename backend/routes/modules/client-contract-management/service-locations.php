<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ServiceLocationController;

Route::prefix('service-locations')->name('service-locations.')->group(function () {
    // Put specific routes FIRST (before the {id} route)
    Route::get('/regions/list', [ServiceLocationController::class, 'getRegions'])->name('regions');
    Route::get('/zones/list', [ServiceLocationController::class, 'getZones'])->name('zones');
    Route::get('/bulk-template', [ServiceLocationController::class, 'downloadTemplate'])->name('bulk-template');
    Route::get('/grouped-by-client', [ServiceLocationController::class, 'getGroupedByClient'])->name('grouped-by-client');
    Route::get('/by-client/{clientId}', [ServiceLocationController::class, 'getByClient'])->name('by-client');
    Route::post('/test-auto-assignment', [ServiceLocationController::class, 'testAutoAssignment'])->name('test-auto-assignment');

    // Generic routes LAST
    Route::get('/', [ServiceLocationController::class, 'index'])->name('index');
    Route::post('/', [ServiceLocationController::class, 'store'])->name('store');
    Route::get('/{id}', [ServiceLocationController::class, 'show'])->name('show');
    Route::put('/{id}', [ServiceLocationController::class, 'update'])->name('update');
    Route::delete('/{id}', [ServiceLocationController::class, 'destroy'])->name('destroy');
});
