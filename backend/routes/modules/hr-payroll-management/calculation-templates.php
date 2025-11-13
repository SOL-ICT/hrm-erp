<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CalculationTemplateController;

/**
 * Calculation Templates Routes
 * Visual Template Builder API endpoints
 * 
 * Module: HR & Payroll Management
 * Feature: Salary Calculation Templates
 */

Route::prefix('calculation-templates')->name('calculation-templates.')->group(function () {

    // List all templates
    Route::get('/', [CalculationTemplateController::class, 'index'])
        ->name('index');

    // Get all unique components from all templates (for component palette)
    Route::get('/components', [CalculationTemplateController::class, 'getAllComponents'])
        ->name('components');

    // Get template by pay grade code (MUST come before /{id} route)
    Route::get('/grade/{gradeCode}', [CalculationTemplateController::class, 'getByGradeCode'])
        ->name('by-grade');

    // Create new template
    Route::post('/', [CalculationTemplateController::class, 'store'])
        ->name('store');

    // Get specific template by ID (comes after /grade/{gradeCode})
    Route::get('/{id}', [CalculationTemplateController::class, 'show'])
        ->name('show');

    // Update existing template
    Route::put('/{id}', [CalculationTemplateController::class, 'update'])
        ->name('update');

    // Soft delete template
    Route::delete('/{id}', [CalculationTemplateController::class, 'destroy'])
        ->name('destroy');
});
