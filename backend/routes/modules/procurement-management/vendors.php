<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\VendorController;

/*
|--------------------------------------------------------------------------
| Vendor Management Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin/vendors')->group(function () {
    Route::get('/', [VendorController::class, 'index']);
    Route::get('/statistics', [VendorController::class, 'statistics']);
    Route::get('/{id}', [VendorController::class, 'show']);
    Route::post('/', [VendorController::class, 'store']);
    Route::put('/{id}', [VendorController::class, 'update']);
    Route::delete('/{id}', [VendorController::class, 'destroy']);
});
