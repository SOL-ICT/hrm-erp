<?php

use App\Http\Controllers\Admin\ClientPolicyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Client Policy Management Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::prefix('clients/{clientId}/policies')->group(function () {
        Route::get('/', [ClientPolicyController::class, 'index']); // Get all policies for client
        Route::post('/', [ClientPolicyController::class, 'store']); // Create new policy
        Route::get('/active', [ClientPolicyController::class, 'getActive']); // Get active policy
        Route::put('/{policyId}', [ClientPolicyController::class, 'update']); // Update policy
        Route::delete('/{policyId}', [ClientPolicyController::class, 'destroy']); // Delete policy
    });
});
