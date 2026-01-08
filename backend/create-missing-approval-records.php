<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Approval;
use App\Models\Staff;
use App\Models\User;
use Carbon\Carbon;

/**
 * Create missing Approval records for staff in pending_control_approval status
 * This integrates staff boarding with the centralized Approval Center
 */

try {
    // Get all staff in pending_control_approval status without approval records
    $pendingStaff = DB::table('staff')
        ->leftJoin('approvals', function($join) {
            $join->on('staff.id', '=', 'approvals.approvable_id')
                 ->where('approvals.approvable_type', '=', 'App\\Models\\Staff');
        })
        ->where('staff.boarding_approval_status', 'pending_control_approval')
        ->whereNull('approvals.id')
        ->select('staff.id', 'staff.staff_id', 'staff.onboarded_by')
        ->get();

    if ($pendingStaff->isEmpty()) {
        echo "No staff found that need approval records.\n";
        exit(0);
    }

    echo "Found " . $pendingStaff->count() . " staff that need approval records created.\n";

    // Get Control users (who should be the approvers)
    $controlUsers = DB::table('users')
        ->join('staff', 'users.staff_profile_id', '=', 'staff.id')
        ->join('staff_roles', 'staff.id', '=', 'staff_roles.staff_id')
        ->where('staff_roles.role_id', 6) // Control role
        ->select('users.id', 'users.name')
        ->get();

    if ($controlUsers->isEmpty()) {
        echo "No Control users found. Cannot create approval records.\n";
        exit(1);
    }

    echo "Control approvers: " . $controlUsers->pluck('name')->implode(', ') . "\n";

    $created = 0;
    foreach ($pendingStaff as $staff) {
        // Create approval record for each staff
        $approvalData = [
            'approvable_type' => 'App\\Models\\Staff',
            'approvable_id' => $staff->id,
            'workflow_id' => 1, // Assuming workflow ID 1 for staff boarding
            'current_level' => 2, // Level 2 for Control approval
            'total_approval_levels' => 2,
            'status' => 'pending',
            'priority' => 'medium',
            'requested_by' => $staff->onboarded_by,
            'requested_at' => Carbon::now(),
            'current_approver_id' => $controlUsers->first()->id, // Assign to first Control user
            'due_date' => Carbon::now()->addDays(3),
            'module_name' => 'recruitment',
            'approval_type' => 'staff_boarding_control',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];

        DB::table('approvals')->insert($approvalData);
        
        echo "✓ Created approval record for staff {$staff->staff_id} (ID: {$staff->id})\n";
        $created++;
    }

    echo "\n✅ Successfully created {$created} approval records.\n";
    echo "These staff will now appear in the Approval Center for Control users to approve/reject.\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}