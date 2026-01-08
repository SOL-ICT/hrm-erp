<?php

/**
 * Clear all pending staff boarding approvals
 * This script removes pending staff boarding approvals and resets staff status
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Approval;
use App\Models\Staff;

try {
    DB::beginTransaction();
    
    echo "Starting cleanup of pending staff boarding approvals...\n\n";
    
    // Get all pending staff boarding approvals
    $pendingApprovals = Approval::where('approvable_type', 'App\\Models\\Staff')
        ->where('status', 'pending')
        ->get();
    
    $approvalCount = $pendingApprovals->count();
    echo "Found {$approvalCount} pending staff boarding approvals\n";
    
    if ($approvalCount > 0) {
        $staffIds = [];
        
        // Collect approval IDs and staff IDs
        foreach ($pendingApprovals as $approval) {
            $staffIds[] = $approval->approvable_id;
            
            // Delete approval history
            DB::table('approval_history')
                ->where('approval_id', $approval->id)
                ->delete();
        }
        
        echo "Deleted approval history for {$approvalCount} approvals\n";
        
        // Delete approvals
        Approval::where('approvable_type', 'App\\Models\\Staff')
            ->where('status', 'pending')
            ->delete();
        
        echo "Deleted {$approvalCount} pending approvals\n";
        
        // Reset staff boarding status for affected staff
        if (!empty($staffIds)) {
            $updatedStaff = Staff::whereIn('id', $staffIds)
                ->whereIn('boarding_approval_status', [
                    'pending_supervisor_approval',
                    'pending_control_approval',
                    'supervisor_approved'
                ])
                ->update(['boarding_approval_status' => 'draft']);
            
            echo "Reset boarding status for {$updatedStaff} staff records to 'draft'\n";
        }
    } else {
        echo "No pending staff boarding approvals found\n";
    }
    
    DB::commit();
    
    echo "\n✅ Cleanup completed successfully!\n";
    echo "\nSummary:\n";
    echo "- Approvals deleted: {$approvalCount}\n";
    echo "- Staff records reset: " . (isset($updatedStaff) ? $updatedStaff : 0) . "\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}
