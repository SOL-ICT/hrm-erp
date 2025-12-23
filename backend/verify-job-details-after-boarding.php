<?php
/**
 * Verify Job Details After Boarding
 * 
 * Verifies that staff records have complete job details after boarding
 * Usage: docker exec hrm-laravel-api php verify-job-details-after-boarding.php [staff_id]
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$staffId = $argv[1] ?? null;

try {
    echo "========================================\n";
    echo "Job Details Verification Report\n";
    echo "========================================\n\n";

    $query = "
        SELECT 
            s.id,
            s.staff_id,
            s.employee_code,
            CONCAT(s.first_name, ' ', s.last_name) as name,
            s.job_title,
            s.job_structure_id,
            js.job_title as job_structure_title,
            s.service_location_id,
            sl.location_name as service_location,
            s.sol_office_id,
            so.office_name as sol_office,
            s.pay_grade_structure_id,
            pgs.grade_name as pay_grade,
            s.recruitment_request_id,
            rr.ticket_id as recruitment_ticket,
            s.boarding_method,
            s.date_of_join,
            spi.mobile_phone,
            spi.date_of_birth,
            s.created_at
        FROM staff s
        LEFT JOIN job_structures js ON s.job_structure_id = js.id
        LEFT JOIN service_locations sl ON s.service_location_id = sl.id
        LEFT JOIN sol_offices so ON s.sol_office_id = so.id
        LEFT JOIN pay_grade_structures pgs ON s.pay_grade_structure_id = pgs.id
        LEFT JOIN recruitment_requests rr ON s.recruitment_request_id = rr.id
        LEFT JOIN staff_personal_info spi ON s.id = spi.staff_id
    ";

    if ($staffId) {
        $query .= " WHERE s.id = ? OR s.staff_id = ? OR s.employee_code = ?";
        $results = DB::select($query, [$staffId, $staffId, $staffId]);
    } else {
        $query .= " ORDER BY s.created_at DESC LIMIT 10";
        $results = DB::select($query);
        echo "Showing last 10 staff records. Use: php verify-job-details-after-boarding.php [staff_id] for specific staff\n\n";
    }

    if (empty($results)) {
        echo "No staff records found.\n";
        exit(0);
    }

    foreach ($results as $staff) {
        echo "Staff: {$staff->name} (ID: {$staff->id})\n";
        echo str_repeat('-', 60) . "\n";
        
        // Basic Info
        echo "Staff ID: " . ($staff->staff_id ?? '❌ MISSING') . "\n";
        echo "Employee Code: " . ($staff->employee_code ?? '❌ MISSING') . "\n";
        echo "Boarding Method: " . ($staff->boarding_method ?? '❌ MISSING') . "\n";
        echo "Date of Join: " . ($staff->date_of_join ?? '❌ MISSING') . "\n";
        echo "Created: " . $staff->created_at . "\n\n";

        // Job Details
        echo "JOB DETAILS:\n";
        $jobDetailsComplete = true;
        
        if ($staff->job_structure_id) {
            echo "  ✓ Job Structure: {$staff->job_structure_title} (ID: {$staff->job_structure_id})\n";
        } else {
            echo "  ❌ Job Structure: MISSING\n";
            $jobDetailsComplete = false;
        }
        
        if ($staff->service_location_id) {
            echo "  ✓ Service Location: {$staff->service_location} (ID: {$staff->service_location_id})\n";
        } else {
            echo "  ❌ Service Location: MISSING\n";
            $jobDetailsComplete = false;
        }
        
        if ($staff->sol_office_id) {
            echo "  ✓ SOL Office: {$staff->sol_office} (ID: {$staff->sol_office_id})\n";
        } else {
            echo "  ❌ SOL Office: MISSING\n";
            $jobDetailsComplete = false;
        }
        
        if ($staff->pay_grade_structure_id) {
            echo "  ✓ Pay Grade: {$staff->pay_grade} (ID: {$staff->pay_grade_structure_id})\n";
        } else {
            echo "  ❌ Pay Grade: MISSING\n";
            $jobDetailsComplete = false;
        }
        
        if ($staff->recruitment_request_id) {
            echo "  ✓ Recruitment Ticket: {$staff->recruitment_ticket} (ID: {$staff->recruitment_request_id})\n";
        } else {
            echo "  ⚠ Recruitment Ticket: Not linked (OK for manual/bulk uploads)\n";
        }

        // Personal Info
        echo "\nPERSONAL INFO:\n";
        if ($staff->mobile_phone) {
            echo "  ✓ Phone: {$staff->mobile_phone}\n";
        } else {
            echo "  ⚠ Phone: Not set\n";
        }
        
        if ($staff->date_of_birth) {
            echo "  ✓ Date of Birth: {$staff->date_of_birth}\n";
        } else {
            echo "  ⚠ Date of Birth: Not set\n";
        }

        // Overall Status
        echo "\n";
        if ($jobDetailsComplete) {
            echo "STATUS: ✓ All job details complete!\n";
        } else {
            echo "STATUS: ❌ Some job details missing - needs fixing\n";
        }
        
        echo "\n" . str_repeat('=', 60) . "\n\n";
    }

    // Summary
    $totalStaff = count($results);
    $completeCount = 0;
    
    foreach ($results as $staff) {
        if ($staff->job_structure_id && $staff->service_location_id && 
            $staff->sol_office_id && $staff->pay_grade_structure_id) {
            $completeCount++;
        }
    }
    
    $incompleteCount = $totalStaff - $completeCount;
    
    echo "SUMMARY:\n";
    echo "  Total Staff: {$totalStaff}\n";
    echo "  Complete Job Details: {$completeCount}\n";
    echo "  Incomplete Job Details: {$incompleteCount}\n";
    
    if ($incompleteCount == 0) {
        echo "\n✓ All staff have complete job details!\n";
        exit(0);
    } else {
        echo "\n⚠ {$incompleteCount} staff with incomplete job details\n";
        exit(1);
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
