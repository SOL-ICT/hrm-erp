<?php

namespace App\Http\Controllers;

use App\Models\LeaveEngine\LeaveApplication;
use App\Models\Staff;
use App\Mail\LeaveApprovedMail;
use App\Mail\LeaveRejectedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class LeaveApprovalController extends Controller
{
    /**
     * View leave application details using approval token (public)
     */
    public function show($token)
    {
        try {
            $leaveApplication = LeaveApplication::where('approval_token', $token)
                ->with(['staff', 'leaveType', 'supervisor', 'handoverStaff'])
                ->first();

            if (!$leaveApplication) {
                return response()->json([
                    'message' => 'Invalid approval link'
                ], 404);
            }

            // Check if token has expired
            if ($leaveApplication->approval_token_expires_at < now()) {
                return response()->json([
                    'message' => 'This approval link has expired',
                    'expired_at' => $leaveApplication->approval_token_expires_at
                ], 410);
            }

            // Check if already processed
            if ($leaveApplication->status !== 'pending') {
                return response()->json([
                    'message' => 'This leave application has already been processed',
                    'status' => $leaveApplication->status,
                    'approved_at' => $leaveApplication->approved_at
                ], 409);
            }

            // Return leave application details
            return response()->json([
                'message' => 'Leave application details',
                'data' => [
                    'application_id' => $leaveApplication->id,
                    'staff' => [
                        'name' => $leaveApplication->staff->first_name . ' ' . $leaveApplication->staff->last_name,
                        'email' => $leaveApplication->staff->email,
                        'phone' => $leaveApplication->staff->phone_no,
                    ],
                    'leave_type' => $leaveApplication->leaveType->name ?? 'Unknown',
                    'start_date' => $leaveApplication->start_date->format('d M Y'),
                    'end_date' => $leaveApplication->end_date->format('d M Y'),
                    'days' => $leaveApplication->days,
                    'reason' => $leaveApplication->reason,
                    'public_holidays' => $leaveApplication->public_holidays,
                    'handover_staff' => $leaveApplication->handoverStaff ? [
                        'name' => $leaveApplication->handoverStaff->first_name . ' ' . $leaveApplication->handoverStaff->last_name,
                        'email' => $leaveApplication->handoverStaff->email,
                    ] : null,
                    'applied_at' => $leaveApplication->applied_at->format('d M Y'),
                    'token_expires_at' => $leaveApplication->approval_token_expires_at->format('d M Y H:i'),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error retrieving leave application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process approval/rejection decision (public)
     */
    public function processDecision(Request $request, $token)
    {
        try {
            $validated = $request->validate([
                'decision' => 'required|in:approved,rejected',
                'comments' => 'nullable|string|max:1000',
            ]);

            $leaveApplication = LeaveApplication::where('approval_token', $token)
                ->with(['staff', 'leaveType', 'supervisor'])
                ->first();

            if (!$leaveApplication) {
                return response()->json([
                    'message' => 'Invalid approval link'
                ], 404);
            }

            // Check if token has expired
            if ($leaveApplication->approval_token_expires_at < now()) {
                return response()->json([
                    'message' => 'This approval link has expired',
                    'expired_at' => $leaveApplication->approval_token_expires_at
                ], 410);
            }

            // Check if already processed
            if ($leaveApplication->status !== 'pending') {
                return response()->json([
                    'message' => 'This leave application has already been processed',
                    'status' => $leaveApplication->status
                ], 409);
            }

            // Capture approval tracking data
            $userAgent = $request->header('User-Agent');
            $ipAddress = $request->ip();

            // Update leave application
            $leaveApplication->update([
                'status' => $validated['decision'],
                'approver_comments' => $validated['comments'] ?? null,
                'approved_at' => now(),
                'approval_method' => 'email_link',  // Track that this was approved via email
                'approval_ip_address' => $ipAddress,
                'approval_user_agent' => $userAgent,
                // Invalidate the token after use
                'approval_token' => null,
            ]);

            // Send notification email to staff
            $this->sendStaffNotificationEmail($leaveApplication, $validated['decision'], $validated['comments'] ?? null);

            return response()->json([
                'message' => 'Leave application ' . $validated['decision'] . ' successfully',
                'data' => [
                    'application_id' => $leaveApplication->id,
                    'status' => $leaveApplication->status,
                    'processed_at' => $leaveApplication->approved_at,
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing approval decision',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification email to staff about decision
     */
    private function sendStaffNotificationEmail($leaveApplication, $decision, $comments)
    {
        try {
            $staff = $leaveApplication->staff;
            
            \Log::info('Starting staff decision notification email', [
                'staff_email' => $staff->email,
                'staff_name' => $staff->first_name . ' ' . $staff->last_name,
                'decision' => $decision,
                'leave_id' => $leaveApplication->id,
            ]);
            
            if ($decision === 'approved') {
                // Get supervisor name to show who approved
                $supervisorName = $leaveApplication->supervisor->supervisor_name ?? 'Supervisor';
                
                Mail::to($staff->email)->send(
                    new LeaveApprovedMail($staff, $leaveApplication, $supervisorName)
                );
                \Log::info('✓ Leave APPROVED notification email sent to ' . $staff->email);
            } elseif ($decision === 'rejected') {
                // Get supervisor name to show who rejected
                $supervisorName = $leaveApplication->supervisor->supervisor_name ?? 'Supervisor';
                
                Mail::to($staff->email)->send(
                    new LeaveRejectedMail($staff, $leaveApplication, $supervisorName, $comments)
                );
                \Log::info('✓ Leave REJECTED notification email sent to ' . $staff->email);
            }
            
        } catch (\Exception $e) {
            \Log::error('✗ FAILED to send leave decision notification email', [
                'staff_email' => $staff->email ?? 'unknown',
                'decision' => $decision,
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
