<?php

use App\Http\Controllers\Api\AttendanceExportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Attendance Export Module Routes
|--------------------------------------------------------------------------
| Routes for attendance export functionality, template generation,
| file uploads, validation, and preview capabilities
| Part of HR & Payroll Management Module
*/

/*
|--------------------------------------------------------------------------
| Phase 1.1: Attendance Export Routes
|--------------------------------------------------------------------------
| Routes for exporting attendance templates, previews, and statistics
*/

Route::middleware(['auth:sanctum'])->prefix('attendance-export')->group(function () {
    // Export attendance template for a client
    Route::post('/export-template', [AttendanceExportController::class, 'exportTemplate'])
        ->name('attendance.export.template');

    // Get export preview data
    Route::post('/preview', [AttendanceExportController::class, 'getExportPreview'])
        ->name('attendance.export.preview');

    // Validate client templates
    Route::post('/validate-templates', [AttendanceExportController::class, 'validateTemplates'])
        ->name('attendance.export.validate.templates');

    // Get export statistics
    Route::post('/stats', [AttendanceExportController::class, 'getExportStats'])
        ->name('attendance.export.stats');

    // Upload and process attendance data
    Route::post('/upload', [AttendanceExportController::class, 'uploadAttendance'])
        ->name('attendance.export.upload');
});

/*
|--------------------------------------------------------------------------
| Phase 1.3: Enhanced Attendance Upload Process Routes
|--------------------------------------------------------------------------
| Routes for enhanced attendance upload with validation, preview, and management
*/

Route::middleware(['auth:sanctum'])->prefix('attendance')->group(function () {
    // Upload with direct matching (alternative endpoint)
    Route::post('/upload-with-direct-matching', [AttendanceExportController::class, 'uploadAttendance'])
        ->name('attendance.upload.direct.matching');

    // Phase 2.1: Enhanced upload with save and validation
    Route::post('/upload-enhanced', [AttendanceExportController::class, 'processUploadedAttendanceWithSave'])
        ->name('attendance.upload.enhanced');

    // Get validation results for an upload
    Route::get('/validation-results/{uploadId}', [AttendanceExportController::class, 'getValidationResults'])
        ->name('attendance.validation.results');

    // Get template coverage for an upload
    Route::get('/template-coverage/{uploadId}', [AttendanceExportController::class, 'getTemplateCoverage'])
        ->name('attendance.template.coverage');

    // Phase 2.1: Get preview data for an upload (for modal)
    Route::get('/{uploadId}/preview', [AttendanceExportController::class, 'getUploadPreview'])
        ->name('attendance.upload.preview');

    // Get all attendance uploads (for display in frontend)
    Route::get('/uploads', [AttendanceExportController::class, 'getAttendanceUploads'])
        ->name('attendance.uploads.list');

    // Get attendance uploads for payroll processing (is_for_payroll = true)
    Route::get('/uploads/payroll', [AttendanceExportController::class, 'getAttendanceForPayroll'])
        ->name('attendance.uploads.payroll');

    // Delete an attendance upload
    Route::delete('/uploads/{uploadId}', [AttendanceExportController::class, 'deleteUpload'])
        ->name('attendance.uploads.delete');

    // Download attendance template for a client (GET endpoint to match frontend expectation)
    Route::get('/template/download/{clientId}', [AttendanceExportController::class, 'downloadAttendanceTemplate'])
        ->name('attendance.template.download');

    // Generate invoice from attendance upload
    Route::post('/{uploadId}/generate-invoice', [AttendanceExportController::class, 'generateInvoice'])
        ->name('attendance.generate.invoice');

    // Get generated invoices list
    Route::get('/generated-invoices', [AttendanceExportController::class, 'getGeneratedInvoices'])
        ->name('attendance.generated.invoices');

    // Get invoice details with line items
    Route::get('/invoice/{invoiceId}/details', [AttendanceExportController::class, 'getInvoiceDetails'])
        ->name('attendance.invoice.details');

    // Export invoice to PDF (with optional issue date)
    Route::post('/invoice/{invoiceId}/export-pdf', [AttendanceExportController::class, 'exportInvoicePDF'])
        ->name('attendance.invoice.export.pdf');

    // Export invoice to Excel
    Route::get('/invoice/{invoiceId}/export-excel', [AttendanceExportController::class, 'exportInvoiceExcel'])
        ->name('attendance.invoice.export.excel');

    // Export FIRS-compliant PDF with QR code (only for FIRS-approved invoices)
    Route::post('/invoice/{invoiceId}/export-firs-pdf', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'exportFIRSCompliancePDF'])
        ->name('attendance.invoice.export.firs.pdf');

    // Test endpoint (temporary)
    Route::get('/test-invoice-endpoint', function () {
        return response()->json(['message' => 'Invoice endpoint is working', 'timestamp' => now()]);
    })->name('attendance.test.invoice');
});



Route::middleware(['auth:sanctum'])->prefix('attendance')->group(function () {

    // Update individual attendance record
    Route::put('/record/{recordId}/update', [AttendanceExportController::class, 'updateAttendanceRecord'])
        ->name('attendance.record.update');

    // Delete individual attendance record
    Route::delete('/record/{recordId}', [AttendanceExportController::class, 'deleteAttendanceRecord'])
        ->name('attendance.record.delete');

    // Add staff to attendance upload
    Route::post('/{uploadId}/add-staff', [AttendanceExportController::class, 'addStaffToAttendance'])
        ->name('attendance.add.staff');

    /*
    |--------------------------------------------------------------------------
    | FIRS E-Invoicing Integration Routes
    |--------------------------------------------------------------------------
    | Routes for Federal Inland Revenue Service (FIRS) e-invoicing integration
    | Handles invoice submission, approval, and generation with FIRS compliance
    */

    // Preview invoice data for FIRS submission
    Route::get('/{uploadId}/preview-invoice-for-firs', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'previewInvoiceForFIRS'])
        ->name('attendance.firs.preview');

    // Submit invoice to FIRS for approval
    Route::post('/{uploadId}/submit-to-firs', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'submitToFIRS'])
        ->name('attendance.firs.submit');

    // Generate invoice with FIRS approval data
    Route::post('/{uploadId}/generate-invoice-with-firs', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'generateInvoiceWithFIRS'])
        ->name('attendance.firs.generate');

    // INVOICE-BASED FIRS ROUTES (for generated invoices workflow)
    // Preview generated invoice data for FIRS submission
    Route::get('/invoice/{invoiceId}/preview-for-firs', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'previewInvoiceDataForFIRS'])
        ->name('attendance.invoice.firs.preview');

    // Submit generated invoice to FIRS for approval
    Route::post('/invoice/{invoiceId}/submit-to-firs', [\App\Http\Controllers\Admin\HRPayrollManagement\Invoicing\FIRSInvoiceController::class, 'submitInvoiceToFIRS'])
        ->name('attendance.invoice.firs.submit');
});
