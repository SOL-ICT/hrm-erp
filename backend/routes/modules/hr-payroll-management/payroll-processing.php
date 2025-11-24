<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmolumentComponentController;
use App\Http\Controllers\PayrollSettingsController;
use App\Http\Controllers\Api\PayrollRunController;

/**
 * Payroll Processing Routes
 * Custom Emolument Components Management + Payroll Settings Configuration
 * 
 * Module: HR & Payroll Management
 * Feature: Payroll Processing
 * 
 * Purpose: 
 * 1. Manage client-specific custom emolument components for payroll
 * 2. Configure payroll calculation settings (tax rates, formulas, statutory rates)
 */

// ==========================================
// EMOLUMENT COMPONENTS ROUTES
// ==========================================
Route::prefix('payroll/components')->name('payroll.components.')->group(function () {

    // Get universal template (11 system components)
    Route::get('/universal-template', [EmolumentComponentController::class, 'getUniversalTemplate'])
        ->name('universal-template');

    // Get all available components for a client (universal + client-specific)
    Route::get('/client-available', [EmolumentComponentController::class, 'getAllAvailableForClient'])
        ->name('client-available');

    // Create new custom component (client-specific)
    Route::post('/custom', [EmolumentComponentController::class, 'storeCustomComponent'])
        ->name('custom.store');

    // Update existing custom component (client-specific only, universal protected)
    Route::put('/custom/{id}', [EmolumentComponentController::class, 'updateCustomComponent'])
        ->name('custom.update');

    // Soft delete custom component (client-specific only, universal protected)
    Route::delete('/custom/{id}', [EmolumentComponentController::class, 'destroyCustomComponent'])
        ->name('custom.destroy');
});

// ==========================================
// PAYROLL SETTINGS ROUTES
// ==========================================
Route::prefix('payroll/settings')->name('payroll.settings.')->middleware(['auth:sanctum'])->group(function () {

    // Get all active payroll settings
    Route::get('/', [PayrollSettingsController::class, 'index'])
        ->name('index');

    // Get specific setting by key
    Route::get('/{key}', [PayrollSettingsController::class, 'show'])
        ->name('show');

    // Update setting value (with audit trail)
    Route::put('/{key}', [PayrollSettingsController::class, 'update'])
        ->name('update');

    // Reset setting to Nigeria 2025 default
    Route::post('/{key}/reset', [PayrollSettingsController::class, 'resetToDefault'])
        ->name('reset');

    // Validate formula syntax
    Route::post('/validate', [PayrollSettingsController::class, 'validateFormula'])
        ->name('validate');

    // Get change history for setting (audit trail)
    Route::get('/history/{key}', [PayrollSettingsController::class, 'getChangeHistory'])
        ->name('history');
});


// ==========================================
// PAYROLL RUNS ROUTES
// ==========================================
Route::prefix('payroll/runs')->name('payroll.runs.')->middleware(['auth:sanctum'])->group(function () {

    // List all payroll runs (with filters)
    Route::get('/', [PayrollRunController::class, 'index'])
        ->name('index');

    // Create new payroll run
    Route::post('/', [PayrollRunController::class, 'store'])
        ->name('store');

    // Get payroll run details with employee breakdown
    Route::get('/{id}', [PayrollRunController::class, 'show'])
        ->name('show');

    // Link attendance upload to payroll run
    Route::post('/{id}/link-attendance', [PayrollRunController::class, 'linkAttendance'])
        ->name('link-attendance');

    // Calculate payroll for all employees
    Route::post('/{id}/calculate', [PayrollRunController::class, 'calculate'])
        ->name('calculate');

    // Approve calculated payroll
    Route::post('/{id}/approve', [PayrollRunController::class, 'approve'])
        ->name('approve');

    // Export payroll to Excel
    Route::get('/{id}/export', [PayrollRunController::class, 'export'])
        ->name('export');

    // Cancel payroll run
    Route::post('/{id}/cancel', [PayrollRunController::class, 'cancel'])
        ->name('cancel');

    // Delete payroll run (draft or cancelled only)
    Route::delete('/{id}', [PayrollRunController::class, 'destroy'])
        ->name('destroy');
});

// ==========================================
// PAYROLL ATTENDANCE TEMPLATE DOWNLOAD
// ==========================================
Route::get('/payroll/attendance-template/{clientId}', [PayrollRunController::class, 'downloadAttendanceTemplate'])
    ->name('payroll.attendance.template.download')
    ->middleware(['auth:sanctum']);
