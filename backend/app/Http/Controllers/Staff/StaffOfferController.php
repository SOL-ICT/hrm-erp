<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffOfferAcceptanceLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StaffOfferController extends Controller
{
    /**
     * Get offer status for authenticated staff
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOfferStatus(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            Log::info('StaffOfferController::getOfferStatus - User:', [
                'user_id' => $user->id,
                'user_type' => $user->user_type,
                'staff_profile_id' => $user->staff_profile_id
            ]);

            // Get staff record - user.id maps to staff.id or use staff_profile_id
            $staffId = $user->staff_profile_id ?? $user->id;
            
            $staff = DB::table('staff')
                ->where('id', $staffId)
                ->first();

            if (!$staff) {
                Log::warning('StaffOfferController::getOfferStatus - Staff not found', [
                    'staff_id' => $staffId
                ]);
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            // Calculate days remaining if offer sent
            $daysRemaining = null;
            $daysElapsed = null;
            
            if ($staff->offer_sent_at && $staff->offer_acceptance_status === 'sent') {
                $sentDate = Carbon::parse($staff->offer_sent_at);
                $now = Carbon::now();
                $daysElapsed = $sentDate->diffInDays($now);
                
                // Offer expires after 30 days
                $expiryDate = $sentDate->copy()->addDays(30);
                $daysRemaining = $now->diffInDays($expiryDate, false);
                
                // If negative, offer has expired
                if ($daysRemaining < 0) {
                    $daysRemaining = 0;
                }
            }

            // Get offer logs for this staff
            $offerLogs = DB::table('staff_offer_acceptance_log')
                ->where('staff_id', $staff->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $response = [
                'staff_id' => $staff->id,
                'employee_code' => $staff->employee_code,
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'email' => $staff->email,
                'offer_acceptance_status' => $staff->offer_acceptance_status,
                'offer_sent_at' => $staff->offer_sent_at,
                'offer_accepted_at' => $staff->offer_accepted_at,
                'offer_expires_at' => $staff->offer_expires_at,
                'days_remaining' => $daysRemaining,
                'days_elapsed' => $daysElapsed,
                'status' => $staff->status,
                'logs' => $offerLogs,
            ];

            Log::info('StaffOfferController::getOfferStatus - Response:', $response);

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('StaffOfferController::getOfferStatus - Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching offer status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Accept offer for authenticated staff
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function acceptOffer(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $staffId = $user->staff_profile_id ?? $user->id;

            $staff = DB::table('staff')->where('id', $staffId)->first();

            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            // Validate that offer was sent
            if ($staff->offer_acceptance_status !== 'sent') {
                return response()->json([
                    'message' => 'No pending offer to accept',
                    'current_status' => $staff->offer_acceptance_status
                ], 400);
            }

            // Check if offer has expired (30 days)
            if ($staff->offer_sent_at) {
                $sentDate = Carbon::parse($staff->offer_sent_at);
                $daysElapsed = $sentDate->diffInDays(Carbon::now());
                
                if ($daysElapsed > 30) {
                    return response()->json([
                        'message' => 'Offer has expired',
                        'days_elapsed' => $daysElapsed
                    ], 400);
                }
            }

            // Update staff record
            DB::table('staff')
                ->where('id', $staffId)
                ->update([
                    'offer_acceptance_status' => 'accepted',
                    'offer_accepted_at' => Carbon::now(),
                    'offer_already_accepted' => true,
                    'status' => 'active', // Reactivate if suspended
                    'updated_at' => Carbon::now(),
                ]);

            // Create log entry
            StaffOfferAcceptanceLog::logOfferAccepted(
                $staffId,
                $user->id,
                'Staff accepted offer via self-service portal',
                [
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'accepted_at' => Carbon::now()->toDateTimeString(),
                ]
            );

            Log::info('StaffOfferController::acceptOffer - Offer accepted:', [
                'staff_id' => $staffId,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Offer accepted successfully',
                'status' => 'accepted',
                'accepted_at' => Carbon::now()->toDateTimeString(),
            ]);

        } catch (\Exception $e) {
            Log::error('StaffOfferController::acceptOffer - Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error accepting offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject offer for authenticated staff
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectOffer(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Validate request
            $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $staffId = $user->staff_profile_id ?? $user->id;

            $staff = DB::table('staff')->where('id', $staffId)->first();

            if (!$staff) {
                return response()->json(['message' => 'Staff record not found'], 404);
            }

            // Validate that offer was sent
            if ($staff->offer_acceptance_status !== 'sent') {
                return response()->json([
                    'message' => 'No pending offer to reject',
                    'current_status' => $staff->offer_acceptance_status
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Update staff record
                DB::table('staff')
                    ->where('id', $staffId)
                    ->update([
                        'offer_acceptance_status' => 'rejected',
                        'status' => 'inactive',
                        'updated_at' => Carbon::now(),
                    ]);

                // Create log entry
                StaffOfferAcceptanceLog::logOfferRejected(
                    $staffId,
                    $user->id,
                    $request->reason,
                    [
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'rejected_at' => Carbon::now()->toDateTimeString(),
                    ]
                );

                // Create termination record
                DB::table('staff_terminations')->insert([
                    'staff_id' => $staffId,
                    'client_id' => $staff->client_id ?? 1,
                    'termination_type' => 'resignation',
                    'termination_date' => Carbon::now(),
                    'transaction_date' => Carbon::now(),
                    'actual_relieving_date' => Carbon::now(),
                    'reason' => 'Staff rejected offer: ' . $request->reason,
                    'exit_penalty' => 'no',
                    'ppe_return' => 'n/a',
                    'exit_interview' => 'n/a',
                    'is_blacklisted' => false,
                    'processed_by' => $user->id,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                DB::commit();

                Log::info('StaffOfferController::rejectOffer - Offer rejected:', [
                    'staff_id' => $staffId,
                    'user_id' => $user->id,
                    'reason' => $request->reason,
                ]);

                return response()->json([
                    'message' => 'Offer rejected successfully',
                    'status' => 'rejected',
                    'termination_created' => true,
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('StaffOfferController::rejectOffer - Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error rejecting offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
