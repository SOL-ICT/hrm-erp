<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalaryStructureController;
use App\Http\Controllers\EmolumentComponentController;

Route::prefix('salary-structure')->name('salary-structure.')->group(function () {

    // Dashboard Statistics
    Route::get('/dashboard/statistics', [SalaryStructureController::class, 'getDashboardStatistics'])->name('dashboard-stats');

    // Job Structure Routes
    Route::prefix('job-structures')->name('job-structures.')->group(function () {
        Route::get('/', [SalaryStructureController::class, 'getJobStructures'])->name('index');
        Route::post('/', [SalaryStructureController::class, 'storeJobStructure'])->name('store');
        Route::get('/statistics', [SalaryStructureController::class, 'getJobStructureStatistics'])->name('statistics');
        Route::get('/{id}', [SalaryStructureController::class, 'showJobStructure'])->name('show');
        Route::put('/{id}', [SalaryStructureController::class, 'updateJobStructure'])->name('update');
        Route::delete('/{id}', [SalaryStructureController::class, 'deleteJobStructure'])->name('destroy');
    });

    // Pay Grade Routes
    Route::prefix('pay-grades')->name('pay-grades.')->group(function () {
        Route::get('/', [SalaryStructureController::class, 'getPayGrades'])->name('index');
        Route::get('/job/{jobStructureId}', [SalaryStructureController::class, 'getPayGrades'])->name('by-job');
        Route::post('/', [SalaryStructureController::class, 'storePayGrade'])->name('store');
        Route::get('/{id}', [SalaryStructureController::class, 'showPayGrade'])->name('show');
        Route::put('/{id}', [SalaryStructureController::class, 'updatePayGrade'])->name('update');
        Route::delete('/{id}', [SalaryStructureController::class, 'deletePayGrade'])->name('destroy');
    });

    // Utility Routes
    Route::get('/clients', [SalaryStructureController::class, 'getClients'])->name('clients');
    Route::get('/pay-structure-types', [SalaryStructureController::class, 'getPayStructureTypes'])->name('pay-structure-types');
    Route::get('/utilities/emolument-components', [SalaryStructureController::class, 'getEmolumentComponents'])->name('utilities.emolument-components');

    // Emolument Components Routes
    Route::prefix('emolument-components')->name('emolument-components.')->group(function () {
        Route::get('/', [EmolumentComponentController::class, 'index'])->name('index');
        Route::get('/statistics', [EmolumentComponentController::class, 'getStatistics'])->name('statistics');
        Route::get('/export', [EmolumentComponentController::class, 'export'])->name('export');
        Route::get('/template', [EmolumentComponentController::class, 'downloadTemplate'])->name('template');
        Route::post('/import', [EmolumentComponentController::class, 'import'])->name('import');
        Route::post('/bulk-action', [EmolumentComponentController::class, 'bulkAction'])->name('bulk-action');
        Route::get('/{id}', [EmolumentComponentController::class, 'show'])->name('show');
        Route::post('/', [EmolumentComponentController::class, 'store'])->name('store');
        Route::put('/{id}', [EmolumentComponentController::class, 'update'])->name('update');
        Route::delete('/{id}', [EmolumentComponentController::class, 'destroy'])->name('destroy');
    });
});
