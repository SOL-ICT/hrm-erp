<?php

use Illuminate\Support\Facades\Route;
use App\Services\InvoicePDFExportService;

Route::get('/', function () {
    return view('welcome');
});

// Test route for PDF generation
Route::get('/test-pdf/{invoiceId}', function ($invoiceId) {
    try {
        return InvoicePDFExportService::exportInvoiceToPDF($invoiceId);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'message' => 'PDF generation test failed'
        ], 500);
    }
});
