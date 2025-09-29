<?php
namespace App\Http\Controllers;

use App\Models\ClientInterviewFeedback;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\RecruitmentApplication;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ClientInterviewFeedbackController extends Controller
{
    /**
     * Get active tickets with candidates for feedback submission
     */
    public function getActiveTicketsWithCandidates()
    {
        try {
            // Get tickets with candidates who have been interviewed but don't have feedback yet
            $ticketsWithCandidates = DB::table('recruitment_requests as rr')
                ->join('candidate_job_applications as cja', 'rr.id', '=', 'cja.recruitment_request_id')
                ->join('candidates as c', 'cja.candidate_id', '=', 'c.id')
                ->join('clients as cl', 'rr.client_id', '=', 'cl.id')
                ->join('job_structures as js', 'rr.job_structure_id', '=', 'js.id')
                ->leftJoin('client_interview_feedback as cif', function($join) {
                    $join->on('cja.candidate_id', '=', 'cif.candidate_id')
                         ->on('cja.recruitment_request_id', '=', 'cif.recruitment_request_id');
                })
                ->leftJoin('client_interviews as ci', function($join) {
                    $join->on('cja.candidate_id', '=', 'ci.candidate_id')
                         ->on('cja.recruitment_request_id', '=', 'ci.recruitment_request_id');
                })
                ->select(
                    'rr.id as recruitment_request_id',
                    'rr.ticket_id',
                    'rr.description',
                    'rr.number_of_vacancies',
                    'cl.name as client_name',
                    'js.position_title',
                    'c.id as candidate_id',
                    DB::raw('CONCAT(c.first_name, " ", c.last_name) as candidate_name'),
                    'c.email as candidate_email',
                    'c.phone as candidate_phone',
                    'ra.status as application_status',
                    'ra.applied_at',
                    'cif.feedback_status as existing_feedback',
                    'ci.status as interview_status',
                    'ci.interview_date',
                    'ci.interview_time'
                )
                ->where('rr.status', 'active')
                ->whereIn('ra.status', ['interviewed', 'shortlisted'])
                ->whereNull('cif.id') // No feedback yet
                ->orderBy('rr.ticket_id')
                ->orderBy('c.first_name')
                ->get()
                ->groupBy('ticket_id');

            // Format the response
            $formattedData = [];
            foreach ($ticketsWithCandidates as $ticketId => $candidates) {
                $firstCandidate = $candidates->first();
                $formattedData[] = [
                    'ticket_id' => $ticketId,
                    'recruitment_request_id' => $firstCandidate->recruitment_request_id,
                    'description' => $firstCandidate->description,
                    'position_title' => $firstCandidate->position_title,
                    'client_name' => $firstCandidate->client_name,
                    'number_of_vacancies' => $firstCandidate->number_of_vacancies,
                    'candidates' => $candidates->map(function ($candidate) {
                        return [
                            'candidate_id' => $candidate->candidate_id,
                            'candidate_name' => $candidate->candidate_name,
                            'candidate_email' => $candidate->candidate_email,
                            'candidate_phone' => $candidate->candidate_phone,
                            'application_status' => $candidate->application_status,
                            'applied_at' => $candidate->applied_at,
                            'interview_status' => $candidate->interview_status,
                            'interview_date' => $candidate->interview_date,
                            'interview_time' => $candidate->interview_time,
                            'has_feedback' => !is_null($candidate->existing_feedback)
                        ];
                    })->toArray()
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'message' => 'Active tickets with candidates for feedback retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tickets with candidates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit client interview feedback
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'candidate_id' => 'required|exists:candidates,id',
            'recruitment_request_id' => 'required|exists:recruitment_requests,id',
            'client_interview_id' => 'nullable|exists:client_interviews,id',
            'feedback_status' => 'required|in:successful,unsuccessful,keep_in_view',
            'comments' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Check if feedback already exists for this candidate and recruitment request
            $existingFeedback = ClientInterviewFeedback::where('candidate_id', $request->candidate_id)
                ->where('recruitment_request_id', $request->recruitment_request_id)
                ->first();

            if ($existingFeedback) {
                return response()->json([
                    'success' => false,
                    'message' => 'Feedback already exists for this candidate'
                ], 422);
            }

            $feedback = ClientInterviewFeedback::create([
                'client_interview_id' => $request->client_interview_id,
                'candidate_id' => $request->candidate_id,
                'recruitment_request_id' => $request->recruitment_request_id,
                'feedback_status' => $request->feedback_status,
                'comments' => $request->comments,
                'created_by' => Auth::id()
            ]);

            // Update candidate application status based on feedback
            $newStatus = match($request->feedback_status) {
                'successful' => 'accepted',
                'unsuccessful' => 'rejected',
                'keep_in_view' => 'under_review'
            };

            DB::table('candidate_job_applications')
                ->where('recruitment_request_id', $request->recruitment_request_id)
                ->where('candidate_id', $request->candidate_id)
                ->update([
                    'application_status' => $newStatus,
                    'last_status_change' => now(),
                    'updated_at' => now()
                ]);

            DB::commit();

            // Load relationships for response
            $feedback->load(['candidate', 'recruitmentRequest', 'clientInterview']);

            return response()->json([
                'success' => true,
                'data' => $feedback,
                'message' => 'Client interview feedback submitted successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get feedback for a specific candidate
     */
    public function getCandidateFeedback($candidateId)
    {
        try {
            $feedback = ClientInterviewFeedback::with([
                'candidate', 'recruitmentRequest', 'clientInterview', 'createdBy'
            ])
            ->where('candidate_id', $candidateId)
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $feedback,
                'message' => 'Candidate feedback retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve candidate feedback: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all feedback with pagination
     */
    public function index(Request $request)
    {
        try {
            $query = ClientInterviewFeedback::with([
                'candidate', 'recruitmentRequest', 'clientInterview', 'createdBy'
            ])->orderBy('created_at', 'desc');

            // Filter by feedback status if provided
            if ($request->has('feedback_status')) {
                $query->where('feedback_status', $request->feedback_status);
            }

            // Filter by recruitment request if provided
            if ($request->has('recruitment_request_id')) {
                $query->where('recruitment_request_id', $request->recruitment_request_id);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $feedback = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $feedback->items(),
                'pagination' => [
                    'current_page' => $feedback->currentPage(),
                    'per_page' => $feedback->perPage(),
                    'total' => $feedback->total(),
                    'total_pages' => $feedback->lastPage()
                ],
                'message' => 'Client interview feedback retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve feedback: ' . $e->getMessage()
            ], 500);
        }
    }
}