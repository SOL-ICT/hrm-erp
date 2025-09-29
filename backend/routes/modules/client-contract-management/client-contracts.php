<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClientContractController;


Route::prefix('client-contracts')->name('client-contracts.')->group(function () {
    Route::get('/', [ClientContractController::class, 'index'])->name('index');
    Route::post('/', [ClientContractController::class, 'store'])->name('store');
    Route::get('/particulars', [ClientContractController::class, 'getContractParticulars'])->name('particulars');
    Route::get('/expiring-soon', [ClientContractController::class, 'getExpiringSoon'])->name('expiring-soon');
    Route::get('/{id}', [ClientContractController::class, 'show'])->name('show');
    Route::put('/{id}', [ClientContractController::class, 'update'])->name('update');
    Route::delete('/{id}', [ClientContractController::class, 'destroy'])->name('destroy');
    Route::get('/by-client/{clientId}', [ClientContractController::class, 'getByClient'])->name('by-client');
    Route::patch('/{id}/toggle-status', [ClientContractController::class, 'toggleStatus'])->name('toggle-status');
});
