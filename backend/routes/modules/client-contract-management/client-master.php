<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClientController;

Route::prefix('clients')->name('clients.')->group(function () {
    Route::get('/', [ClientController::class, 'index'])->name('index');
    Route::get('/all/active', [ClientController::class, 'getAllActive'])->name('all-active');
    Route::get('/statistics', [ClientController::class, 'statistics'])->name('statistics');
    Route::get('/dropdown', [ClientController::class, 'dropdown'])->name('dropdown');
    Route::post('/', [ClientController::class, 'store'])->name('store');
    Route::get('/{id}', [ClientController::class, 'show'])->name('show');
    Route::put('/{id}', [ClientController::class, 'update'])->name('update');
    Route::delete('/{id}', [ClientController::class, 'destroy'])->name('destroy');
    Route::post('/{id}/contracts', [ClientController::class, 'addContract'])->name('add-contract');
});
