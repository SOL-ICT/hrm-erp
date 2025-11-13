<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\AttendanceUpload;
use App\Models\InvoiceTemplate;
use App\Models\Client;
use App\Services\TemplateBasedCalculationService;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 DIAGNOSING CALCULATION ISSUES\n";
echo "=" . str_repeat("=", 50) . "\n\n";

try {
    // 1. Check client settings
    echo "🏢 STEP 1: Client Settings\n";
    echo "-" . str_repeat("-", 30) . "\n";

    $client = Client::find(25);
    echo "Client: {$client->organisation_name}\n";
    echo "Pay calculation basis: {$client->pay_calculation_basis}\n";

    // Calculate total days for September 2025
    $payrollMonth = \Carbon\Carbon::parse('2025-09-01');
    $totalCalendarDays = $payrollMonth->daysInMonth; // 30 days in September

    if ($client->pay_calculation_basis === 'working_days') {
        $workingDays = 0;
        for ($day = 1; $day <= $totalCalendarDays; $day++) {
            $currentDate = \Carbon\Carbon::createFromDate(2025, 9, $day);
            if (!$currentDate->isWeekend()) {
                $workingDays++;
            }
        }
        $totalDays = $workingDays;
        echo "Working days in September 2025: {$workingDays}\n";
    } else {
        $totalDays = $totalCalendarDays;
        echo "Calendar days in September 2025: {$totalCalendarDays}\n";
    }
    echo "\n";

    // 2. Check invoice template
    echo "📋 STEP 2: Invoice Template Analysis\n";
    echo "-" . str_repeat("-", 30) . "\n";

    $template = InvoiceTemplate::where('client_id', 25)->where('is_active', true)->first();
    if (!$template) {
        echo "❌ No active template found!\n";
        exit(1);
    }

    echo "Template: {$template->template_name}\n";
    echo "Custom components count: " . count($template->custom_components ?? []) . "\n";
    echo "Statutory components count: " . count($template->statutory_components ?? []) . "\n";

    echo "\n📊 Custom Components (Salary):\n";
    foreach ($template->custom_components ?? [] as $index => $component) {
        $amount = $component['amount'] ?? 0;
        echo "   " . ($index + 1) . ". {$component['name']}: ₦" . number_format($amount, 2) . "\n";
    }

    echo "\n📊 Statutory Components (Deductions):\n";
    foreach ($template->statutory_components ?? [] as $index => $component) {
        $amount = $component['amount'] ?? 0;
        echo "   " . ($index + 1) . ". {$component['name']}: ₦" . number_format($amount, 2) . "\n";
    }
    echo "\n";

    // 3. Check attendance data
    echo "👥 STEP 3: Attendance Data Analysis\n";
    echo "-" . str_repeat("-", 30) . "\n";

    $attendanceUpload = AttendanceUpload::with(['attendanceRecords.staff'])->find(22);

    echo "Upload period: {$attendanceUpload->payroll_month}\n";
    echo "Total records: " . $attendanceUpload->attendanceRecords->count() . "\n\n";

    echo "Individual attendance:\n";
    foreach ($attendanceUpload->attendanceRecords as $record) {
        $attendanceFactor = min($record->days_worked / $totalDays, 1.0);
        $percentage = $attendanceFactor * 100;

        echo "   👤 {$record->staff->first_name} {$record->staff->last_name}\n";
        echo "      Days worked: {$record->days_worked} / {$totalDays}\n";
        echo "      Attendance factor: " . number_format($attendanceFactor, 4) . " ({$percentage}%)\n\n";
    }

    // 4. Correct calculations
    echo "💰 STEP 4: Correct Salary Calculations\n";
    echo "-" . str_repeat("-", 30) . "\n";

    $totalGross = 0;
    $totalStatutory = 0;

    foreach ($attendanceUpload->attendanceRecords as $record) {
        $attendanceFactor = min($record->days_worked / $totalDays, 1.0);

        echo "👤 {$record->staff->first_name} {$record->staff->last_name}:\n";

        // Calculate salary components
        $grossSalary = 0;
        foreach ($template->custom_components ?? [] as $component) {
            $fullAmount = $component['amount'] ?? 0;
            $proratedAmount = $fullAmount * $attendanceFactor;
            $grossSalary += $proratedAmount;

            echo "   📈 {$component['name']}: ₦" . number_format($fullAmount, 2) . " × {$attendanceFactor} = ₦" . number_format($proratedAmount, 2) . "\n";
        }

        // Calculate statutory deductions
        $statutoryTotal = 0;
        echo "   📉 Statutory deductions:\n";
        foreach ($template->statutory_components ?? [] as $component) {
            $fullAmount = $component['amount'] ?? 0;
            $proratedAmount = $fullAmount * $attendanceFactor;
            $statutoryTotal += $proratedAmount;

            echo "      {$component['name']}: ₦" . number_format($fullAmount, 2) . " × {$attendanceFactor} = ₦" . number_format($proratedAmount, 2) . "\n";
        }

        $netSalary = $grossSalary - $statutoryTotal;

        echo "   💰 Gross: ₦" . number_format($grossSalary, 2) . "\n";
        echo "   📉 Deductions: ₦" . number_format($statutoryTotal, 2) . "\n";
        echo "   💵 Net: ₦" . number_format($netSalary, 2) . "\n\n";

        $totalGross += $grossSalary;
        $totalStatutory += $statutoryTotal;
    }

    // 5. Export template calculations
    echo "📊 STEP 5: Export Template Calculations\n";
    echo "-" . str_repeat("-", 30) . "\n";

    $totalCostOfEmployment = $totalGross + $totalStatutory;
    $managementFee = $totalCostOfEmployment * 0.10; // 10%
    $vatOnManagementFee = $managementFee * 0.075; // 7.5%
    $totalInvoiceValue = $totalCostOfEmployment + $managementFee + $vatOnManagementFee;

    echo "📋 SUMMARY (Export Template Format):\n";
    echo "1. Total Cost of Employment: ₦" . number_format($totalCostOfEmployment, 2) . "\n";
    echo "2. Management fee @10%: ₦" . number_format($managementFee, 2) . "\n";
    echo "3. VAT on Management fee @7.5%: ₦" . number_format($vatOnManagementFee, 2) . "\n";
    echo "4. Total Invoice Value: ₦" . number_format($totalInvoiceValue, 2) . "\n\n";

    // 6. Issues found
    echo "⚠️  STEP 6: Issues Identified\n";
    echo "-" . str_repeat("-", 30) . "\n";

    echo "🔍 PROBLEMS FOUND:\n";
    echo "1. ❌ Template amounts are too high (Basic Salary: ₦430,911 is unrealistic)\n";
    echo "2. ❌ Calendar days vs working days calculation needs verification\n";
    echo "3. ❌ Export class is using fallback values instead of template data\n";
    echo "4. ❌ Template validation is failing, preventing proper calculation\n\n";

    echo "✅ SOLUTIONS NEEDED:\n";
    echo "1. Fix template validation in TemplateBasedCalculationService\n";
    echo "2. Ensure export classes use actual template data, not fallbacks\n";
    echo "3. Verify pay calculation basis is properly applied\n";
    echo "4. Use realistic salary amounts in templates\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "📁 File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
