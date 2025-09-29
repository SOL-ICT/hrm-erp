<?php

use App\Http\Controllers\EmployeeRecordController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Employee Record Management Routes
|--------------------------------------------------------------------------
|
| Routes for managing employee records within the HR & Payroll Management module
| Includes functionality for viewing, filtering, and managing staff information
|
*/

Route::prefix('employee-record')->group(function () {
    
    // Get all active clients for filtering
    Route::get('/clients', [EmployeeRecordController::class, 'getClients']);
    
    // Get locations for a specific client
    Route::get('/clients/{clientId}/locations', [EmployeeRecordController::class, 'getLocationsByClient']);
    
    // Get staff with filtering options
    Route::get('/staff', [EmployeeRecordController::class, 'getStaff']);
    
    // Get comprehensive staff details
    Route::get('/staff/{staffId}/details', [EmployeeRecordController::class, 'getStaffDetails']);
    
    // Update staff basic information
    Route::put('/staff/{staffId}/basic', [EmployeeRecordController::class, 'updateStaffBasic']);
    
    // Update staff personal information
    Route::put('/staff/{staffId}/personal', [EmployeeRecordController::class, 'updateStaffPersonal']);
    
    // Update staff banking information
    Route::put('/staff/{staffId}/banking', [EmployeeRecordController::class, 'updateStaffBanking']);
    
    // Update staff education records
    Route::put('/staff/{staffId}/education', [EmployeeRecordController::class, 'updateStaffEducation']);
    Route::post('/staff/{staffId}/education', [EmployeeRecordController::class, 'addStaffEducation']);
    Route::delete('/staff/{staffId}/education/{educationId}', [EmployeeRecordController::class, 'deleteStaffEducation']);
    
    // Update staff experience records
    Route::put('/staff/{staffId}/experience', [EmployeeRecordController::class, 'updateStaffExperience']);
    Route::post('/staff/{staffId}/experience', [EmployeeRecordController::class, 'addStaffExperience']);
    Route::delete('/staff/{staffId}/experience/{experienceId}', [EmployeeRecordController::class, 'deleteStaffExperience']);
    
    // Update staff emergency contacts
    Route::put('/staff/{staffId}/emergency-contacts', [EmployeeRecordController::class, 'updateStaffEmergencyContacts']);
    Route::post('/staff/{staffId}/emergency-contacts', [EmployeeRecordController::class, 'addStaffEmergencyContact']);
    Route::delete('/staff/{staffId}/emergency-contacts/{contactId}', [EmployeeRecordController::class, 'deleteStaffEmergencyContact']);
    
    // Update staff guarantors
    Route::put('/staff/{staffId}/guarantors', [EmployeeRecordController::class, 'updateStaffGuarantors']);
    Route::post('/staff/{staffId}/guarantors', [EmployeeRecordController::class, 'addStaffGuarantor']);
    Route::delete('/staff/{staffId}/guarantors/{guarantorId}', [EmployeeRecordController::class, 'deleteStaffGuarantor']);
    
    // Update staff legal IDs
    Route::put('/staff/{staffId}/legal-ids', [EmployeeRecordController::class, 'updateStaffLegalIds']);
    
    // Update staff references
    Route::put('/staff/{staffId}/references', [EmployeeRecordController::class, 'updateStaffReferences']);
    Route::post('/staff/{staffId}/references', [EmployeeRecordController::class, 'addStaffReference']);
    Route::delete('/staff/{staffId}/references/{referenceId}', [EmployeeRecordController::class, 'deleteStaffReference']);
    
    // Update complete staff details (all sections at once)
    Route::put('/staff/{staffId}/complete', [EmployeeRecordController::class, 'updateStaffDetails']);
    
    // Get staff statistics for dashboard
    Route::get('/statistics', [EmployeeRecordController::class, 'getStaffStatistics']);
    
    // Export staff data
    Route::get('/export', [EmployeeRecordController::class, 'exportStaffData']);
    
});
