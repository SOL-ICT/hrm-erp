<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Approval;
use App\Models\ApprovalWorkflow;
use App\Models\Staff;
use Illuminate\Support\Facades\DB;

echo "Creating dummy approvals for testing...\n\n";

DB::beginTransaction();

try {
    // Get or create a workflow
    $workflow = ApprovalWorkflow::where('workflow_code', 'staff_boarding_2level')->first();
    
    if (!$workflow) {
        $workflow = ApprovalWorkflow::create([
            'workflow_name' => 'Staff Boarding - 2 Level',
            'workflow_code' => 'staff_boarding_2level',
            'workflow_type' => 'sequential',
            'total_levels' => 2,
            'module_name' => 'recruitment',
            'is_active' => true,
        ]);
        echo "Created workflow: {$workflow->workflow_name}\n";
    }
    
    // Get some existing staff IDs
    $staffIds = Staff::limit(50)->pluck('id')->toArray();
    
    if (empty($staffIds)) {
        echo "No staff records found. Please create staff first.\n";
        DB::rollBack();
        exit;
    }
    
    echo "Found " . count($staffIds) . " staff records\n";
    echo "Creating 50 dummy approvals...\n\n";
    
    $priorities = ['low', 'medium', 'high', 'urgent'];
    $levels = [1, 2];
    $users = [2, 192, 193]; // Control, User 192, User 193
    
    for ($i = 0; $i < 50; $i++) {
        $staffId = $staffIds[array_rand($staffIds)];
        $level = $levels[array_rand($levels)];
        $priority = $priorities[array_rand($priorities)];
        $requestedBy = $users[array_rand($users)];
        
        $approval = Approval::create([
            'approvable_type' => 'App\\Models\\Staff',
            'approvable_id' => $staffId,
            'workflow_id' => $workflow->id,
            'approval_type' => 'staff_boarding',
            'module_name' => 'recruitment',
            'status' => 'pending',
            'current_approval_level' => $level,
            'total_approval_levels' => 2,
            'current_approver_id' => null, // Role-based
            'requested_by' => $requestedBy,
            'requested_at' => now()->subDays(rand(0, 30)),
            'priority' => $priority,
            'is_overdue' => rand(0, 1) ? true : false,
            'metadata' => json_encode([
                'test_approval' => true,
                'generated_at' => now()->toDateTimeString(),
            ]),
        ]);
        
        echo "Created approval #{$approval->id} - Level {$level}, Priority: {$priority}\n";
    }
    
    DB::commit();
    
    echo "\n✓ Successfully created 50 dummy approvals!\n";
    echo "\nSummary:\n";
    echo "- Level 1 approvals: " . Approval::where('current_approval_level', 1)->where('status', 'pending')->count() . "\n";
    echo "- Level 2 approvals: " . Approval::where('current_approval_level', 2)->where('status', 'pending')->count() . "\n";
    echo "- Total pending: " . Approval::where('status', 'pending')->count() . "\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
