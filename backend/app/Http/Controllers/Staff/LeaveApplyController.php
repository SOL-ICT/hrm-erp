<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LeaveApplyController extends Controller
{
    // Apply for leave
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'leave_type_id' => 'required|integer',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'days' => 'required|integer|min:1',
                'reason' => 'required|string',
            ]);

            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Insert into database using Query Builder
            $leaveId = DB::table('leave_applications')->insertGetId([
                'staff_id' => Auth::id(),
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'days' => $validated['days'],
                'reason' => $validated['reason'],
                'status' => 'pending',
                'applied_at' => now(),
                'updated_at' => now(),
            ]);

            // Get the created leave application with leave type name
            $leave = DB::table('leave_applications')
                ->leftJoin('leave_types', 'leave_applications.leave_type_id', '=', 'leave_types.id')
                ->select(
                    'leave_applications.*',
                    'leave_types.name as leave_type_name'
                )
                ->where('leave_applications.id', $leaveId)
                ->first();

            return response()->json([
                'message' => 'Leave application submitted.',
                'data' => $leave
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating leave application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // View staff leave history
    public function index()
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Get leave applications with leave type names using Query Builder
            $leaveHistory = DB::table('leave_applications')
                ->leftJoin('leave_types', 'leave_applications.leave_type_id', '=', 'leave_types.id')
                ->select(
                    'leave_applications.id',
                    'leave_applications.leave_type_id',
                    'leave_types.name as leave_type_name',
                    'leave_applications.start_date',
                    'leave_applications.end_date',
                    'leave_applications.days',
                    'leave_applications.reason',
                    'leave_applications.status',
                    'leave_applications.applied_at'
                )
                ->where('leave_applications.staff_id', Auth::id())
                ->orderByDesc('leave_applications.applied_at')
                ->get();

            return response()->json($leaveHistory);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching leave applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //for delting leave application
    public function destroy($id)
{
    try {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Find the leave and ensure it belongs to the user
        $leave = DB::table('leave_applications')
            ->where('id', $id)
            ->where('staff_id', Auth::id())
            ->first();

        if (!$leave) {
            return response()->json(['message' => 'Leave application not found'], 404);
        }

        if ($leave->status !== 'pending') {
            return response()->json(['message' => 'Only pending leaves can be deleted'], 403);
        }

        DB::table('leave_applications')
            ->where('id', $id)
            ->delete();

        return response()->json(['message' => 'Leave application deleted successfully.']);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error deleting leave application',
            'error' => $e->getMessage()
        ], 500);
    }
}


// Get staff available for leave handover
// Get staff available for leave handover
public function handoverList()
{
    try {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Get current staff ID (primary key) - same as other methods
        $currentStaffId = Auth::id(); // This returns 8
        
        // Get current staff record to find client_id
        $currentStaff = DB::table('staff')
            ->where('id', $currentStaffId)
            ->first();
        
        if (!$currentStaff) {
            return response()->json(['message' => 'Staff record not found'], 404);
        }
        
        $clientId = $currentStaff->client_id;
        
        // Fetch staff with same client, excluding the current user (by primary key id, not staff_id)
        $handoverStaff = DB::table('staff')
            ->select(
                'staff_id as id',  // Return staff_id for frontend compatibility
                'first_name',
                'last_name',
                'job_title',
                'email'
            )
            ->where('client_id', $clientId)
            ->where('id', '<>', $currentStaffId) // Use primary key 'id', not 'staff_id'
            ->orderBy('first_name')
            ->get();

        return response()->json($handoverStaff);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error fetching handover staff list',
            'error' => $e->getMessage()
        ], 500);
    }
}

}

