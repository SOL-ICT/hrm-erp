<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AttendanceExportService;
use App\Models\Client;

/**
 * TestAttendanceExport
 * 
 * Test command for Phase 1.1 attendance export functionality
 * Validates that the export system works correctly with client data
 */
class TestAttendanceExport extends Command
{
    protected $signature = 'test:attendance-export {client_id}';
    protected $description = 'Test Phase 1.1 attendance export functionality for a specific client';

    public function handle()
    {
        $clientId = $this->argument('client_id');
        $exportService = app(AttendanceExportService::class);

        $this->info("Testing Phase 1.1 Attendance Export for Client ID: {$clientId}");
        $this->newLine();

        try {
            // 1. Validate client exists
            $client = Client::findOrFail($clientId);
            $this->info("✓ Client found: {$client->organisation_name}");

            // 2. Get export preview
            $this->info("Getting export preview...");
            $preview = $exportService->getExportPreview($clientId);

            $this->table(['Metric', 'Value'], [
                ['Total Staff', $preview['total_active_staff']],
                ['Covered Staff', $preview['staff_with_templates']],
                ['Uncovered Staff', $preview['staff_without_templates']],
                ['Export Ready', $preview['can_export'] ? 'Yes' : 'No']
            ]);

            // 3. Get export statistics
            $this->info("Getting export statistics...");
            $stats = $exportService->getClientExportStats($clientId);

            $this->info("Client: {$stats['client']['name']} (ID: {$stats['client']['id']})");
            $this->info("Total Staff: {$stats['client']['total_staff']}");
            $this->info("Coverage: {$stats['summary']['coverage_percentage']}%");
            $this->info("Export Ready: " . ($stats['export_ready'] ? 'Yes' : 'No'));

            // 4. Validate templates
            $this->info("Validating templates...");
            $validation = $exportService->validateStaffTemplates($clientId);

            if ($validation['validation_passed']) {
                $this->info("✓ All staff have template coverage!");
            } else {
                $this->warn("⚠ Missing templates for pay grades: " . implode(', ', $validation['missing_templates']));
            }

            // 5. Test export (if ready)
            if ($preview['can_export']) {
                $this->info("Testing export generation...");
                $exportResult = $exportService->exportAttendanceTemplate($clientId);
                $this->info("✓ Export generated successfully!");
                $this->info("File would be downloaded in real scenario");
            } else {
                $this->warn("⚠ Export not ready - missing template coverage");
            }

            $this->newLine();
            $this->info("Phase 1.1 Test Completed Successfully!");
        } catch (\Exception $e) {
            $this->error("Test failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
