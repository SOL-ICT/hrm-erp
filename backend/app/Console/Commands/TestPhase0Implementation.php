<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TemplateBasedCalculationService;
use App\Models\Client;
use App\Models\Staff;

class TestPhase0Implementation extends Command
{
    protected $signature = 'test:phase0';
    protected $description = 'Test Phase 0 template-based calculation implementation';

    public function handle()
    {
        $this->info('=== PHASE 0 TESTING ===');

        try {
            $service = new TemplateBasedCalculationService();
            $this->info('✅ TemplateBasedCalculationService created successfully');

            $client = Client::first();
            if ($client) {
                $this->info("✅ Found client: {$client->organisation_name} (ID: {$client->id})");

                $coverage = $service->getTemplateCoverage($client->id);
                $this->info('✅ Template coverage retrieved successfully');
                $this->info('Coverage data: ' . json_encode($coverage, JSON_PRETTY_PRINT));

                // Test with a staff member
                $staff = Staff::where('client_id', $client->id)->first();
                if ($staff) {
                    $this->info("✅ Found staff: {$staff->full_name} (Pay Grade: {$staff->pay_grade_structure_id})");

                    $hasTemplate = $service->templateExists($client->id, $staff->pay_grade_structure_id);
                    $this->info("Template exists: " . ($hasTemplate ? "Yes" : "No"));

                    if ($hasTemplate) {
                        $this->info("🧮 Testing calculation...");
                        $result = $service->calculateFromTemplate($staff, $client->id, 0.909);
                        $this->info("✅ Calculation successful!");
                        $this->info("Gross Salary: ₦" . number_format($result['gross_salary'], 2));
                        $this->info("Net Salary: ₦" . number_format($result['net_salary'], 2));
                        $this->info("Template: {$result['template_name']}");
                    }
                }
            }

            $this->info('');
            $this->info('=== PHASE 0 FOUNDATION COMPLETE ===');
        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
        }
    }
}
