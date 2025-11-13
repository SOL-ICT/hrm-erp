<?php

use App\Http\Controllers\Api\RecruitmentManagement\ManualBoardingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Manual Staff Boarding Routes
|--------------------------------------------------------------------------
|
| Routes for manual staff boarding functionality - allows direct staff
| creation without going through the candidate application process
|
*/

Route::prefix('recruitment-management/manual-boarding')->name('manual-boarding.')->group(function () {

    // Get clients with available recruitment tickets
    Route::get('/clients', [ManualBoardingController::class, 'getClients'])
        ->name('clients');

    // Get recruitment tickets for a specific client
    Route::get('/tickets', [ManualBoardingController::class, 'getTickets'])
        ->name('tickets');

    // Get pay grades for a specific recruitment ticket
    Route::get('/pay-grades', [ManualBoardingController::class, 'getPayGrades'])
        ->name('pay-grades');

    // Get staff types for a client
    Route::get('/staff-types', [ManualBoardingController::class, 'getStaffTypes'])
        ->name('staff-types');

    // Create staff member manually
    Route::post('/create-staff', [ManualBoardingController::class, 'createStaff'])
        ->name('create-staff');

    // Excel template and bulk upload routes
    Route::prefix('excel')->name('excel.')->group(function () {

        // Generate Excel template for bulk upload
        Route::post('/template', [ManualBoardingController::class, 'generateExcelTemplate'])
            ->name('template');

        // Preview Excel upload data
        Route::post('/preview', [ManualBoardingController::class, 'previewBulkUpload'])
            ->name('preview');

        // Process bulk upload
        Route::post('/upload', [ManualBoardingController::class, 'processBulkUpload'])
            ->name('upload');
    });

    // Debug routes (only in development)
    if (config('app.debug')) {
        Route::get('/debug/routes', function () {
            return response()->json([
                'manual_boarding_routes' => [
                    'GET /manual-boarding/clients' => 'Get clients with available tickets',
                    'GET /manual-boarding/tickets?client_id={id}' => 'Get tickets for client',
                    'GET /manual-boarding/pay-grades?ticket_id={id}' => 'Get pay grades for ticket',
                    'GET /manual-boarding/staff-types?client_id={id}' => 'Get staff types for client',
                    'POST /manual-boarding/create-staff' => 'Create staff member manually',
                    'GET /manual-boarding/excel/template' => 'Generate Excel template',
                    'POST /manual-boarding/excel/preview' => 'Preview Excel upload',
                    'POST /manual-boarding/excel/upload' => 'Process bulk upload'
                ]
            ]);
        })->name('debug.routes');
    }
});
