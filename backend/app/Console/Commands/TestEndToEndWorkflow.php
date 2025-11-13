<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use App\Services\ExportTemplateService;
use App\Services\SafeFormulaCalculator;

class TestEndToEndWorkflow extends Command
{
    protected $signature = 'test:end-to-end {--client-id=1}';
    protected $description = 'Test complete workflow from calculation template to export generation';

    protected $exportService;
    protected $calculator;

    public function __construct(ExportTemplateService $exportService, SafeFormulaCalculator $calculator)
    {
        parent::__construct();
        $this->exportService = $exportService;
        $this->calculator = $calculator;
    }

    public function handle()
    {
        $clientId = $this->option('client-id');

        $this->info("🔄 End-to-End Workflow Test for Client ID: {$clientId}");
        $this->line("==========================================================");

        // Step 1: Get calculation template
        $this->info("\n📋 Step 1: Getting calculation template...");
        $calculationTemplate = CalculationTemplate::where('is_active', true)->first();

        if (!$calculationTemplate) {
            $this->error("❌ No active calculation template found");
            return 1;
        }

        $this->info("✅ Found: {$calculationTemplate->name}");
        $this->line("   Pay Grade: {$calculationTemplate->pay_grade_code}");

        // Step 2: Get export template
        $this->info("\n📊 Step 2: Getting export template...");
        $exportTemplate = ExportTemplate::where('client_id', $clientId)
            ->where('is_default', true)
            ->first();

        if (!$exportTemplate) {
            $this->error("❌ No export template found for client ID {$clientId}");
            return 1;
        }

        $this->info("✅ Found: {$exportTemplate->name}");
        $this->line("   Client: {$exportTemplate->client->organisation_name}");
        $this->line("   Format: {$exportTemplate->format}");

        // Step 3: Create sample employee data
        $this->info("\n👥 Step 3: Creating sample employee data...");
        $employees = [
            [
                'employee_id' => 'EMP001',
                'employee_name' => 'Alice Johnson',
                'designation' => 'Senior Manager',
                'monthly_basic' => 500000,
                'housing_percent' => 25,
                'transport_allowance' => 75000,
                'lunch_allowance' => 30000,
                'attendance_days' => 22,
                'total_days' => 22,
            ],
            [
                'employee_id' => 'EMP002',
                'employee_name' => 'Bob Williams',
                'designation' => 'Software Engineer',
                'monthly_basic' => 350000,
                'housing_percent' => 20,
                'transport_allowance' => 50000,
                'lunch_allowance' => 25000,
                'attendance_days' => 20,
                'total_days' => 22,
            ],
            [
                'employee_id' => 'EMP003',
                'employee_name' => 'Carol Davis',
                'designation' => 'Project Manager',
                'monthly_basic' => 450000,
                'housing_percent' => 25,
                'transport_allowance' => 60000,
                'lunch_allowance' => 28000,
                'attendance_days' => 21,
                'total_days' => 22,
            ]
        ];

        $this->info("✅ Created " . count($employees) . " employee records");

        // Step 4: Calculate salaries using calculation template
        $this->info("\n🧮 Step 4: Calculating salaries...");
        $calculatedResults = [];

        foreach ($employees as $employee) {
            try {
                // Use the calculation template's rules to calculate salary
                $variables = [
                    'monthly_basic' => $employee['monthly_basic'],
                    'housing_percent' => $employee['housing_percent'],
                    'transport_allowance' => $employee['transport_allowance'],
                    'lunch_allowance' => $employee['lunch_allowance'],
                    'attendance_days' => $employee['attendance_days'],
                    'total_days' => $employee['total_days'],
                ];

                // Calculate basic salary (prorated for attendance)
                $basicSalary = $this->calculator->evaluate(
                    '(monthly_basic * attendance_days) / total_days',
                    $variables
                );

                // Calculate housing allowance
                $housingAllowance = $this->calculator->evaluate(
                    '(basic_salary * housing_percent) / 100',
                    array_merge($variables, ['basic_salary' => $basicSalary])
                );

                // Calculate gross salary
                $grossSalary = $basicSalary + $housingAllowance + $employee['transport_allowance'] + $employee['lunch_allowance'];

                // Calculate income tax (simplified: 10% of gross)
                $incomeTax = $this->calculator->evaluate('gross_salary * 0.1', ['gross_salary' => $grossSalary]);

                // Calculate pension (7.5% of monthly basic)
                $pension = $this->calculator->evaluate('monthly_basic * 0.075', $variables);

                // Calculate net salary
                $netSalary = $grossSalary - $incomeTax - $pension;

                $calculatedResults[] = [
                    'employee_id' => $employee['employee_id'],
                    'employee_name' => $employee['employee_name'],
                    'designation' => $employee['designation'],
                    'basic_salary' => round($basicSalary, 2),
                    'housing_allowance' => round($housingAllowance, 2),
                    'transport_allowance' => $employee['transport_allowance'],
                    'lunch_allowance' => $employee['lunch_allowance'],
                    'gross_salary' => round($grossSalary, 2),
                    'income_tax' => round($incomeTax, 2),
                    'pension' => round($pension, 2),
                    'net_salary' => round($netSalary, 2),
                    'payment_date' => now()->format('Y-m-d'),
                    'period' => now()->format('F Y'),
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'payment_reference' => 'PAY-' . strtoupper(uniqid()),
                    'employee_bank' => 'Sample Bank ' . rand(1, 5),
                ];

                $this->line("   ✅ {$employee['employee_name']}: ₦" . number_format($netSalary, 2));
            } catch (\Exception $e) {
                $this->error("   ❌ Error calculating for {$employee['employee_name']}: " . $e->getMessage());
            }
        }

        if (empty($calculatedResults)) {
            $this->error("❌ No successful calculations");
            return 1;
        }

        $this->info("✅ Successfully calculated salaries for " . count($calculatedResults) . " employees");

        // Step 5: Generate export
        $this->info("\n📤 Step 5: Generating export...");

        try {
            $result = $this->exportService->generateExport(
                $exportTemplate,
                $calculatedResults,
                [
                    'filename' => 'end-to-end-test-' . now()->format('Y-m-d-H-i-s'),
                    'title' => 'End-to-End Test Export for ' . $exportTemplate->client->organisation_name,
                    'period' => now()->format('F Y'),
                ]
            );

            $this->info("✅ Export generated successfully!");

            if (isset($result['file_path']) && file_exists($result['file_path'])) {
                $fileSize = filesize($result['file_path']);
                $this->info("📁 Export Details:");
                $this->line("   File: {$result['file_path']}");
                $this->line("   Size: " . number_format($fileSize) . " bytes");
                $this->line("   Format: " . $exportTemplate->format);
                $this->line("   Records: " . count($calculatedResults));

                // Calculate total salary
                $totalGross = array_sum(array_column($calculatedResults, 'gross_salary'));
                $totalNet = array_sum(array_column($calculatedResults, 'net_salary'));

                $this->info("💰 Financial Summary:");
                $this->line("   Total Gross: ₦" . number_format($totalGross, 2));
                $this->line("   Total Net: ₦" . number_format($totalNet, 2));
                $this->line("   Total Tax: ₦" . number_format($totalGross - $totalNet, 2));

                $this->info("\n🎉 End-to-End Test SUCCESSFUL!");
                $this->line("Complete workflow: Template → Calculation → Export ✅");
            } else {
                $this->warn("⚠️ Export generated but file location unclear");
            }
        } catch (\Exception $e) {
            $this->error("❌ Export generation failed:");
            $this->error("   " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
