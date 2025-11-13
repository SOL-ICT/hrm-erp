<?php

use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\InvoiceTemplateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Invoicing Module Routes
|--------------------------------------------------------------------------
| Routes for invoice generation, management, and Excel export functionality
| Part of HR & Payroll Management Module
*/

Route::prefix('invoices')->group(function () {

    // Invoice listing and filtering
    Route::get('/', [InvoiceController::class, 'index'])
        ->name('invoices.index');

    // Invoice statistics for dashboard
    Route::get('/statistics', [InvoiceController::class, 'statistics'])
        ->name('invoices.statistics');

    // Available attendance uploads for invoice generation
    Route::get('/available-attendance', [InvoiceController::class, 'availableAttendance'])
        ->name('invoices.available-attendance');

    // Generate new invoice
    Route::post('/generate', [InvoiceController::class, 'generate'])
        ->name('invoices.generate');

    // Get single invoice details
    Route::get('/{id}', [InvoiceController::class, 'show'])
        ->name('invoices.show')
        ->where('id', '[0-9]+');

    // Export invoice to Excel
    Route::get('/{id}/export-excel', [InvoiceController::class, 'exportExcel'])
        ->name('invoices.export-excel')
        ->where('id', '[0-9]+');

    // Delete invoice (soft delete)
    Route::delete('/{id}', [InvoiceController::class, 'destroy'])
        ->name('invoices.destroy')
        ->where('id', '[0-9]+');
});

/*
|--------------------------------------------------------------------------
| FIRS E-Invoicing Routes
|--------------------------------------------------------------------------
| Routes for FIRS (Federal Inland Revenue Service) e-invoicing integration
| Part of Invoicing Module Extension
*/

use App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController;

Route::prefix('admin/firs-invoice')->group(function () {

    // FIRS Service Status
    Route::get('/status', [FIRSInvoiceController::class, 'getFIRSServiceStatus'])
        ->name('firs.service.status');

    // Preview invoice for FIRS submission
    Route::get('/attendance/{uploadId}/preview', [FIRSInvoiceController::class, 'previewInvoiceForFIRS'])
        ->name('firs.invoice.preview')
        ->where('uploadId', '[0-9]+');

    // Submit invoice directly to FIRS (backend proxy)
    Route::post('/attendance/{uploadId}/submit-to-firs', [FIRSInvoiceController::class, 'submitToFIRS'])
        ->name('firs.invoice.submit')
        ->where('uploadId', '[0-9]+');

    // Store FIRS approval data from frontend (legacy method)
    Route::post('/attendance/{uploadId}/store-approval', [FIRSInvoiceController::class, 'storeFIRSApproval'])
        ->name('firs.invoice.store.approval')
        ->where('uploadId', '[0-9]+');

    // Check FIRS invoice status
    Route::get('/attendance/{uploadId}/status', [FIRSInvoiceController::class, 'checkFIRSStatus'])
        ->name('firs.invoice.status')
        ->where('uploadId', '[0-9]+');

    // Generate invoice PDF with FIRS data
    Route::post('/attendance/{uploadId}/generate-invoice', [FIRSInvoiceController::class, 'generateInvoiceWithFIRS'])
        ->name('firs.invoice.generate')
        ->where('uploadId', '[0-9]+');
});

/*
|--------------------------------------------------------------------------
| Attendance Upload & File Processing Routes
|--------------------------------------------------------------------------
| Routes for uploading and processing attendance files
| Part of HR & Payroll Management Module
*/

Route::prefix('attendance')->group(function () {

    // Upload and process attendance file
    Route::post('/upload', [InvoiceController::class, 'uploadAttendanceFile'])
        ->name('attendance.upload');

    // Upload and process simplified attendance file (Phase 2.2)
    Route::post('/upload-simplified', [InvoiceController::class, 'uploadSimplifiedAttendanceFile'])
        ->name('attendance.upload.simplified');

    // Phase 1.3: Upload with direct pay_grade_structure_id matching
    Route::post('/upload-with-direct-matching', [InvoiceController::class, 'uploadWithDirectMatching'])
        ->name('attendance.upload.direct.matching');

    // Test attendance-based payroll calculation (Phase 3.1 - Development)
    Route::post('/test-payroll-calculation', [InvoiceController::class, 'testAttendancePayrollCalculation'])
        ->name('attendance.test.payroll.calculation');

    // Generate invoice with attendance-based payroll calculation (Phase 3.2 - Template Processing Logic)
    Route::post('/generate-attendance-based', [InvoiceController::class, 'generateAttendanceBasedInvoice'])
        ->name('attendance.generate.attendance.based');
});

// Phase 3.1 - Temporary development endpoint (remove in production)
// Route::post('/attendance/test-payroll-dev', [InvoiceController::class, 'testAttendancePayrollCalculation'])
//     ->name('attendance.test.payroll.dev');

Route::middleware(['auth:sanctum'])->prefix('attendance')->group(function () {

    // Get all attendance uploads with pagination and filters
    Route::get('/uploads', [InvoiceController::class, 'getAttendanceUploads'])
        ->name('attendance.uploads');

    // Get upload statistics
    Route::get('/uploads/{uploadId}/statistics', [InvoiceController::class, 'getUploadStatistics'])
        ->name('attendance.upload.statistics')
        ->where('uploadId', '[0-9]+');

    // Phase 1.3: Get validation results for an upload
    Route::get('/validation-results/{uploadId}', [InvoiceController::class, 'getValidationResults'])
        ->name('attendance.validation.results')
        ->where('uploadId', '[0-9]+');

    // Phase 1.3: Get template coverage for an upload
    Route::get('/template-coverage/{uploadId}', [InvoiceController::class, 'getTemplateCoverage'])
        ->name('attendance.template.coverage')
        ->where('uploadId', '[0-9]+');

    // Delete attendance upload and all associated records
    Route::delete('/uploads/{uploadId}', [InvoiceController::class, 'deleteAttendanceUpload'])
        ->name('attendance.upload.delete')
        ->where('uploadId', '[0-9]+');
});

/*
|--------------------------------------------------------------------------
| Attendance Upload Routes (for invoice generation context)
|--------------------------------------------------------------------------
*/

Route::prefix('attendance-uploads')->group(function () {

    // Get attendance uploads with invoice generation status
    Route::get('/', function () {
        return \App\Models\AttendanceUpload::with(['client', 'generatedInvoices'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    })->name('attendance-uploads.index');
});

/*
|--------------------------------------------------------------------------
| Invoice Template Routes
|--------------------------------------------------------------------------
| Routes for managing invoice templates with custom and statutory components
| Part of HR & Payroll Management Module
*/

Route::prefix('invoice-templates')->group(function () {

    // Get default template for specific client and pay grade
    Route::get('/default', [InvoiceTemplateController::class, 'getDefaultTemplate'])
        ->name('invoice-templates.default');

    // Clone existing template
    Route::post('/{id}/clone', [InvoiceTemplateController::class, 'clone'])
        ->name('invoice-templates.clone')
        ->where('id', '[0-9]+');

    // Excel import/export routes
    Route::post('/import-excel', [InvoiceTemplateController::class, 'importFromExcel'])
        ->name('invoice-templates.import-excel');

    Route::post('/preview-excel', [InvoiceTemplateController::class, 'previewExcelTemplate'])
        ->name('invoice-templates.preview-excel');

    Route::get('/download-sample', [InvoiceTemplateController::class, 'downloadSampleTemplate'])
        ->name('invoice-templates.download-sample');

    Route::get('/{id}/export-excel', [InvoiceTemplateController::class, 'exportToExcel'])
        ->name('invoice-templates.export-excel')
        ->where('id', '[0-9]+');

    // Standard CRUD operations
    Route::get('/', [InvoiceTemplateController::class, 'index'])
        ->name('invoice-templates.index');

    Route::post('/', [InvoiceTemplateController::class, 'store'])
        ->name('invoice-templates.store');

    Route::get('/{id}', [InvoiceTemplateController::class, 'show'])
        ->name('invoice-templates.show')
        ->where('id', '[0-9]+');

    Route::put('/{id}', [InvoiceTemplateController::class, 'update'])
        ->name('invoice-templates.update')
        ->where('id', '[0-9]+');

    Route::delete('/{id}', [InvoiceTemplateController::class, 'destroy'])
        ->name('invoice-templates.destroy')
        ->where('id', '[0-9]+');
});

/*
|--------------------------------------------------------------------------
| Invoice Export Template Routes (Client-specific invoice line items)
|--------------------------------------------------------------------------
| Routes for managing invoice export templates with line items and formulas
| Part of HR & Payroll Management Module
*/

Route::prefix('invoice-export-templates')->group(function () {

    // Get invoice export templates for a client
    Route::get('/', [InvoiceTemplateController::class, 'getExportTemplates'])
        ->name('invoice-export-templates.index');

    // Store new invoice export template
    Route::post('/', [InvoiceTemplateController::class, 'storeExportTemplate'])
        ->name('invoice-export-templates.store');

    // Get specific invoice export template
    Route::get('/{id}', [InvoiceTemplateController::class, 'showExportTemplate'])
        ->name('invoice-export-templates.show')
        ->where('id', '[0-9]+');

    // Update invoice export template
    Route::put('/{id}', [InvoiceTemplateController::class, 'updateExportTemplate'])
        ->name('invoice-export-templates.update')
        ->where('id', '[0-9]+');

    // Delete invoice export template
    Route::delete('/{id}', [InvoiceTemplateController::class, 'destroyExportTemplate'])
        ->name('invoice-export-templates.destroy')
        ->where('id', '[0-9]+');
});
