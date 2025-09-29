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
                'leave_type_id' => 'required|integer|exists:leave_types,id',
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

    // Delete a pending leave application
    public function destroy($id)
    {
        try {
            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Find the leave application
            $leave = DB::table('leave_applications')
                ->where('id', $id)
                ->where('staff_id', Auth::id())
                ->where('status', 'pending')
                ->first();

            if (!$leave) {
                return response()->json(['message' => 'Leave application not found or not eligible for deletion'], 404);
            }

            // Delete the leave application
            DB::table('leave_applications')->where('id', $id)->delete();

            return response()->json(['message' => 'Leave application deleted successfully'], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting leave application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Submit a report issue
    public function reportIssue(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'subject' => 'required|string|max:500',
            ]);

            // Check if user is authenticated
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Insert report into database
            $reportId = DB::table('reports')->insertGetId([
                'staff_id' => Auth::id(),
                'email' => $validated['email'],
                'subject' => $validated['subject'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'message' => 'Report submitted successfully',
                'data' => [
                    'id' => $reportId,
                    'email' => $validated['email'],
                    'subject' => $validated['subject'],
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error submitting report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}