<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeManagement\TerminationController;
use App\Http\Controllers\EmployeeManagement\PromotionController;
use App\Http\Controllers\EmployeeManagement\RedeploymentController;
use App\Http\Controllers\EmployeeManagement\CautionController;
use App\Http\Controllers\EmployeeManagement\WarningController;
use App\Http\Controllers\EmployeeManagement\SuspensionController;
use App\Http\Controllers\EmployeeManagement\BlacklistController;
use App\Http\Controllers\EmployeeManagement\HelperController;

/*
|--------------------------------------------------------------------------
| Employee Management Routes
|--------------------------------------------------------------------------
| Routes for handling staff terminations, promotions, redeployments,
| warnings, cautions, suspensions, and blacklist management.
|
| All routes are prefixed with /employee-management
| All routes require authentication via auth:sanctum middleware
*/

Route::prefix('employee-management')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Helper/Dropdown Data Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('helpers')->group(function () {
        Route::get('/clients', [HelperController::class, 'getClients']);
        Route::get('/job-structures', [HelperController::class, 'getJobStructures']);
        Route::get('/pay-grades', [HelperController::class, 'getPayGrades']);
        Route::get('/staff', [HelperController::class, 'getStaff']);
        Route::get('/departments', [HelperController::class, 'getDepartments']);
        Route::get('/designations', [HelperController::class, 'getDesignations']);
        Route::get('/service-locations', [HelperController::class, 'getServiceLocations']);
        Route::get('/termination-types', [HelperController::class, 'getTerminationTypes']);
        Route::get('/redeployment-types', [HelperController::class, 'getRedeploymentTypes']);
        Route::get('/warning-levels', [HelperController::class, 'getWarningLevels']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Terminations
    |--------------------------------------------------------------------------
    */
    Route::prefix('terminations')->group(function () {
        Route::get('/', [TerminationController::class, 'index']);
        Route::post('/', [TerminationController::class, 'store']);
        Route::get('/{id}', [TerminationController::class, 'show']);
        Route::put('/{id}', [TerminationController::class, 'update']);
        Route::delete('/{id}', [TerminationController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [TerminationController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [TerminationController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Promotions
    |--------------------------------------------------------------------------
    */
    Route::prefix('promotions')->group(function () {
        Route::get('/', [PromotionController::class, 'index']);
        Route::post('/', [PromotionController::class, 'store']);
        Route::get('/{id}', [PromotionController::class, 'show']);
        Route::put('/{id}', [PromotionController::class, 'update']);
        Route::delete('/{id}', [PromotionController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [PromotionController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [PromotionController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Redeployments (including cross-client)
    |--------------------------------------------------------------------------
    */
    Route::prefix('redeployments')->group(function () {
        Route::get('/', [RedeploymentController::class, 'index']);
        Route::post('/', [RedeploymentController::class, 'store']);
        Route::get('/{id}', [RedeploymentController::class, 'show']);
        Route::put('/{id}', [RedeploymentController::class, 'update']);
        Route::delete('/{id}', [RedeploymentController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [RedeploymentController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [RedeploymentController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Cautions
    |--------------------------------------------------------------------------
    */
    Route::prefix('cautions')->group(function () {
        Route::get('/', [CautionController::class, 'index']);
        Route::post('/', [CautionController::class, 'store']);
        Route::get('/{id}', [CautionController::class, 'show']);
        Route::put('/{id}', [CautionController::class, 'update']);
        Route::delete('/{id}', [CautionController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [CautionController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [CautionController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Warnings (first, second, final)
    |--------------------------------------------------------------------------
    */
    Route::prefix('warnings')->group(function () {
        Route::get('/', [WarningController::class, 'index']);
        Route::post('/', [WarningController::class, 'store']);
        Route::get('/{id}', [WarningController::class, 'show']);
        Route::put('/{id}', [WarningController::class, 'update']);
        Route::delete('/{id}', [WarningController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [WarningController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [WarningController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Staff Suspensions
    |--------------------------------------------------------------------------
    */
    Route::prefix('suspensions')->group(function () {
        Route::get('/', [SuspensionController::class, 'index']);
        Route::post('/', [SuspensionController::class, 'store']);
        Route::get('/{id}', [SuspensionController::class, 'show']);
        Route::put('/{id}', [SuspensionController::class, 'update']);
        Route::delete('/{id}', [SuspensionController::class, 'destroy']);

        // Bulk operations
        Route::get('/template/download', [SuspensionController::class, 'downloadTemplate']);
        Route::post('/bulk/upload', [SuspensionController::class, 'bulkUpload']);
    });

    /*
    |--------------------------------------------------------------------------
    | Blacklist Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('blacklist')->group(function () {
        Route::get('/', [BlacklistController::class, 'index']);
        Route::get('/{id}', [BlacklistController::class, 'show']);
        Route::post('/check', [BlacklistController::class, 'check']); // Check if staff is blacklisted

        // Note: Blacklist records are created automatically via TerminationController
        // Manual creation/deletion is intentionally restricted for audit purposes
    });
});
