<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Client;
use App\Models\InvoiceTemplate;
use App\Models\PayGradeStructure;
use App\Models\JobStructure;
use App\Models\Staff;

echo "=== CHECKING CORRECT TEMPLATE RELATIONSHIP CHAIN ===\n\n";

// Find FIDUCIA client and its employees
$fiducia = Client::where('organisation_name', 'LIKE', '%FIDUCIA%')->first();
if (!$fiducia) {
    echo "❌ FIDUCIA client not found\n";
    exit;
}

echo "🏢 FIDUCIA CLIENT: " . $fiducia->organisation_name . " (ID: " . $fiducia->id . ")\n\n";

// Check FIDUCIA staff and their job structures
echo "👥 FIDUCIA STAFF AND THEIR JOB STRUCTURES:\n";
$staff = Staff::where('client_id', $fiducia->id)->get();
echo "   Total Staff: " . $staff->count() . "\n\n";

foreach ($staff as $employee) {
    echo "Employee: " . $employee->first_name . " " . $employee->last_name . " (ID: " . $employee->id . ")\n";
    echo "   Staff ID: " . ($employee->staff_id ?? 'N/A') . "\n";

    if ($employee->job_structure_id) {
        echo "   Job Structure ID: " . $employee->job_structure_id . "\n";

        // Get job structure
        $jobStructure = JobStructure::find($employee->job_structure_id);
        if ($jobStructure) {
            echo "   Job Title: " . ($jobStructure->job_title ?? 'N/A') . "\n";
            echo "   Pay Grade Structure ID: " . ($jobStructure->pay_grade_structure_id ?? 'N/A') . "\n";

            // Get pay grade structure
            if ($jobStructure->pay_grade_structure_id) {
                $payGrade = PayGradeStructure::find($jobStructure->pay_grade_structure_id);
                if ($payGrade) {
                    echo "   Pay Grade: " . ($payGrade->grade_name ?? 'N/A') . "\n";
                    echo "   Template ID: " . ($payGrade->template_id ?? 'NOT ASSIGNED') . "\n";

                    // Get template
                    if ($payGrade->template_id) {
                        $template = InvoiceTemplate::find($payGrade->template_id);
                        if ($template) {
                            echo "   Template Name: " . $template->template_name . "\n";
                            echo "   Service Fee: " . $template->service_fee_percentage . "%\n";
                        }
                    } else {
                        echo "   ⚠️  NO TEMPLATE ASSIGNED TO PAY GRADE\n";
                    }
                } else {
                    echo "   ❌ Pay Grade Structure not found\n";
                }
            } else {
                echo "   ⚠️  NO PAY GRADE STRUCTURE ASSIGNED\n";
            }
        } else {
            echo "   ❌ Job Structure not found\n";
        }
    } else {
        echo "   ⚠️  NO JOB STRUCTURE ASSIGNED\n";
    }
    echo "   ---\n";
}

// Check all pay grade structures for FIDUCIA
echo "\n📊 ALL PAY GRADE STRUCTURES FOR FIDUCIA:\n";
$payGrades = PayGradeStructure::where('client_id', $fiducia->id)->get();
echo "   Total Pay Grades: " . $payGrades->count() . "\n\n";

foreach ($payGrades as $payGrade) {
    echo "Pay Grade: " . ($payGrade->grade_name ?? 'Unnamed') . " (ID: " . $payGrade->id . ")\n";
    echo "   Template ID: " . ($payGrade->template_id ?? 'NOT ASSIGNED') . "\n";
    echo "   Basic Salary: " . ($payGrade->basic_salary ?? 'N/A') . "\n";
    echo "   Created: " . $payGrade->created_at . "\n";

    if ($payGrade->template_id) {
        $template = InvoiceTemplate::find($payGrade->template_id);
        if ($template) {
            echo "   → Template: " . $template->template_name . " (Service Fee: " . $template->service_fee_percentage . "%)\n";
        }
    }
    echo "   ---\n";
}

// Check Template 17 assignment
echo "\n📋 TEMPLATE 17 (FIDUCIA) ASSIGNMENTS:\n";
$template17 = InvoiceTemplate::find(17);
if ($template17) {
    echo "Template: " . $template17->template_name . " (ID: " . $template17->id . ")\n";
    echo "Service Fee: " . $template17->service_fee_percentage . "%\n";

    // Find pay grades using this template
    $assignedPayGrades = PayGradeStructure::where('template_id', 17)->get();
    echo "Pay Grades using this template: " . $assignedPayGrades->count() . "\n";

    foreach ($assignedPayGrades as $pg) {
        echo "   - " . ($pg->grade_name ?? 'Unnamed') . " (Client: ";
        $client = Client::find($pg->client_id);
        echo ($client ? $client->organisation_name : 'Unknown') . ")\n";
    }
}
