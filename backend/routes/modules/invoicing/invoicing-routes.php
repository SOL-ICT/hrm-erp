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
