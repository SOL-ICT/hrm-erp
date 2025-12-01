<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StaffBoardingController;
use App\Http\Controllers\RecruitmentHierarchyController;

/*
|--------------------------------------------------------------------------
| Staff Boarding Approval & Hierarchy Management Routes
|--------------------------------------------------------------------------
| Routes for staff boarding approval workflow and recruitment hierarchy
| permission management. Implements Control Department final approval.
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // ====================================
    // STAFF BOARDING APPROVAL ROUTES
    // ====================================

    Route::prefix('boarding')->group(function () {

        // Get pending approvals (filtered by user's permissions)
        Route::get('/pending-approvals', [StaffBoardingController::class, 'getPendingApprovals'])
            ->name('boarding.pending-approvals');

        // Supervisor-level approval (moves from 'pending' to 'pending_control_approval')
        Route::post('/{staffId}/approve', [StaffBoardingController::class, 'approveBoarding'])
            ->name('boarding.approve');

        // Supervisor-level rejection
        Route::post('/{staffId}/reject', [StaffBoardingController::class, 'rejectBoarding'])
            ->name('boarding.reject');

        // Bulk approval (supervisor level)
        Route::post('/bulk-approve', [StaffBoardingController::class, 'bulkApprove'])
            ->name('boarding.bulk-approve');

        // Control Department final approval (activates staff for payroll)
        Route::post('/{staffId}/control-approve', [StaffBoardingController::class, 'controlApprove'])
            ->name('boarding.control-approve');

        // Control Department rejection (compliance issues)
        Route::post('/{staffId}/control-reject', [StaffBoardingController::class, 'controlReject'])
            ->name('boarding.control-reject');

        // Bulk Control approval
        Route::post('/bulk-control-approve', [StaffBoardingController::class, 'bulkControlApprove'])
            ->name('boarding.bulk-control-approve');
    });

    // ====================================
    // RECRUITMENT HIERARCHY MANAGEMENT
    // ====================================

    Route::prefix('recruitment-hierarchy')->group(function () {

        // Get all role permissions (Super Admin & Global Admin only)
        Route::get('/', [RecruitmentHierarchyController::class, 'index'])
            ->name('recruitment-hierarchy.index');

        // Update role permissions (Super Admin & Global Admin only)
        Route::put('/{roleId}', [RecruitmentHierarchyController::class, 'update'])
            ->name('recruitment-hierarchy.update');

        // Get current user's permissions (all authenticated users)
        Route::get('/my-permissions', [RecruitmentHierarchyController::class, 'getMyPermissions'])
            ->name('recruitment-hierarchy.my-permissions');
    });
});
