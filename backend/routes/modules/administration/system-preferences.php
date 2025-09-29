<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SystemPreferenceController;


Route::prefix('system-preferences')->name('system-preferences.')->group(function () {
    Route::get('/', [SystemPreferenceController::class, 'index'])->name('index');
    Route::post('/', [SystemPreferenceController::class, 'store'])->name('store');
    Route::get('/{key}', [SystemPreferenceController::class, 'show'])->name('show');
    Route::put('/{key}', [SystemPreferenceController::class, 'update'])->name('update');
    Route::delete('/{key}', [SystemPreferenceController::class, 'destroy'])->name('destroy');
    Route::get('/by-category/{category}', [SystemPreferenceController::class, 'getByCategory'])->name('by-category');
    Route::post('/bulk-update', [SystemPreferenceController::class, 'bulkUpdate'])->name('bulk-update');
});
