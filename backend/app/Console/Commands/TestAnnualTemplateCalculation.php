<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TemplateBasedCalculationService;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

class TestAnnualTemplateCalculation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:annual-calculation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test annual template calculation to verify monthly conversion';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Annual Template Calculation');
        $this->info('====================================');

        // Get first staff member for testing
        $staff = Staff::first();
        if (!$staff) {
            $this->error('No staff found for testing');
            return 1;
        }

        $this->info("Testing with Staff: {$staff->employee_code}");
        $this->info("Client ID: {$staff->client_id}");
        $this->info("Pay Grade: {$staff->pay_grade_structure_id}");

        // Test calculation service
        $calculationService = new TemplateBasedCalculationService();

        try {
            $result = $calculationService->calculateFromTemplate($staff, $staff->client_id, 1.0);

            $this->info("\n--- Calculation Results ---");
            $this->info("Gross Salary: ₦" . number_format($result['gross_salary'], 2));
            $this->info("Net Salary: ₦" . number_format($result['net_salary'], 2));

            $this->info("\n--- Custom Components (Monthly from Annual) ---");
            foreach ($result['adjusted_components'] as $key => $component) {
                $amount = $component['adjusted_amount'] ?? 0;
                $this->info("  - {$component['name']}: ₦" . number_format($amount, 2));
            }

            $this->info("\n--- Statutory Deductions ---");
            foreach ($result['statutory_deductions'] as $key => $deduction) {
                $this->info("  - {$key}: ₦" . number_format($deduction, 2));
            }

            // Show template comparison
            $template = DB::table('invoice_templates')
                ->where('client_id', $staff->client_id)
                ->where('pay_grade_structure_id', $staff->pay_grade_structure_id)
                ->first();

            if ($template) {
                $this->info("\n--- Template Verification ---");
                $customComponents = json_decode($template->custom_components, true);
                $this->info("Basic Allowance in template (annual): ₦" . number_format($customComponents[0]['rate'], 2));
                $this->info("Basic Allowance calculated (monthly): ₦" . number_format($customComponents[0]['rate'] / 12, 2));
                $this->info("Matches calculation: " . (abs(($customComponents[0]['rate'] / 12) - $result['adjusted_components']['basic_allowance']['base_amount']) < 0.01 ? 'YES' : 'NO'));
            }
        } catch (\Exception $e) {
            $this->error("Calculation failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
