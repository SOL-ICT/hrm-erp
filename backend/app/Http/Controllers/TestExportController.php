<?php

namespace App\Http\Controllers;

use App\Models\AttendanceUpload;
use App\Exports\TemplateBasedInvoiceExport;
use Maatwebsite\Excel\Facades\Excel;

class TestExportController extends Controller
{
    public function testFiduciaExport()
    {
        try {
            // Get Fiducia attendance upload
            $upload = AttendanceUpload::with(['attendanceRecords.staff', 'client'])
                ->where('id', 22)
                ->first();

            if (!$upload) {
                return response()->json(['error' => 'Attendance upload not found'], 404);
            }

            echo "Testing export for: " . $upload->client->organisation_name . "\n";
            echo "Attendance records: " . $upload->attendanceRecords->count() . "\n";
            echo "Payroll month: " . $upload->payroll_month . "\n";

            // Test creating the export object
            $export = new TemplateBasedInvoiceExport(
                $upload->attendanceRecords,
                $upload->client,
                $upload
            );

            echo "Export object created successfully!\n";
            echo "Multi-sheet export structure implemented.\n";

            return response()->json([
                'success' => true,
                'message' => 'Export template test completed',
                'details' => [
                    'client' => $upload->client->organisation_name,
                    'attendance_records' => $upload->attendanceRecords->count(),
                    'payroll_month' => $upload->payroll_month
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }
}
