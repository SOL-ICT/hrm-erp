<?php

use App\Http\Controllers\Api\CalculationTemplateController;
use App\Http\Controllers\Api\ExportTemplateController;
use App\Http\Controllers\Api\InvoiceSnapshotController;
use App\Http\Controllers\Api\BulkUploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| New Template System Routes (v2)
|--------------------------------------------------------------------------
| Routes for the new separated template architecture:
| - CalculationTemplate (per pay grade)
| - ExportTemplate (per client)  
| - InvoiceSnapshot (enhanced with audit trail)
| Part of HR & Payroll Management Module
*/

Route::prefix('v2')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Calculation Templates Routes
    |--------------------------------------------------------------------------
    | Manage calculation templates for different pay grades
    */
    Route::prefix('calculation-templates')->group(function () {

        // List all calculation templates with filtering
        Route::get('/', [CalculationTemplateController::class, 'index'])
            ->name('v2.calculation-templates.index');

        // Create new calculation template
        Route::post('/', [CalculationTemplateController::class, 'store'])
            ->name('v2.calculation-templates.store');

        // Get specific calculation template
        Route::get('/{id}', [CalculationTemplateController::class, 'show'])
            ->name('v2.calculation-templates.show')
            ->where('id', '[0-9]+');

        // Update calculation template
        Route::put('/{id}', [CalculationTemplateController::class, 'update'])
            ->name('v2.calculation-templates.update')
            ->where('id', '[0-9]+');

        // Delete calculation template
        Route::delete('/{id}', [CalculationTemplateController::class, 'destroy'])
            ->name('v2.calculation-templates.destroy')
            ->where('id', '[0-9]+');

        // Get templates by pay grade
        Route::get('/by-grade/{gradeCode}', [CalculationTemplateController::class, 'getByPayGrade'])
            ->name('v2.calculation-templates.by-grade');

        // Validate formula
        Route::post('/validate-formula', [CalculationTemplateController::class, 'validateFormula'])
            ->name('v2.calculation-templates.validate-formula');

        // Test calculation with sample data
        Route::post('/{id}/test-calculation', [CalculationTemplateController::class, 'testCalculation'])
            ->name('v2.calculation-templates.test-calculation')
            ->where('id', '[0-9]+');

        // Create new version
        Route::post('/{id}/new-version', [CalculationTemplateController::class, 'createNewVersion'])
            ->name('v2.calculation-templates.new-version')
            ->where('id', '[0-9]+');

        // Set as default
        Route::post('/{id}/set-default', [CalculationTemplateController::class, 'setAsDefault'])
            ->name('v2.calculation-templates.set-default')
            ->where('id', '[0-9]+');
    });

    /*
    |--------------------------------------------------------------------------
    | Invoice Export Templates Routes
    |--------------------------------------------------------------------------
    | NEW: Manage client-specific invoice line items and formatting
    | This is SEPARATE from export-templates (which handles employee data export)
    */
    Route::prefix('invoice-export-templates')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\InvoiceExportTemplateController::class, 'index'])
            ->name('v2.invoice-export-templates.index');
        Route::post('/', [App\Http\Controllers\Api\InvoiceExportTemplateController::class, 'store'])
            ->name('v2.invoice-export-templates.store');
        Route::get('/{id}', [App\Http\Controllers\Api\InvoiceExportTemplateController::class, 'show'])
            ->name('v2.invoice-export-templates.show');
        Route::put('/{id}', [App\Http\Controllers\Api\InvoiceExportTemplateController::class, 'update'])
            ->name('v2.invoice-export-templates.update');
        Route::delete('/{id}', [App\Http\Controllers\Api\InvoiceExportTemplateController::class, 'destroy'])
            ->name('v2.invoice-export-templates.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Export Templates Routes (Employee Data Export)
    |--------------------------------------------------------------------------
    | Manage export templates for employee data (attendance, boarding, etc.)
    */
    Route::prefix('export-templates')->group(function () {

        // List all export templates with filtering
        Route::get('/', [ExportTemplateController::class, 'index'])
            ->name('v2.export-templates.index');

        // Create new export template
        Route::post('/', [ExportTemplateController::class, 'store'])
            ->name('v2.export-templates.store');

        // Get specific export template
        Route::get('/{id}', [ExportTemplateController::class, 'show'])
            ->name('v2.export-templates.show')
            ->where('id', '[0-9]+');

        // Update export template
        Route::put('/{id}', [ExportTemplateController::class, 'update'])
            ->name('v2.export-templates.update')
            ->where('id', '[0-9]+');

        // Delete export template
        Route::delete('/{id}', [ExportTemplateController::class, 'destroy'])
            ->name('v2.export-templates.destroy')
            ->where('id', '[0-9]+');

        // Get templates by client
        Route::get('/by-client/{clientId}', [ExportTemplateController::class, 'getByClient'])
            ->name('v2.export-templates.by-client')
            ->where('clientId', '[0-9]+');

        // Get supported export formats
        Route::get('/formats', [ExportTemplateController::class, 'getSupportedFormats'])
            ->name('v2.export-templates.formats');

        // Validate column mappings
        Route::post('/validate-mappings', [ExportTemplateController::class, 'validateColumnMappings'])
            ->name('v2.export-templates.validate-mappings');

        // Preview export with sample data
        Route::post('/{id}/preview', [ExportTemplateController::class, 'preview'])
            ->name('v2.export-templates.preview')
            ->where('id', '[0-9]+');

        // Create new version
        Route::post('/{id}/new-version', [ExportTemplateController::class, 'createNewVersion'])
            ->name('v2.export-templates.new-version')
            ->where('id', '[0-9]+');

        // Set as default
        Route::post('/{id}/set-default', [ExportTemplateController::class, 'setAsDefault'])
            ->name('v2.export-templates.set-default')
            ->where('id', '[0-9]+');
    });

    /*
    |--------------------------------------------------------------------------
    | Invoice Snapshots Routes
    |--------------------------------------------------------------------------
    | Manage invoice generation with full audit trail
    */
    Route::prefix('invoice-snapshots')->group(function () {

        // List all invoice snapshots with filtering
        Route::get('/', [InvoiceSnapshotController::class, 'index'])
            ->name('v2.invoice-snapshots.index');

        // Create new invoice snapshot
        Route::post('/', [InvoiceSnapshotController::class, 'store'])
            ->name('v2.invoice-snapshots.store');

        // Get specific invoice snapshot
        Route::get('/{id}', [InvoiceSnapshotController::class, 'show'])
            ->name('v2.invoice-snapshots.show')
            ->where('id', '[0-9]+');

        // Update invoice snapshot
        Route::put('/{id}', [InvoiceSnapshotController::class, 'update'])
            ->name('v2.invoice-snapshots.update')
            ->where('id', '[0-9]+');

        // Delete invoice snapshot
        Route::delete('/{id}', [InvoiceSnapshotController::class, 'destroy'])
            ->name('v2.invoice-snapshots.destroy')
            ->where('id', '[0-9]+');

        // Generate invoice calculations
        Route::post('/generate', [InvoiceSnapshotController::class, 'generateInvoice'])
            ->name('v2.invoice-snapshots.generate');

        // Get snapshots by client
        Route::get('/by-client/{clientId}', [InvoiceSnapshotController::class, 'getByClient'])
            ->name('v2.invoice-snapshots.by-client')
            ->where('clientId', '[0-9]+');

        // Get snapshots by period
        Route::get('/by-period/{period}', [InvoiceSnapshotController::class, 'getByPeriod'])
            ->name('v2.invoice-snapshots.by-period');

        // Export invoice snapshot
        Route::get('/{id}/export', [InvoiceSnapshotController::class, 'export'])
            ->name('v2.invoice-snapshots.export')
            ->where('id', '[0-9]+');

        // Validate invoice calculations
        Route::post('/{id}/validate', [InvoiceSnapshotController::class, 'validateCalculations'])
            ->name('v2.invoice-snapshots.validate')
            ->where('id', '[0-9]+');

        // Mark as validated
        Route::post('/{id}/mark-validated', [InvoiceSnapshotController::class, 'markAsValidated'])
            ->name('v2.invoice-snapshots.mark-validated')
            ->where('id', '[0-9]+');

        // Change status
        Route::patch('/{id}/status', [InvoiceSnapshotController::class, 'updateStatus'])
            ->name('v2.invoice-snapshots.status')
            ->where('id', '[0-9]+');

        // Clone for new period
        Route::post('/{id}/clone', [InvoiceSnapshotController::class, 'cloneForNewPeriod'])
            ->name('v2.invoice-snapshots.clone')
            ->where('id', '[0-9]+');

        // Get calculation summary
        Route::get('/{id}/summary', [InvoiceSnapshotController::class, 'getSummary'])
            ->name('v2.invoice-snapshots.summary')
            ->where('id', '[0-9]+');

        // Verify integrity
        Route::get('/{id}/verify-integrity', [InvoiceSnapshotController::class, 'verifyIntegrity'])
            ->name('v2.invoice-snapshots.verify-integrity')
            ->where('id', '[0-9]+');
    });

    /*
    |--------------------------------------------------------------------------
    | Bulk Operations Routes
    |--------------------------------------------------------------------------
    | Handle bulk template operations and uploads
    */
    Route::prefix('bulk')->group(function () {

        // Bulk upload calculation templates
        Route::post('/calculation-templates/upload', [BulkUploadController::class, 'uploadCalculationTemplates'])
            ->name('v2.bulk.calculation-templates.upload');

        // Bulk export templates upload
        Route::post('/export-templates/upload', [BulkUploadController::class, 'uploadExportTemplates'])
            ->name('v2.bulk.export-templates.upload');

        // Bulk employee data upload
        Route::post('/employee-data/upload', [BulkUploadController::class, 'uploadEmployeeData'])
            ->name('v2.bulk.employee-data.upload');

        // Download sample templates
        Route::get('/samples/{type}', [BulkUploadController::class, 'downloadSample'])
            ->name('v2.bulk.samples')
            ->where('type', 'calculation_template|export_template|employee_data');

        // Validate upload files
        Route::post('/validate/{type}', [BulkUploadController::class, 'validateUpload'])
            ->name('v2.bulk.validate')
            ->where('type', 'calculation-templates|export-templates|employee-data');

        // Preview upload results
        Route::post('/preview/{type}', [BulkUploadController::class, 'previewUpload'])
            ->name('v2.bulk.preview')
            ->where('type', 'calculation-templates|export-templates|employee-data');

        // Get upload statistics
        Route::get('/statistics', [BulkUploadController::class, 'getUploadStatistics'])
            ->name('v2.bulk.statistics');
    });
});

/*
|--------------------------------------------------------------------------
| Migration & Testing Routes
|--------------------------------------------------------------------------
| Routes for migrating from old system to new system
*/
Route::prefix('migration')->group(function () {

    // Convert legacy templates to new format
    Route::post('/convert-legacy-templates', [CalculationTemplateController::class, 'convertLegacyTemplates'])
        ->name('migration.convert-legacy-templates');

    // Validate conversion results
    Route::get('/validation-report', [CalculationTemplateController::class, 'getValidationReport'])
        ->name('migration.validation-report');

    // Test new system against old system
    Route::post('/test-accuracy', [InvoiceSnapshotController::class, 'testAccuracyAgainstOldSystem'])
        ->name('migration.test-accuracy');
});
