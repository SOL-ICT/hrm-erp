<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LeaveEngine\LpeStaffLevelController;
use App\Http\Controllers\LeaveEngine\LpeLeaveTypeController;
use App\Http\Controllers\LeaveEngine\LpeLeaveEntitlementController;
use App\Http\Controllers\LeaveEngine\LpeJobStructureController;

/*
|--------------------------------------------------------------------------
| Leave Engine Routes
|--------------------------------------------------------------------------
| API resources for the Leave Policy Engine (LPE).
| Prefix: /lpe
| Note: routes are protected by auth:sanctum middleware via inclusion.
*/

Route::prefix('lpe')->name('lpe.')->middleware(['auth:sanctum'])->group(function () {
    // Job structures (company-scoped job positions for entitlements)
    Route::get('job-structures', [LpeJobStructureController::class, 'index']);

    // Staff levels (entitlement grouping by level - legacy)
    Route::apiResource('staff-levels', LpeStaffLevelController::class);

    // Leave types (Annual, Sick, Maternity, etc.)
    Route::apiResource('leave-types', LpeLeaveTypeController::class);

    // Entitlements (matrix linking job-structure x leave-type)
    Route::apiResource('entitlements', LpeLeaveEntitlementController::class);
});
