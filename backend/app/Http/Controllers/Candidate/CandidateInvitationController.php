<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\InterviewInvitation;
use App\Models\Recruitment\TestAssignment;
use App\Models\Recruitment\InterviewSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CandidateInvitationController extends Controller
{
    /**
     * Get all invitations for the authenticated candidate
     */
    public function getInvitations(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $invitations = InterviewInvitation::with([
                'recruitmentRequest:id,recruitment_request_number,job_title'
            ])
            ->where('candidate_id', $candidateId)
            ->orderBy('created_at', 'desc')
            ->get();

            $formattedInvitations = $invitations->map(function($invitation) {
                return [
                    'id' => $invitation->id,
                    'type' => $invitation->invitation_type,
                    'status' => $invitation->status,
                    'recruitment_request' => [
                        'number' => $invitation->recruitmentRequest->recruitment_request_number,
                        'job_title' => $invitation->recruitmentRequest->job_title,
                    ],
                    'message' => $invitation->message,
                    'sent_at' => $invitation->sent_at,
                    'responded_at' => $invitation->responded_at,
                    'candidate_response' => $invitation->candidate_response,
                    'interview_date' => $invitation->interview_date,
                    'interview_time' => $invitation->interview_time,
                    'location' => $invitation->location,
                    'interview_type' => $invitation->interview_type,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedInvitations,
                'message' => 'Invitations retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invitations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pending invitations that require response
     */
    public function getPendingInvitations(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $invitations = InterviewInvitation::with([
                'recruitmentRequest:id,recruitment_request_number,job_title'
            ])
            ->where('candidate_id', $candidateId)
            ->where('status', 'sent')
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $invitations,
                'message' => 'Pending invitations retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending invitations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Respond to an invitation
     */
    public function respondToInvitation(Request $request, $invitationId): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? $request->candidate_id;

            $invitation = InterviewInvitation::where('id', $invitationId)
                                           ->where('candidate_id', $candidateId)
                                           ->firstOrFail();

            if ($invitation->status !== 'sent') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot respond to this invitation'
                ], 422);
            }

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'response' => 'required|in:accepted,declined',
                'message' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update invitation
            $invitation->update([
                'status' => $request->response,
                'candidate_response' => $request->message,
                'responded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $invitation,
                'message' => 'Response submitted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to respond to invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invitation statistics for candidate dashboard
     */
    public function getInvitationStats(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $stats = [
                'total_invitations' => InterviewInvitation::where('candidate_id', $candidateId)->count(),
                'pending_invitations' => InterviewInvitation::where('candidate_id', $candidateId)
                                                          ->where('status', 'sent')->count(),
                'accepted_invitations' => InterviewInvitation::where('candidate_id', $candidateId)
                                                           ->where('status', 'accepted')->count(),
                'declined_invitations' => InterviewInvitation::where('candidate_id', $candidateId)
                                                           ->where('status', 'declined')->count(),
                'interview_invitations' => InterviewInvitation::where('candidate_id', $candidateId)->count(),
                'recent_invitations' => InterviewInvitation::where('candidate_id', $candidateId)
                                                          ->where('created_at', '>=', now()->subDays(7))->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Invitation statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invitation statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
