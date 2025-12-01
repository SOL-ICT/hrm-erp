<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BulkStaffUploadController;

/*
|--------------------------------------------------------------------------
| Bulk Staff Upload Routes
|--------------------------------------------------------------------------
| Routes for bulk staff upload via Excel templates
*/

Route::middleware(['auth:sanctum'])->prefix('bulk-staff-upload')->group(function () {

    // Download Excel template for bulk staff upload
    Route::get('/download-template', [BulkStaffUploadController::class, 'downloadTemplate'])
        ->name('bulk-staff-upload.download-template');

    // Preview uploaded Excel file with validation
    Route::post('/preview', [BulkStaffUploadController::class, 'previewUpload'])
        ->name('bulk-staff-upload.preview');

    // Process bulk staff upload
    Route::post('/process', [BulkStaffUploadController::class, 'processUpload'])
        ->name('bulk-staff-upload.process');
});
