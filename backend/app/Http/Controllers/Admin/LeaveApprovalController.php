<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\LeaveApprovedMail;
use App\Mail\LeaveRejectedMail;
use App\Services\LeaveAdvicePDFService;
use Carbon\Carbon;

class LeaveApprovalController extends Controller
{
    /**
     * Get all leave applications with filters
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('leave_applications as la')
                ->leftJoin('staff as s', 'la.staff_id', '=', 's.id')
                ->leftJoin('staff_personal_info as spi', 's.id', '=', 'spi.staff_id')
                ->leftJoin('leave_types as lt', 'la.leave_type_id', '=', 'lt.id')
                ->leftJoin('clients as c', 's.client_id', '=', 'c.id')
                ->leftJoin('staff_categories as sc', 's.category_id', '=', 'sc.id')
                ->leftJoin('users as u', 'la.approved_by_admin_id', '=', 'u.id')
                ->leftJoin('staff as handover_staff', 'la.handover_staff_id', '=', 'handover_staff.id')
            ->select(
                'la.id',
                'la.staff_id',
                's.staff_id as staff_number',
                DB::raw("CONCAT(s.first_name, ' ', s.middle_name, ' ', s.last_name) as staff_name"),
                's.email as staff_email',
                'spi.mobile_phone as phone_number',
                'spi.current_address as address',
                'c.id as client_id',
                'c.organisation_name as client_name',
                'sc.name as category_name',
                'lt.name as leave_type',
                'la.leave_type_id',
                'la.start_date',
                'la.end_date',
                'la.days',
                'la.reason',
                'la.status',
                'la.applied_at',
                'la.approver_id',
                'la.comments',
                'la.updated_at',
                'la.approval_token',
                'la.approved_at',
                'la.approval_method',
                'la.approved_by_admin_id',
                'la.approval_ip_address',
                'la.approval_user_agent',
                'la.supervisor_email_sent',
                'la.approver_comments',
                'u.name as admin_approval_name',
                DB::raw("CONCAT(handover_staff.first_name, ' ', handover_staff.last_name) as handover_staff_name")
            );            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('la.status', $request->status);
            }

            // Filter by client
            if ($request->has('client_id') && $request->client_id) {
                $query->where('c.id', $request->client_id);
            }

            // Filter by leave type
            if ($request->has('leave_type_id') && $request->leave_type_id) {
                $query->where('la.leave_type_id', $request->leave_type_id);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->start_date) {
                $query->where('la.start_date', '>=', $request->start_date);
            }

            if ($request->has('end_date') && $request->end_date) {
                $query->where('la.end_date', '<=', $request->end_date);
            }

            // Search by staff name
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('s.first_name', 'LIKE', "%{$search}%")
                        ->orWhere('s.last_name', 'LIKE', "%{$search}%")
                        ->orWhere('s.staff_id', 'LIKE', "%{$search}%");
                });
            }

            // Order by applied_at descending
            $leaves = $query->orderByDesc('la.applied_at')->get();

            return response()->json($leaves);

        } catch (\Exception $e) {
            Log::error('Error fetching leave applications: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching leave applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get leave statistics
     */
    public function statistics(Request $request)
    {
        try {
            $currentYear = Carbon::now()->year;

            // Get counts by status
            $stats = [
                'total' => DB::table('leave_applications')
                    ->whereYear('applied_at', $currentYear)
                    ->count(),
                'pending' => DB::table('leave_applications')
                    ->where('status', 'pending')
                    ->whereYear('applied_at', $currentYear)
                    ->count(),
                'approved' => DB::table('leave_applications')
                    ->where('status', 'approved')
                    ->whereYear('applied_at', $currentYear)
                    ->count(),
                'rejected' => DB::table('leave_applications')
                    ->where('status', 'rejected')
                    ->whereYear('applied_at', $currentYear)
                    ->count(),
                'total_days' => DB::table('leave_applications')
                    ->where('status', 'approved')
                    ->whereYear('applied_at', $currentYear)
                    ->sum('days'),
            ];

            // Get leave breakdown by type
            $byType = DB::table('leave_applications as la')
                ->join('leave_types as lt', 'la.leave_type_id', '=', 'lt.id')
                ->where('la.status', 'approved')
                ->whereYear('la.applied_at', $currentYear)
                ->select(
                    'lt.name as leave_type',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(la.days) as total_days')
                )
                ->groupBy('lt.name')
                ->get();

            // Get leave breakdown by client
            $byClient = DB::table('leave_applications as la')
                ->join('staff as s', 'la.staff_id', '=', 's.id')
                ->join('clients as c', 's.client_id', '=', 'c.id')
                ->where('la.status', 'approved')
                ->whereYear('la.applied_at', $currentYear)
                ->select(
                    'c.organisation_name as client_name',
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(la.days) as total_days')
                )
                ->groupBy('c.organisation_name')
                ->get();

            return response()->json([
                'summary' => $stats,
                'by_type' => $byType,
                'by_client' => $byClient
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching leave statistics: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve leave application
     */
    public function approve(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'resumption_date' => 'nullable|date',
                'notes' => 'nullable|string'
            ]);

            // Get leave application with staff details
            $leave = DB::table('leave_applications as la')
                ->join('staff as s', 'la.staff_id', '=', 's.id')
                ->join('leave_types as lt', 'la.leave_type_id', '=', 'lt.id')
                ->leftJoin('clients as c', 's.client_id', '=', 'c.id')
                ->where('la.id', $id)
                ->select(
                    'la.*',
                    's.staff_id as staff_number',
                    DB::raw("CONCAT(s.first_name, ' ', s.middle_name, ' ', s.last_name) as staff_name"),
                    's.first_name',
                    's.middle_name',
                    's.last_name',
                    's.email as staff_email',
                    'lt.name as leave_type',
                    'c.organisation_name as client_name'
                )
                ->first();

            if (!$leave) {
                return response()->json(['message' => 'Leave application not found'], 404);
            }

            if ($leave->status !== 'pending') {
                return response()->json(['message' => 'Leave application already processed'], 400);
            }

            // Get user agent and IP for tracking
            $userAgent = $request->header('User-Agent');
            $ipAddress = $request->ip();

            // Update leave status with approval tracking
            DB::table('leave_applications')
                ->where('id', $id)
                ->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approver_id' => Auth::id(),
                    'approver_comments' => $validated['notes'] ?? null,
                    'approval_method' => 'admin_dashboard',
                    'approved_by_admin_id' => Auth::id(),
                    'approval_ip_address' => $ipAddress,
                    'approval_user_agent' => $userAgent,
                    'updated_at' => now()
                ]);

            // Send approval email to staff
            try {
                $staff = DB::table('staff')->where('id', $leave->staff_id)->first();
                $admin = Auth::user();
                
                \Log::info('Starting admin approval notification email', [
                    'staff_email' => $staff->email,
                    'staff_name' => $staff->first_name . ' ' . $staff->last_name,
                    'admin_id' => $admin->id,
                    'admin_name' => $admin->name,
                    'leave_id' => $id,
                ]);
                
                Mail::to($staff->email)->send(
                    new LeaveApprovedMail($staff, $leave, $admin->name)
                );
                
                \Log::info('✓ Leave APPROVED admin notification email sent to ' . $staff->email);
            } catch (\Exception $e) {
                \Log::error('✗ FAILED to send leave approval email', [
                    'staff_email' => $staff->email ?? 'unknown',
                    'error_message' => $e->getMessage(),
                    'error_code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            // Generate Leave Advice PDF and send email
            try {
                LeaveAdvicePDFService::generateAndEmail($leave, $validated['resumption_date'] ?? null);
            } catch (\Exception $e) {
                Log::error('Failed to generate/send leave advice: ' . $e->getMessage());
                // Continue even if PDF fails - leave is still approved
            }

            return response()->json([
                'message' => 'Leave application approved successfully',
                'leave_id' => $id
            ]);

        } catch (\Exception $e) {
            Log::error('Error approving leave: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error approving leave',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject leave application
     */
    public function reject(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|min:10'
            ]);

            // Check if leave exists and is pending
            $leave = DB::table('leave_applications')
                ->where('id', $id)
                ->first();

            if (!$leave) {
                return response()->json(['message' => 'Leave application not found'], 404);
            }

            if ($leave->status !== 'pending') {
                return response()->json(['message' => 'Leave application already processed'], 400);
            }

            // Get user agent and IP for tracking
            $userAgent = $request->header('User-Agent');
            $ipAddress = $request->ip();

            // Update leave status with rejection tracking
            DB::table('leave_applications')
                ->where('id', $id)
                ->update([
                    'status' => 'rejected',
                    'approver_comments' => $validated['reason'],
                    'approver_id' => Auth::id(),
                    'approved_at' => now(),
                    'approval_method' => 'admin_dashboard',
                    'approved_by_admin_id' => Auth::id(),
                    'approval_ip_address' => $ipAddress,
                    'approval_user_agent' => $userAgent,
                    'updated_at' => now()
                ]);

            // Send rejection email to staff
            try {
                $staff = DB::table('staff')->where('id', $leave->staff_id)->first();
                $admin = Auth::user();
                
                Mail::to($staff->email)->send(
                    new LeaveRejectedMail($staff, $leave, $admin->name, $validated['reason'])
                );
                
                Log::info('Leave rejection email sent to ' . $staff->email);
            } catch (\Exception $e) {
                Log::error('Failed to send leave rejection email: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Leave application rejected',
                'leave_id' => $id
            ]);

        } catch (\Exception $e) {
            Log::error('Error rejecting leave: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error rejecting leave',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all clients for filter dropdown
     */
    public function getClients()
    {
        try {
            $clients = DB::table('clients')
                ->select('id', 'organisation_name as name')
                ->where('status', 'active')
                ->orderBy('organisation_name')
                ->get();

            return response()->json($clients);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all leave types for filter dropdown
     */
    public function getLeaveTypes()
    {
        try {
            $types = DB::table('leave_types')
                ->select('id', 'name')
                ->orderBy('name')
                ->get();

            return response()->json($types);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching leave types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export leave report (placeholder)
     */
    public function exportReport(Request $request)
    {
        try {
            // TODO: Implement Excel/PDF export
            return response()->json([
                'message' => 'Export functionality coming soon'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error exporting report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
