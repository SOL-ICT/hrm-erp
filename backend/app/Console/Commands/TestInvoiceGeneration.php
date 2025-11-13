<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AttendanceExportService;
use App\Models\AttendanceUpload;

class TestInvoiceGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:invoice-generation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test invoice generation with TemplateBasedCalculationService';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Testing TemplateBasedCalculationService Integration ===');

        try {
            // Get a valid attendance upload
            $upload = AttendanceUpload::find(15);
            if (!$upload) {
                $this->error('Upload ID 15 not found');
                return 1;
            }

            $this->info("Upload found: ID {$upload->id}, Client: {$upload->client_id}");
            $this->info("Records count: " . $upload->attendanceRecords()->count());

            // Test the updated invoice generation
            $service = new AttendanceExportService();
            $result = $service->generateInvoiceFromUpload($upload);

            $this->info('=== Invoice Generation Results ===');
            $this->info("Invoice ID: {$result['invoice_id']}");
            $this->info("Total Amount: ₦{$result['total_amount']}");
            $this->info("Staff Count: {$result['total_staff']}");

            if (isset($result['gross_payroll'])) {
                $this->info("Gross Payroll: ₦{$result['gross_payroll']}");
                $this->info("Total Deductions: ₦{$result['total_deductions']}");
                $this->info("Net Payroll: ₦{$result['net_payroll']}");
            }

            $this->info('=== Staff Details ===');
            foreach ($result['staff_details'] as $staff) {
                $this->info("Staff: {$staff['staff_name']}");
                $this->info("  Days Worked: {$staff['days_worked']}");
                $this->info("  Attendance Factor: " . ($staff['attendance_factor'] ?? 'N/A'));
                $this->info("  Basic: ₦{$staff['basic_amount']}");
                $this->info("  Gross: ₦" . ($staff['gross_amount'] ?? 0));
                $this->info("  Net: ₦" . ($staff['net_amount'] ?? 0));
                $this->info("  Total: ₦{$staff['total_amount']}");

                if (isset($staff['error'])) {
                    $this->error("  ERROR: {$staff['error']}");
                }
                $this->line('');
            }

            $this->info('=== Test Completed Successfully ===');
            return 0;
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            $this->error("File: " . $e->getFile() . " Line: " . $e->getLine());
            return 1;
        }
    }
}
