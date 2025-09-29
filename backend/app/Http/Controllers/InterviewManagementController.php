<?php

namespace App\Http\Controllers;

use App\Models\Recruitment\InterviewSchedule;
use App\Models\Recruitment\TestResult;
use App\Models\Candidate\CandidateJobApplication;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class InterviewManagementController extends Controller
{
    /**
     * Get interviews for admin dashboard
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InterviewSchedule::with([
                'candidate',
                'recruitmentRequest',
                'testResult',
                'creator'
            ]);

            // Apply filters
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('interview_type')) {
                $query->where('interview_type', $request->interview_type);
            }

            if ($request->filled('interview_level')) {
                $query->where('interview_level', $request->interview_level);
            }

            if ($request->filled('date_from')) {
                $query->whereDate('scheduled_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->whereDate('scheduled_at', '<=', $request->date_to);
            }

            if ($request->filled('recruitment_request_id')) {
                $query->where('recruitment_request_id', $request->recruitment_request_id);
            }

            $interviews = $query->orderBy('scheduled_at', 'desc')
                               ->paginate($request->per_page ?? 15);

            return response()->json([
                'success' => true,
                'data' => $interviews,
                'message' => 'Interviews retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve interviews',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Schedule a new interview
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'candidate_id' => 'required|exists:candidates,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'test_result_id' => 'nullable|exists:test_results,id',
                'interview_type' => 'required|in:video,phone,in_person,client_meeting',
                'interview_level' => 'required|in:first,second,final,client',
                'scheduled_at' => 'required|date|after:now',
                'duration_minutes' => 'required|integer|min:15|max:480',
                'meeting_link' => 'nullable|url',
                'meeting_id' => 'nullable|string',
                'location' => 'nullable|string',
                'interviewer_notes' => 'nullable|string',
                'candidate_instructions' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview = InterviewSchedule::create([
                'candidate_id' => $request->candidate_id,
                'recruitment_request_id' => $request->recruitment_request_id,
                'test_result_id' => $request->test_result_id,
                'interview_type' => $request->interview_type,
                'interview_level' => $request->interview_level,
                'scheduled_at' => $request->scheduled_at,
                'duration_minutes' => $request->duration_minutes,
                'meeting_link' => $request->meeting_link,
                'meeting_id' => $request->meeting_id,
                'location' => $request->location,
                'interviewer_notes' => $request->interviewer_notes,
                'candidate_instructions' => $request->candidate_instructions,
                'status' => 'scheduled',
                'created_by' => Auth::id(),
            ]);

            // Update job application status
            $application = CandidateJobApplication::where('candidate_id', $request->candidate_id)
                                                 ->where('recruitment_request_id', $request->recruitment_request_id)
                                                 ->first();

            if ($application) {
                $application->updateStatus('interview_scheduled', 'Interview scheduled for ' . $request->scheduled_at);
            }

            $interview->load(['candidate', 'recruitmentRequest', 'testResult']);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview scheduled successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific interview details
     */
    public function show($id): JsonResponse
    {
        try {
            $interview = InterviewSchedule::with([
                'candidate',
                'recruitmentRequest',
                'testResult',
                'creator'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Interview not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update interview details
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $interview = InterviewSchedule::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'interview_type' => 'sometimes|required|in:video,phone,in_person,client_meeting',
                'interview_level' => 'sometimes|required|in:first,second,final,client',
                'scheduled_at' => 'sometimes|required|date',
                'duration_minutes' => 'sometimes|required|integer|min:15|max:480',
                'meeting_link' => 'nullable|url',
                'meeting_id' => 'nullable|string',
                'location' => 'nullable|string',
                'interviewer_notes' => 'nullable|string',
                'candidate_instructions' => 'nullable|string',
                'status' => 'sometimes|required|in:scheduled,in_progress,completed,cancelled,rescheduled,no_show',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview->update($request->only([
                'interview_type', 'interview_level', 'scheduled_at', 'duration_minutes',
                'meeting_link', 'meeting_id', 'location', 'interviewer_notes',
                'candidate_instructions', 'status'
            ]));

            $interview->load(['candidate', 'recruitmentRequest', 'testResult']);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete interview with feedback
     */
    public function completeInterview(Request $request, $id): JsonResponse
    {
        try {
            $interview = InterviewSchedule::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'feedback' => 'nullable|array',
                'rating' => 'nullable|numeric|min:1|max:10',
                'decision' => 'nullable|in:proceed,reject,hold',
                'interviewer_notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview->complete(
                $request->feedback,
                $request->rating,
                $request->decision
            );

            if ($request->interviewer_notes) {
                $interview->update(['interviewer_notes' => $request->interviewer_notes]);
            }

            // Update job application status
            $application = CandidateJobApplication::where('candidate_id', $interview->candidate_id)
                                                 ->where('recruitment_request_id', $interview->recruitment_request_id)
                                                 ->first();

            if ($application) {
                $status = match($request->decision) {
                    'proceed' => 'interview_completed',
                    'reject' => 'rejected',
                    'hold' => 'under_review',
                    default => 'interview_completed'
                };
                
                $application->updateStatus($status, 'Interview completed with decision: ' . ($request->decision ?? 'pending'));
            }

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview completed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reschedule interview
     */
    public function rescheduleInterview(Request $request, $id): JsonResponse
    {
        try {
            $interview = InterviewSchedule::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'new_scheduled_at' => 'required|date|after:now',
                'reason' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview->reschedule($request->new_scheduled_at, $request->reason);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview rescheduled successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reschedule interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel interview
     */
    public function cancelInterview(Request $request, $id): JsonResponse
    {
        try {
            $interview = InterviewSchedule::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'reason' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $interview->cancel($request->reason);

            return response()->json([
                'success' => true,
                'data' => $interview,
                'message' => 'Interview cancelled successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel interview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upcoming interviews
     */
    public function getUpcomingInterviews(Request $request): JsonResponse
    {
        try {
            $interviews = InterviewSchedule::with([
                'candidate',
                'recruitmentRequest'
            ])
            ->upcoming()
            ->orderBy('scheduled_at', 'asc')
            ->limit($request->limit ?? 10)
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
}
