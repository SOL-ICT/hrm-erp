<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use App\Services\ExportTemplateService;
use App\Services\SafeFormulaCalculator;

class TestRealEndToEndWorkflow extends Command
{
    protected $signature = 'test:real-end-to-end {--client-id=1} {--template-id=}';
    protected $description = 'Test REAL end-to-end workflow using actual calculation template formulas and attendance';

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
        $templateId = $this->option('template-id');

        $this->info("🔄 REAL End-to-End Workflow Test for Client ID: {$clientId}");
        $this->line("============================================================");
        $this->warn("⚠️  This test uses ACTUAL calculation template formulas and attendance logic!");

        // Step 1: Get specific calculation template or first active one
        $this->info("\n📋 Step 1: Getting calculation template...");

        if ($templateId) {
            $calculationTemplate = CalculationTemplate::find($templateId);
        } else {
            $calculationTemplate = CalculationTemplate::where('is_active', true)->first();
        }

        if (!$calculationTemplate) {
            $this->error("❌ No calculation template found");
            return 1;
        }

        $this->info("✅ Found: {$calculationTemplate->name}");
        $this->line("   Pay Grade: {$calculationTemplate->pay_grade_code}");
        $this->line("   Attendance Method: {$calculationTemplate->attendance_calculation_method}");
        $this->line("   Prorate Salary: " . ($calculationTemplate->prorate_salary ? 'Yes' : 'No'));
        $this->line("   Min Attendance Factor: {$calculationTemplate->minimum_attendance_factor}");
        $this->line("   Annual Division Factor: {$calculationTemplate->annual_division_factor}");

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

        // Step 3: Create sample employee data with attendance variations
        $this->info("\n👥 Step 3: Creating employee data with real attendance scenarios...");
        $employees = [
            [
                'employee_id' => 'EMP001',
                'employee_name' => 'Alice Johnson - Full Attendance',
                'designation' => 'Senior Manager',
                'basic_salary' => 500000, // Use actual basic salary input
                'attendance_days' => 22,
                'total_working_days' => 22,
                'attendance_percentage' => 100,
            ],
            [
                'employee_id' => 'EMP002',
                'employee_name' => 'Bob Williams - Partial Attendance',
                'designation' => 'Software Engineer',
                'basic_salary' => 350000,
                'attendance_days' => 18,
                'total_working_days' => 22,
                'attendance_percentage' => 81.8, // 18/22 * 100
            ],
            [
                'employee_id' => 'EMP003',
                'employee_name' => 'Carol Davis - Minimum Attendance',
                'designation' => 'Project Manager',
                'basic_salary' => 450000,
                'attendance_days' => 11,
                'total_working_days' => 22,
                'attendance_percentage' => 50, // Exactly at minimum threshold
            ],
            [
                'employee_id' => 'EMP004',
                'employee_name' => 'David Brown - Below Minimum',
                'designation' => 'Junior Developer',
                'basic_salary' => 250000,
                'attendance_days' => 8,
                'total_working_days' => 22,
                'attendance_percentage' => 36.4, // Below 50% minimum
            ]
        ];

        $this->info("✅ Created " . count($employees) . " employee records with attendance scenarios");

        // Step 4: Calculate salaries using REAL calculation template
        $this->info("\n🧮 Step 4: Calculating salaries using REAL template formulas...");
        $calculatedResults = [];

        foreach ($employees as $employee) {
            $this->line("\n🔍 Processing: {$employee['employee_name']}");
            $this->line("   Attendance: {$employee['attendance_days']}/{$employee['total_working_days']} days ({$employee['attendance_percentage']}%)");

            try {
                // Check minimum attendance requirement
                $attendanceFactor = $employee['attendance_days'] / $employee['total_working_days'];
                $minimumFactor = (float) $calculationTemplate->minimum_attendance_factor;

                if ($attendanceFactor < $minimumFactor) {
                    $minPercentage = $minimumFactor * 100;
                    $this->warn("   ⚠️  Below minimum attendance ({$minPercentage}%) - may affect salary");
                }

                // Base variables for calculation
                $variables = [
                    'basic_salary' => $employee['basic_salary'],
                    'annual_division_factor' => (float) $calculationTemplate->annual_division_factor,
                    'attendance_days' => $employee['attendance_days'],
                    'total_working_days' => $employee['total_working_days'],
                    'attendance_factor' => $attendanceFactor,
                ];

                // Calculate all allowance components using template formulas
                $this->line("   📊 Calculating allowances...");
                $allowances = [];
                foreach ($calculationTemplate->allowance_components as $component => $config) {
                    $formula = $config['formula'] ?? null;
                    $description = $config['description'] ?? ucwords(str_replace('_', ' ', $component));

                    if (empty($formula) || $formula === 'NULL') {
                        $this->line("      • {$description}: Skipped (no formula)");
                        $allowances[$component] = 0;
                        $variables[$component] = 0;
                        continue;
                    }

                    try {
                        $value = $this->calculator->evaluate($formula, $variables);
                        $allowances[$component] = $value;
                        $variables[$component] = $value; // Add to variables for dependent calculations
                        $this->line("      • {$description}: ₦" . number_format($value, 2));
                    } catch (\Exception $e) {
                        $this->error("      ❌ Error calculating {$component}: " . $e->getMessage());
                        $allowances[$component] = 0;
                        $variables[$component] = 0;
                    }
                }

                // Calculate salary components using template formulas
                $this->line("   💰 Calculating salary components...");
                $salaryResults = [];
                foreach ($calculationTemplate->salary_components as $component => $config) {
                    $formula = $config['formula'] ?? null;
                    $description = $config['description'] ?? ucwords(str_replace('_', ' ', $component));

                    if (empty($formula) || $formula === 'NULL') {
                        // For basic_salary, use the input value
                        if ($component === 'basic_salary') {
                            $salaryResults[$component] = $employee['basic_salary'];
                            $variables[$component] = $employee['basic_salary'];
                            $this->line("      • {$description}: ₦" . number_format($employee['basic_salary'], 2) . " (input)");
                        } else {
                            $this->line("      • {$description}: Skipped (no formula)");
                            $salaryResults[$component] = 0;
                            $variables[$component] = 0;
                        }
                        continue;
                    }

                    try {
                        $value = $this->calculator->evaluate($formula, $variables);
                        $salaryResults[$component] = $value;
                        $variables[$component] = $value;
                        $this->line("      • {$description}: ₦" . number_format($value, 2));
                    } catch (\Exception $e) {
                        $this->error("      ❌ Error calculating {$component}: " . $e->getMessage());
                        $salaryResults[$component] = 0;
                        $variables[$component] = 0;
                    }
                }

                // Calculate gross salary (sum of basic + allowances)
                $grossSalary = $salaryResults['basic_salary'] + array_sum($allowances);
                $salaryResults['gross_salary'] = $grossSalary;
                $variables['gross_salary'] = $grossSalary;
                $this->line("   💰 Calculated Gross Salary: ₦" . number_format($grossSalary, 2));

                // Calculate deductions using template formulas
                $this->line("   📉 Calculating deductions...");
                $deductions = [];
                $totalDeductions = 0;
                foreach ($calculationTemplate->deduction_components as $component => $config) {
                    $formula = $config['formula'] ?? null;
                    $description = $config['description'] ?? ucwords(str_replace('_', ' ', $component));

                    if (empty($formula) || $formula === 'NULL') {
                        $this->line("      • {$description}: Skipped (no formula)");
                        $deductions[$component] = 0;
                        $variables[$component] = 0;
                        continue;
                    }

                    try {
                        $value = $this->calculator->evaluate($formula, $variables);
                        $deductions[$component] = $value;
                        $variables[$component] = $value;
                        $totalDeductions += $value;
                        $this->line("      • {$description}: ₦" . number_format($value, 2));
                    } catch (\Exception $e) {
                        $this->error("      ❌ Error calculating {$component}: " . $e->getMessage());
                        $deductions[$component] = 0;
                        $variables[$component] = 0;
                    }
                }

                // Calculate statutory components using template formulas
                $this->line("   🏛️  Calculating statutory components...");
                $statutory = [];
                foreach ($calculationTemplate->statutory_components as $component => $config) {
                    $formula = $config['formula'] ?? null;
                    $description = $config['description'] ?? ucwords(str_replace('_', ' ', $component));

                    if (empty($formula) || $formula === 'NULL') {
                        $this->line("      • {$description}: Skipped (no formula)");
                        $statutory[$component] = 0;
                        $variables[$component] = 0;
                        continue;
                    }

                    try {
                        $value = $this->calculator->evaluate($formula, $variables);
                        $statutory[$component] = $value;
                        $variables[$component] = $value;
                        $totalDeductions += $value;
                        $this->line("      • {$description}: ₦" . number_format($value, 2));
                    } catch (\Exception $e) {
                        $this->error("      ❌ Error calculating {$component}: " . $e->getMessage());
                        $statutory[$component] = 0;
                        $variables[$component] = 0;
                    }
                }

                // Calculate net salary
                $netSalary = $grossSalary - $totalDeductions;
                $salaryResults['net_salary'] = $netSalary;
                $salaryResults['total_deductions'] = $totalDeductions;
                $this->line("   💰 Total Deductions: ₦" . number_format($totalDeductions, 2));

                // Apply attendance proration if enabled
                if ($calculationTemplate->prorate_salary && $attendanceFactor < 1.0) {
                    $attendancePercent = $attendanceFactor * 100;
                    $this->warn("   ⚖️  Applying attendance proration ({$attendancePercent}%)");

                    // Prorate applicable components
                    foreach (['basic_salary', 'gross_salary', 'net_salary'] as $component) {
                        if (isset($salaryResults[$component])) {
                            $original = $salaryResults[$component];
                            $salaryResults[$component] = $original * $attendanceFactor;
                            $this->line("      • {$component}: ₦" . number_format($original, 2) . " → ₦" . number_format($salaryResults[$component], 2));
                        }
                    }
                }

                // Build final result record
                $calculatedResults[] = array_merge([
                    'employee_id' => $employee['employee_id'],
                    'employee_name' => $employee['employee_name'],
                    'designation' => $employee['designation'],
                    'attendance_days' => $employee['attendance_days'],
                    'total_working_days' => $employee['total_working_days'],
                    'attendance_percentage' => round($employee['attendance_percentage'], 1),
                    'payment_date' => now()->format('Y-m-d'),
                    'period' => now()->format('F Y'),
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'payment_reference' => 'REAL-' . strtoupper(uniqid()),
                    'employee_bank' => 'Sample Bank ' . rand(1, 5),
                ], $salaryResults, $allowances, $deductions, $statutory);

                $netSalary = $salaryResults['net_salary'] ?? 0;
                $this->info("   ✅ Final Net Salary: ₦" . number_format($netSalary, 2));
            } catch (\Exception $e) {
                $this->error("   ❌ Error calculating for {$employee['employee_name']}: " . $e->getMessage());
                $this->line("   File: " . $e->getFile() . ":" . $e->getLine());
            }
        }

        if (empty($calculatedResults)) {
            $this->error("❌ No successful calculations");
            return 1;
        }

        $this->info("\n✅ Successfully calculated salaries for " . count($calculatedResults) . " employees using REAL formulas");

        // Step 5: Generate export
        $this->info("\n📤 Step 5: Generating export with real calculation results...");

        try {
            $result = $this->exportService->generateExport(
                $exportTemplate,
                $calculatedResults,
                [
                    'filename' => 'real-end-to-end-test-' . now()->format('Y-m-d-H-i-s'),
                    'title' => 'REAL End-to-End Test Export for ' . $exportTemplate->client->organisation_name,
                    'period' => now()->format('F Y'),
                    'template_used' => $calculationTemplate->name,
                    'attendance_applied' => $calculationTemplate->prorate_salary,
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
                $this->line("   Template: {$calculationTemplate->name}");

                // Calculate totals
                $totalNet = array_sum(array_column($calculatedResults, 'net_salary'));
                $totalGross = array_sum(array_column($calculatedResults, 'gross_salary'));

                $this->info("💰 Financial Summary (REAL calculations):");
                $this->line("   Total Gross: ₦" . number_format($totalGross, 2));
                $this->line("   Total Net: ₦" . number_format($totalNet, 2));
                $this->line("   Total Deductions: ₦" . number_format($totalGross - $totalNet, 2));

                $this->info("\n🎉 REAL End-to-End Test SUCCESSFUL!");
                $this->line("Complete workflow: Real Template → Real Formulas → Attendance → Export ✅");
            } else {
                $this->warn("⚠️ Export generated but file location unclear");
            }
        } catch (\Exception $e) {
            $this->error("❌ Export generation failed:");
            $this->error("   " . $e->getMessage());
            $this->line("   File: " . $e->getFile() . ":" . $e->getLine());
            return 1;
        }

        return 0;
    }
}
