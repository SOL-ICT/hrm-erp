<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\InterviewInvitation;
use App\Models\Recruitment\TestResult;
use App\Models\Candidate\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class CandidateInterviewController extends Controller
{
    /**
     * Get interviews for candidate
     */
    public function getCandidateInterviews(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $interviews = InterviewInvitation::with([
                'recruitment_request:id,ticket_id,job_structure_id',
                'recruitment_request.jobStructure:id,job_title,job_code'
            ])
            ->where('candidate_id', $candidateId)
            ->orderBy('interview_date', 'desc')
            ->get();

            $formattedInterviews = $interviews->map(function($interview) {
                return [
                    'id' => $interview->id,
                    'recruitment_request' => $interview->recruitment_request ? [
                        'number' => $interview->recruitment_request->ticket_id,
                        'job_title' => $interview->recruitment_request->jobStructure ? 
                            $interview->recruitment_request->jobStructure->job_title : 'N/A',
                    ] : null,
                    'interview_type' => $interview->interview_type,
                    'interview_level' => 'Initial', // Default for invitations
                    'scheduled_at' => $interview->interview_date && $interview->interview_time 
                        ? $interview->interview_date . ' ' . $interview->interview_time
                        : null,
                    'duration_minutes' => 60, // Default duration
                    'formatted_duration' => '1 hour',
                    'meeting_link' => $interview->interview_type === 'virtual' ? $interview->location : null,
                    'location' => $interview->interview_type === 'physical' ? $interview->location : null,
                    'candidate_instructions' => $interview->message,
                    'status' => $interview->status,
                    'status_color' => 'blue', // Default color
                    'type_icon' => 'calendar', // Default icon
                    'is_today' => $interview->interview_date ? $interview->interview_date === now()->format('Y-m-d') : false,
                    'is_overdue' => $interview->interview_date ? $interview->interview_date < now()->format('Y-m-d') && $interview->status === 'pending' : false,
                    'rating' => null, // Not available for invitations
                    'decision' => null, // Not available for invitations
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedInterviews,
                'message' => 'Candidate interviews retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve candidate interviews',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upcoming interviews for candidate
     */
    public function getUpcomingInterviews(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $interviews = InterviewInvitation::with([
                'recruitment_request:id,ticket_id,job_structure_id',
                'recruitment_request.jobStructure:id,job_title,job_code'
            ])
            ->where('candidate_id', $candidateId)
            ->whereIn('status', ['pending', 'accepted'])
            ->where('interview_date', '>', now()->format('Y-m-d'))
            ->orderBy('interview_date', 'asc')
            ->limit($request->limit ?? 5)
            ->get();

            return response()->json([
                'success' => true,
                'data' => $interviews,
                'message' => 'Upcoming interviews retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve upcoming interviews',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get interview details for candidate
     */
    public function getInterviewDetails(Request $request, $interviewId): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            $interview = InterviewInvitation::with([
                'recruitment_request:id,ticket_id,job_structure_id,description',
                'recruitment_request.jobStructure:id,job_title,job_code,description'
            ])
            ->where('id', $interviewId)
            ->where('candidate_id', $candidateId)
            ->firstOrFail();

            $interviewData = [
                'id' => $interview->id,
                'recruitment_request' => [
                    'number' => $interview->recruitmentRequest->ticket_id,
                    'job_title' => $interview->recruitmentRequest->jobStructure ? 
                        $interview->recruitmentRequest->jobStructure->job_title : 'N/A',
                    'job_description' => $interview->recruitmentRequest->jobStructure ? 
                        $interview->recruitmentRequest->jobStructure->description : 
                        ($interview->recruitmentRequest->description ?? 'N/A'),
                ],
                'interview_type' => $interview->interview_type,
                'interview_level' => $interview->interview_level,
                'scheduled_at' => $interview->scheduled_at,
                'duration_minutes' => $interview->duration_minutes,
                'formatted_duration' => $interview->formatted_duration,
                'meeting_link' => $interview->meeting_link,
                'meeting_id' => $interview->meeting_id,
                'location' => $interview->location,
                'candidate_instructions' => $interview->candidate_instructions,
                'status' => $interview->status,
                'status_color' => $interview->status_color,
                'type_icon' => $interview->type_icon,
                'is_today' => $interview->is_today,
                'is_overdue' => $interview->is_overdue,
                'rating' => $interview->rating,
                'decision' => $interview->decision,
                'feedback' => $interview->feedback,
                'completed_at' => $interview->completed_at,
                'test_result' => $interview->testResult ? [
                    'score_percentage' => $interview->testResult->score_percentage,
                    'passed' => $interview->testResult->passed,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'data' => $interviewData,
                'message' => 'Interview details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Interview not found or access denied',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update interview attendance status (mark as attended)
     */
    public function confirmAttendance(Request $request, $interviewId): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            $interview = InterviewInvitation::where('id', $interviewId)
                                         ->where('candidate_id', $candidateId)
                                         ->firstOrFail();

            // Check if interview is today or in the past
            if ($interview->interview_date && $interview->interview_date > now()->format('Y-m-d')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot confirm attendance for future interviews'
                ], 422);
            }

            if ($interview->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview has already been completed'
                ], 422);
            }

            // Update interview status to in_progress
            $interview->update([
                'status' => 'in_progress',
                'candidate_confirmed_attendance' => true,
                'candidate_attended_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Attendance confirmed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request interview reschedule
     */
    public function requestReschedule(Request $request, $interviewId): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
                'preferred_dates' => 'nullable|array',
                'preferred_dates.*' => 'date|after:now',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview = InterviewInvitation::where('id', $interviewId)
                                         ->where('candidate_id', $candidateId)
                                         ->firstOrFail();

            // Check if interview can be rescheduled
            if (in_array($interview->status, ['completed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot request reschedule for completed or cancelled interviews'
                ], 422);
            }

            // Check if reschedule request is made at least 24 hours before the interview
            if ($interview->scheduled_at->diffInHours(now()) < 24) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reschedule requests must be made at least 24 hours before the interview'
                ], 422);
            }

            // Update interview with reschedule request
            $interview->update([
                'status' => 'reschedule_requested',
                'candidate_reschedule_reason' => $request->reason,
                'candidate_preferred_dates' => $request->preferred_dates,
                'reschedule_requested_at' => now(),
            ]);

            // Update job application status
            $application = CandidateJobApplication::where('candidate_id', $candidateId)
                                                 ->where('recruitment_request_id', $interview->recruitment_request_id)
                                                 ->first();

            if ($application) {
                $application->updateStatus('interview_reschedule_requested', 'Candidate requested interview reschedule: ' . $request->reason);
            }

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Reschedule request submitted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit reschedule request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidate's job applications
     */
    public function getJobApplications(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $applications = CandidateJobApplication::with([
                'recruitmentRequest:id,ticket_id,job_structure_id',
                'recruitmentRequest.jobStructure:id,job_title,job_code',
                'testResults:id,score_percentage,passed',
                'interviews:id,scheduled_at,status,interview_type'
            ])
            ->where('candidate_id', $candidateId)
            ->orderBy('applied_at', 'desc')
            ->get();

            $formattedApplications = $applications->map(function($application) {
                return [
                    'id' => $application->id,
                    'recruitment_request' => [
                        'number' => $application->recruitmentRequest->ticket_id,
                        'job_title' => $application->recruitmentRequest->jobStructure ? 
                            $application->recruitmentRequest->jobStructure->job_title : 'N/A',
                    ],
                    'application_status' => $application->application_status,
                    'applied_at' => $application->applied_at,
                    'cover_letter' => $application->cover_letter,
                    'salary_expectations' => $application->salary_expectations,
                    'test_results' => $application->testResults->map(function($result) {
                        return [
                            'id' => $result->id,
                            'score_percentage' => $result->score_percentage,
                            'passed' => $result->passed,
                        ];
                    }),
                    'interviews' => $application->interviews->map(function($interview) {
                        return [
                            'id' => $interview->id,
                            'scheduled_at' => $interview->scheduled_at,
                            'status' => $interview->status,
                            'interview_type' => $interview->interview_type,
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedApplications,
                'message' => 'Job applications retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve job applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get status color for interview invitation status
     */
    private function getStatusColor($status)
    {
        switch ($status) {
            case 'pending':
                return 'yellow';
            case 'accepted':
                return 'green';
            case 'declined':
                return 'red';
            case 'completed':
                return 'blue';
            case 'cancelled':
                return 'gray';
            default:
                return 'gray';
        }
    }

    /**
     * Get type icon for interview type
     */
    private function getTypeIcon($type)
    {
        switch ($type) {
            case 'virtual':
                return 'video-camera';
            case 'physical':
                return 'office-building';
            case 'phone':
                return 'phone';
            default:
                return 'calendar';
        }
    }

    /**
     * Respond to interview invitation (accept/decline)
     */
    public function respondToInterview(Request $request, $interviewId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'response' => 'required|in:accepted,declined',
                'candidate_id' => 'sometimes|required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $candidateId = Auth::user()->candidate_id ?? Auth::user()->profile_id ?? $request->candidate_id;

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found'
                ], 400);
            }

            $interview = InterviewInvitation::where('id', $interviewId)
                                         ->where('candidate_id', $candidateId)
                                         ->firstOrFail();

            // Check if interview can still be responded to
            if ($interview->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot respond to completed interviews'
                ], 422);
            }

            // Update interview status based on response
            $status = $request->response === 'accepted' ? 'confirmed' : 'declined';
            $interview->update([
                'status' => $status,
                'candidate_response' => $request->response,
                'responded_at' => now(),
            ]);

            $message = $request->response === 'accepted' 
                ? 'Interview invitation accepted successfully' 
                : 'Interview invitation declined';

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to respond to interview invitation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
