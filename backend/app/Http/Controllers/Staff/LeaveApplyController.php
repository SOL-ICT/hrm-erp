<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\LeaveEngine\LeaveApplication;
use App\Models\LeaveEngine\LeaveBalance;
use App\Models\LeaveEngine\StaffSupervisor;
use App\Models\Staff;
use App\Models\LpeLeaveType;
use App\Models\LpeLeaveEntitlement;
use App\Mail\LeaveApplicationSubmittedMail;
use App\Mail\LeaveApprovalRequestMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class LeaveApplyController extends Controller
{
    /**
     * Get the correct staff ID from the authenticated user
     * Uses staff_profile_id if available (newer implementation), otherwise falls back to user.id
     */
    private function getAuthenticatedStaffId()
    {
        $user = Auth::user();
        return $user->staff_profile_id ?? $user->id;
    }

    /**
     * Apply for leave - with validation against entitlements and balance tracking
     */
    public function store(Request $request)
    {
        try {
            // Authenticate user
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $this->getAuthenticatedStaffId();
            $staff = Staff::findOrFail($staffId);

            $validated = $request->validate([
                'leave_type_id' => 'required|exists:lpe_leave_types,id',
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string|max:1000',
                'public_holidays' => 'nullable|integer|min:0',
                'handover_staff_id' => 'nullable|exists:staff,id',
                'supervisor_name' => 'required|string|max:255',
                'supervisor_email' => 'required|email|max:255',
                'supervisor_phone' => 'required|string|max:20',
            ]);

            // Calculate leave days
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);
            $interval = $startDate->diff($endDate);
            $days = $interval->days + 1; // inclusive of end date

            // 1. CHECK ENTITLEMENTS - verify staff's job structure has this leave type entitlement
            $entitlement = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->first();

            if (!$entitlement) {
                return response()->json([
                    'message' => 'Leave type not entitled for your position',
                    'leave_type_id' => $validated['leave_type_id'],
                    'job_structure_id' => $staff->job_structure_id
                ], 403);
            }

            // 2. CHECK BALANCE - verify staff has enough leave balance
            $usedDays = LeaveApplication::where('staff_id', $staffId)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->whereYear('start_date', now()->year)
                ->where('status', '!=', 'rejected')
                ->sum('days');

            $usedDays = $usedDays ?? 0;
            $availableBalance = $entitlement->entitled_days - $usedDays;

            if ($availableBalance < $days) {
                return response()->json([
                    'message' => 'Insufficient leave balance',
                    'requested_days' => $days,
                    'available_balance' => $availableBalance,
                    'leave_type_id' => $validated['leave_type_id']
                ], 422);
            }

            // 3. SAVE/UPDATE SUPERVISOR INFORMATION
            // Deactivate previous supervisors and create/update current one
            StaffSupervisor::where('staff_id', $staffId)->update(['is_active' => false]);
            
            $supervisor = StaffSupervisor::create([
                'staff_id' => $staffId,
                'supervisor_name' => $validated['supervisor_name'],
                'supervisor_email' => $validated['supervisor_email'],
                'supervisor_phone' => $validated['supervisor_phone'],
                'is_active' => true,
            ]);

            // 4. GENERATE APPROVAL TOKEN
            $approvalToken = Str::random(64);
            $tokenExpiry = now()->addDays(7); // Token valid for 7 days

            // 5. CREATE LEAVE APPLICATION
            $leaveApplication = LeaveApplication::create([
                'staff_id' => $staffId,
                'client_id' => $staff->client_id,
                'job_structure_id' => $staff->job_structure_id,
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'days' => $days,
                'reason' => $validated['reason'],
                'status' => 'pending',
                'applied_at' => now(),
                'public_holidays' => $validated['public_holidays'] ?? 0,
                'handover_staff_id' => $validated['handover_staff_id'] ?? null,
                'supervisor_id' => $supervisor->id,
                'approval_token' => $approvalToken,
                'approval_token_expires_at' => $tokenExpiry,
                'supervisor_email_sent' => $supervisor->supervisor_email,
            ]);

            // 6. SEND EMAIL NOTIFICATIONS
            try {
                // Get leave type name
                $leaveType = LpeLeaveType::find($validated['leave_type_id']);
                
                // Email to staff (confirmation)
                $this->sendStaffConfirmationEmail($staff, $leaveApplication, $leaveType);
                
                // Email to supervisor (approval link)
                $this->sendSupervisorApprovalEmail($supervisor, $staff, $leaveApplication, $leaveType, $approvalToken);
            } catch (\Exception $e) {
                // Log email error but don't fail the leave application
                \Log::error('Failed to send leave application emails: ' . $e->getMessage());
            }

            return response()->json([
                'message' => 'Leave application submitted successfully. Awaiting supervisor approval.',
                'data' => [
                    'id' => $leaveApplication->id,
                    'leave_type' => $leaveType->name ?? 'Unknown',
                    'start_date' => $leaveApplication->start_date,
                    'end_date' => $leaveApplication->end_date,
                    'days' => $leaveApplication->days,
                    'status' => $leaveApplication->status,
                    'applied_at' => $leaveApplication->applied_at,
                    'remaining_balance' => $availableBalance - $days,
                    'supervisor_email' => $supervisor->supervisor_email,
                    'approval_token' => $approvalToken,
                    'approval_url' => env('FRONTEND_URL', 'http://localhost:5173') . '/leave-approval/' . $approvalToken,
                ]
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

    /**
     * View staff leave history - using Eloquent models
     */
    public function index()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $leaveHistory = LeaveApplication::forStaff($this->getAuthenticatedStaffId())
                ->with(['leaveType', 'jobStructure', 'client', 'handoverStaff'])
                ->orderByDesc('applied_at')
                ->get()
                ->map(function ($leave) {
                    return [
                        'id' => $leave->id,
                        'leave_type' => $leave->leaveType->name ?? 'Unknown',
                        'start_date' => $leave->start_date,
                        'end_date' => $leave->end_date,
                        'days' => $leave->days,
                        'reason' => $leave->reason,
                        'status' => $leave->status,
                        'applied_at' => $leave->applied_at,
                        'job_structure' => $leave->jobStructure->job_title ?? 'N/A',
                        'public_holidays' => $leave->public_holidays ?? 0,
                        'handover_staff_id' => $leave->handover_staff_id,
                        'handover_staff_name' => $leave->handoverStaff 
                            ? trim($leave->handoverStaff->first_name . ' ' . $leave->handoverStaff->last_name)
                            : null,
                    ];
                });

            return response()->json([
                'message' => 'Leave applications retrieved',
                'data' => $leaveHistory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching leave applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Cancel leave application - with balance restoration
     */
    public function destroy($id)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $leaveApplication = LeaveApplication::where('id', $id)
                ->where('staff_id', $this->getAuthenticatedStaffId())
                ->first();

            if (!$leaveApplication) {
                return response()->json(['message' => 'Leave application not found'], 404);
            }

            // Only pending applications can be deleted
            if ($leaveApplication->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending leave applications can be cancelled',
                    'status' => $leaveApplication->status
                ], 403);
            }

            // Restore leave balance (no need to update table, it's calculated on-the-fly)
            // Just delete the application, balance will be recalculated automatically

            // Delete the application
            $leaveApplication->delete();

            return response()->json([
                'message' => 'Leave application cancelled successfully',
                'restored_balance' => $leaveApplication->days
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error cancelling leave application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff leave balance for current year
     */
    public function getLeaveBalance()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $this->getAuthenticatedStaffId();
            $staff = Staff::findOrFail($staffId);
            $currentYear = now()->year;

            // Get entitlements for this staff's job structure
            $entitlements = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->with('leaveType')
                ->get();

            $balances = $entitlements->map(function ($entitlement) use ($staffId, $currentYear) {
                // Count used days from leave_applications for this leave type in current year
                $usedDays = LeaveApplication::where('staff_id', $staffId)
                    ->where('leave_type_id', $entitlement->leave_type_id)
                    ->whereYear('start_date', $currentYear)
                    ->where('status', '!=', 'rejected')
                    ->sum('days');

                $usedDays = $usedDays ?? 0;
                $availableBalance = $entitlement->entitled_days - $usedDays;

                return [
                    'leave_type' => $entitlement->leaveType->name,
                    'leave_type_id' => $entitlement->leave_type_id,
                    'entitled_days' => $entitlement->entitled_days,
                    'used_days' => $usedDays,
                    'available_balance' => $availableBalance,
                    'renewal_frequency' => $entitlement->renewal_frequency,
                ];
            })->values();

            return response()->json([
                'message' => 'Leave balances retrieved',
                'year' => $currentYear,
                'data' => $balances
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching leave balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff profile with job structure and entitlements
     */
    public function getProfile()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staff = Staff::with(['jobStructure', 'client'])
                ->findOrFail($this->getAuthenticatedStaffId());

            // Get entitlements for this staff's job structure
            $entitlements = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->with('leaveType')
                ->get()
                ->map(function ($ent) {
                    return [
                        'leave_type' => $ent->leaveType->name,
                        'entitled_days' => $ent->entitled_days,
                        'renewal_frequency' => $ent->renewal_frequency,
                    ];
                });

            return response()->json([
                'message' => 'Staff profile retrieved',
                'data' => [
                    'id' => $staff->id,
                    'staff_id' => $staff->staff_id,
                    'first_name' => $staff->first_name,
                    'last_name' => $staff->last_name,
                    'email' => $staff->email,
                    'gender' => $staff->gender,
                    'designation' => $staff->designation,
                    'job_structure' => [
                        'id' => $staff->jobStructure?->id,
                        'job_code' => $staff->jobStructure?->job_code,
                        'job_title' => $staff->jobStructure?->job_title,
                    ],
                    'client' => [
                        'id' => $staff->client?->id,
                        'name' => $staff->client?->organisation_name,
                    ],
                    'entitlements' => $entitlements,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching staff profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff available for leave handover
     */
    public function handoverList()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $this->getAuthenticatedStaffId();
            $currentStaff = Staff::findOrFail($staffId);

            // Get other staff in the same client/department who can cover leave
            $handoverStaff = Staff::where('client_id', $currentStaff->client_id)
                ->where('id', '!=', $staffId)
                ->where('status', 'active')
                ->select('id', 'first_name', 'last_name', 'email', 'job_title')
                ->get()
                ->map(function ($staff) {
                    return [
                        'id' => $staff->id,
                        'first_name' => $staff->first_name,
                        'last_name' => $staff->last_name,
                        'email' => $staff->email,
                        'job_title' => $staff->job_title,
                    ];
                });

            return response()->json([
                'message' => 'Available staff for handover',
                'data' => $handoverStaff
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching handover list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process carry over of unused leave days
     */
    public function processCarryOver(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $validated = $request->validate([
                'leave_type_id' => 'required|exists:lpe_leave_types,id',
                'carryover_days' => 'required|numeric|min:0',
            ]);

            $staffId = $this->getAuthenticatedStaffId();
            $currentYear = now()->year;

            // Find last year's balance
            $lastYearBalance = LeaveBalance::where('staff_id', $staffId)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->where('year', $currentYear - 1)
                ->first();

            if (!$lastYearBalance) {
                return response()->json([
                    'message' => 'No leave balance found for previous year'
                ], 404);
            }

            // Create or update current year balance with carryover
            $currentBalance = LeaveBalance::firstOrCreate(
                [
                    'staff_id' => $staffId,
                    'leave_type_id' => $validated['leave_type_id'],
                    'year' => $currentYear,
                ],
                [
                    'client_id' => Staff::find($staffId)->client_id,
                    'carryover_days' => $validated['carryover_days'],
                    'renewal_frequency' => $lastYearBalance->renewal_frequency,
                ]
            );

            // Update carryover and available balance
            $currentBalance->update([
                'carryover_days' => $validated['carryover_days'],
                'available_balance' => ($currentBalance->entitled_days + $validated['carryover_days']) - $currentBalance->used_days
            ]);

            return response()->json([
                'message' => 'Carryover processed successfully',
                'data' => [
                    'leave_type_id' => $currentBalance->leave_type_id,
                    'carryover_days' => $currentBalance->carryover_days,
                    'available_balance' => $currentBalance->available_balance,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing carryover',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PHASE 3 ENDPOINTS - Dynamic Leave Data
     * Get available leave types for staff's job structure
     */
    public function getAvailableLeaveTypes()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $user = Auth::user();
            $staffId = $user->staff_profile_id ?? $user->id;
            $staff = Staff::findOrFail($staffId);
            \Log::info('[LeaveApply] getAvailableLeaveTypes - User ID: ' . $user->id . ', Staff ID: ' . $staffId . ', Job Structure ID: ' . $staff->job_structure_id);

            $leaveTypes = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->with('leaveType')
                ->get();
            
            \Log::info('[LeaveApply] Found entitlements count: ' . $leaveTypes->count());

            $mappedTypes = $leaveTypes->map(function ($entitlement) {
                \Log::info('[LeaveApply] Mapping entitlement:', [
                    'leave_type_id' => $entitlement->leaveType->id,
                    'leave_type_name' => $entitlement->leaveType->name,
                    'entitled_days' => $entitlement->entitled_days,
                ]);
                return [
                    'id' => $entitlement->leaveType->id,
                    'name' => $entitlement->leaveType->name,
                    'code' => $entitlement->leaveType->code ?? null,
                    'description' => $entitlement->leaveType->description ?? null,
                    'entitled_days' => $entitlement->entitled_days,
                    'renewal_frequency' => $entitlement->renewal_frequency,
                    'is_paid' => $entitlement->leaveType->is_paid ?? true,
                    'requires_approval' => $entitlement->leaveType->requires_approval ?? true,
                ];
            })->values();

            return response()->json([
                'message' => 'Available leave types retrieved',
                'job_structure_id' => $staff->job_structure_id,
                'data' => $mappedTypes
            ]);

        } catch (\Exception $e) {
            \Log::error('[LeaveApply] Error in getAvailableLeaveTypes: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching available leave types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed entitlements and current balances for staff
     */
    public function getEntitlementsWithBalance()
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $this->getAuthenticatedStaffId();
            $staff = Staff::findOrFail($staffId);
            $currentYear = now()->year;

            // Get entitlements for this staff's job structure
            $entitlements = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->with('leaveType')
                ->get();

            $entitlementsData = $entitlements->map(function ($entitlement) use ($staffId, $currentYear) {
                // Count used days from leave_applications for this leave type in current year
                $usedDays = LeaveApplication::where('staff_id', $staffId)
                    ->where('leave_type_id', $entitlement->leave_type_id)
                    ->whereYear('start_date', $currentYear)
                    ->where('status', '!=', 'rejected')
                    ->sum('days');

                $usedDays = $usedDays ?? 0;
                $availableBalance = $entitlement->entitled_days - $usedDays;

                return [
                    'leave_type' => $entitlement->leaveType->name,
                    'leave_type_id' => $entitlement->leave_type_id,
                    'entitled_days' => $entitlement->entitled_days,
                    'used_days' => $usedDays,
                    'carryover_days' => 0, // Can be enhanced later
                    'available_balance' => $availableBalance,
                    'renewal_frequency' => $entitlement->renewal_frequency,
                    'effective_from' => null,
                    'effective_to' => null,
                ];
            })->values();

            return response()->json([
                'message' => 'Entitlements and balances retrieved',
                'year' => $currentYear,
                'data' => $entitlementsData
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching entitlements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate leave days between two dates (considering weekends/holidays if needed)
     */
    public function calculateLeaveDays(Request $request)
    {
        try {
            $validated = $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);
            $interval = $startDate->diff($endDate);
            $days = $interval->days + 1; // inclusive

            return response()->json([
                'message' => 'Leave days calculated',
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'leave_days' => $days
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error calculating leave days',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if staff can apply for specific leave (pre-validation)
     */
    public function checkLeaveEligibility(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $validated = $request->validate([
                'leave_type_id' => 'required|exists:lpe_leave_types,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
            ]);

            $staffId = $this->getAuthenticatedStaffId();
            $staff = Staff::findOrFail($staffId);

            // Calculate days
            $startDate = new \DateTime($validated['start_date']);
            $endDate = new \DateTime($validated['end_date']);
            $interval = $startDate->diff($endDate);
            $days = $interval->days + 1;

            // Check 1: Entitlement exists
            $entitlement = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->first();

            if (!$entitlement) {
                return response()->json([
                    'eligible' => false,
                    'reason' => 'Leave type not entitled for your position',
                    'data' => []
                ]);
            }

            // Check 2: Balance available - calculate from entitlements and used days
            $currentYear = now()->year;
            $usedDays = LeaveApplication::where('staff_id', $staffId)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->whereYear('start_date', $currentYear)
                ->where('status', '!=', 'rejected')
                ->sum('days');

            $usedDays = $usedDays ?? 0;
            $availableBalance = $entitlement->entitled_days - $usedDays;
            $hasBalance = $availableBalance >= $days;

            // Check 3: No conflicting applications
            $conflictingApp = LeaveApplication::where('staff_id', $staffId)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->where('status', '!=', 'rejected')
                ->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                ->orWhere(function ($query) use ($validated) {
                    $query->whereBetween('end_date', [$validated['start_date'], $validated['end_date']]);
                })
                ->exists();

            if ($conflictingApp) {
                return response()->json([
                    'eligible' => false,
                    'reason' => 'Overlapping leave application already exists',
                    'data' => []
                ]);
            }

            return response()->json([
                'eligible' => true,
                'reason' => $hasBalance ? 'Eligible to apply' : 'Insufficient balance',
                'data' => [
                    'leave_type' => $entitlement->leaveType->name,
                    'requested_days' => $days,
                    'available_balance' => $availableBalance,
                    'can_proceed' => $hasBalance,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error checking eligibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed balance for a specific leave type
     */
    public function getLeaveTypeBalance($leaveTypeId)
    {
        try {
            if (!Auth::check()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $this->getAuthenticatedStaffId();
            $staff = Staff::findOrFail($staffId);

            // Get entitlement
            $entitlement = LpeLeaveEntitlement::where('job_structure_id', $staff->job_structure_id)
                ->where('leave_type_id', $leaveTypeId)
                ->with('leaveType')
                ->first();

            if (!$entitlement) {
                return response()->json([
                    'message' => 'Leave type not available for your position'
                ], 404);
            }

            $currentYear = now()->year;

            // Calculate used days in current year
            $usedDays = LeaveApplication::where('staff_id', $staffId)
                ->where('leave_type_id', $leaveTypeId)
                ->whereYear('start_date', $currentYear)
                ->where('status', '!=', 'rejected')
                ->sum('days');

            $usedDays = $usedDays ?? 0;
            $availableBalance = $entitlement->entitled_days - $usedDays;

            // Get last few years data if available (for trend analysis)
            $history = [];
            for ($year = $currentYear; $year >= $currentYear - 2; $year--) {
                $yearUsed = LeaveApplication::where('staff_id', $staffId)
                    ->where('leave_type_id', $leaveTypeId)
                    ->whereYear('start_date', $year)
                    ->where('status', '!=', 'rejected')
                    ->sum('days');

                $history[] = [
                    'year' => $year,
                    'entitled_days' => $entitlement->entitled_days,
                    'used_days' => $yearUsed ?? 0,
                    'available_balance' => $entitlement->entitled_days - ($yearUsed ?? 0),
                ];
            }

            return response()->json([
                'message' => 'Leave type balance details',
                'leave_type' => $entitlement->leaveType->name,
                'current_balance' => [
                    'year' => $currentYear,
                    'entitled_days' => $entitlement->entitled_days,
                    'used_days' => $usedDays,
                    'available_balance' => $availableBalance,
                ],
                'history' => $history
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching leave type balance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send confirmation email to staff member
     */
    private function sendStaffConfirmationEmail($staff, $leaveApplication, $leaveType)
    {
        try {
            \Log::info('Starting staff confirmation email process', [
                'staff_id' => $staff->id,
                'staff_email' => $staff->email,
                'leave_id' => $leaveApplication->id,
            ]);

            // Get supervisor information
            $supervisor = StaffSupervisor::where('staff_id', $staff->id)
                ->where('is_active', true)
                ->first();

            if (!$supervisor) {
                \Log::warning('No active supervisor found for staff ' . $staff->id);
                return;
            }

            \Log::info('Supervisor found, preparing email', [
                'supervisor_id' => $supervisor->id,
                'supervisor_name' => $supervisor->supervisor_name,
            ]);

            // Send email to staff
            Mail::to($staff->email)->send(
                new LeaveApplicationSubmittedMail($staff, $leaveApplication, $supervisor)
            );

            \Log::info('✓ Leave confirmation email sent successfully to ' . $staff->email);
        } catch (\Exception $e) {
            \Log::error('✗ FAILED to send leave confirmation email', [
                'staff_id' => $staff->id ?? 'unknown',
                'staff_email' => $staff->email ?? 'unknown',
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Send approval email to supervisor with one-time link
     */
    private function sendSupervisorApprovalEmail($supervisor, $staff, $leaveApplication, $leaveType, $approvalToken)
    {
        try {
            $frontendUrl = env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000'));
            
            if (!$frontendUrl) {
                $frontendUrl = 'http://localhost:3000';
            }
            
            $approvalUrl = rtrim($frontendUrl, '/') . '/leave-approval/' . $approvalToken;
            
            \Log::info('Starting supervisor approval email process', [
                'supervisor_email' => $supervisor->supervisor_email,
                'supervisor_name' => $supervisor->supervisor_name,
                'staff_id' => $staff->id,
                'leave_id' => $leaveApplication->id,
                'approval_url' => $approvalUrl,
            ]);

            // Send email to supervisor with approval link
            Mail::to($supervisor->supervisor_email)->send(
                new LeaveApprovalRequestMail($staff, $leaveApplication, $supervisor, $approvalUrl)
            );

            \Log::info('✓ Leave approval request email sent successfully to ' . $supervisor->supervisor_email);
        } catch (\Exception $e) {
            \Log::error('✗ FAILED to send supervisor approval email', [
                'supervisor_email' => $supervisor->supervisor_email ?? 'unknown',
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
