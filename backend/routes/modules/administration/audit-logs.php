<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuditLogController;

Route::prefix('audit-logs')->name('audit-logs.')->group(function () {
    Route::get('/', [AuditLogController::class, 'index'])->name('index');
    Route::get('/{id}', [AuditLogController::class, 'show'])->name('show');
    Route::get('/by-user/{userId}', [AuditLogController::class, 'getByUser'])->name('by-user');
    Route::get('/by-module/{module}', [AuditLogController::class, 'getByModule'])->name('by-module');
    Route::get('/by-table/{table}', [AuditLogController::class, 'getByTable'])->name('by-table');
    Route::get('/export/csv', [AuditLogController::class, 'exportCsv'])->name('export-csv');
});
