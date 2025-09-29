<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TestManagementController;

/*
|--------------------------------------------------------------------------
| Test Management Routes
|--------------------------------------------------------------------------
| Enhanced test management system with Google Form-style test creation
*/

Route::prefix('test-management')->name('test-management.')->group(function () {
    
    // Overall statistics (must be before /{id} routes to avoid conflicts)
    Route::get('/statistics', [TestManagementController::class, 'getOverallStatistics'])->name('overall-statistics');
    
    // Test CRUD operations
    Route::get('/', [TestManagementController::class, 'index'])->name('index');
    Route::post('/', [TestManagementController::class, 'store'])->name('store');
    Route::get('/{id}', [TestManagementController::class, 'show'])->name('show');
    Route::put('/{id}', [TestManagementController::class, 'update'])->name('update');
    Route::delete('/{id}', [TestManagementController::class, 'destroy'])->name('destroy');
    
    // Test questions management
    Route::get('/{id}/questions', [TestManagementController::class, 'getTestQuestions'])->name('questions');
    Route::post('/{id}/questions', [TestManagementController::class, 'updateTestQuestions'])->name('questions.update');
    
    // Individual question management
    Route::post('/{testId}/questions/create', [TestManagementController::class, 'createSingleQuestion'])->name('questions.create');
    Route::put('/{testId}/questions/{questionId}', [TestManagementController::class, 'updateSingleQuestion'])->name('questions.update-single');
    Route::delete('/{testId}/questions/{questionId}', [TestManagementController::class, 'deleteSingleQuestion'])->name('questions.delete');
    
    // Test assignment and results
    Route::post('/assign-test', [TestManagementController::class, 'assignTest'])->name('assign-test');
    Route::get('/results', [TestManagementController::class, 'getResults'])->name('results');
    Route::get('/{testId}/statistics', [TestManagementController::class, 'getStatistics'])->name('statistics');
    
});
