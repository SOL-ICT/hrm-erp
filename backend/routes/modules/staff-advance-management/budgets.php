<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\BudgetController;

/*
|--------------------------------------------------------------------------
| Budget Routes
|--------------------------------------------------------------------------
|
| Routes for budget allocation and management
| Admin allocates budgets, tracks utilization
|
*/

Route::prefix('admin')->group(function () {
    Route::prefix('budgets')->group(function () {
    // List and allocate
    Route::get('/', [BudgetController::class, 'index']);
    Route::post('/', [BudgetController::class, 'store']);
    
    // Statistics
    Route::get('/statistics', [BudgetController::class, 'statistics']);
    
    // User-specific
    Route::get('/my-budget', [BudgetController::class, 'myBudget']);
    Route::get('/user/{userId}', [BudgetController::class, 'show']);
    
    // Update
    Route::put('/{id}', [BudgetController::class, 'update']);
    });
});
