<?php

namespace App\Http\Controllers;

use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\InterviewInvitation;
use App\Models\Candidate;
use App\Models\Recruitment\Test;
use App\Models\Recruitment\TestAssignment;
use App\Models\Recruitment\TestQuestion;
use App\Mail\InterviewInvitationMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CurrentVacanciesController extends Controller
{
    /**
     * Get current vacancies with candidate count
     */
    public function getCurrentVacancies(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $priorityLevel = $request->get('priority_level', '');
            $clientId = $request->get('client_id', '');
            $status = $request->get('status', 'active');

            $query = RecruitmentRequest::with([
                'jobStructure', 
                'client',
                'candidateJobApplications.candidate' // Include applications with candidate details
            ])
                ->withCount('candidateJobApplications')
                ->where('status', $status);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhereHas('jobStructure', function ($subQ) use ($search) {
                          $subQ->where('title', 'like', "%{$search}%");
                      })
                      ->orWhereHas('client', function ($subQ) use ($search) {
                          $subQ->where('organisation_name', 'like', "%{$search}%");
                      });
                });
            }

            if ($priorityLevel) {
                $query->where('priority_level', $priorityLevel);
            }

            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            $vacancies = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // Transform the data to include applications array for frontend
            $vacanciesData = $vacancies->getCollection()->map(function ($vacancy) {
                $vacancyArray = $vacancy->toArray();
                // Rename candidateJobApplications to applications for frontend compatibility
                $vacancyArray['applications'] = $vacancy->candidateJobApplications->toArray();
                // Remove the original candidateJobApplications key to avoid confusion
                unset($vacancyArray['candidate_job_applications']);
                return $vacancyArray;
            });

            $vacancies->setCollection($vacanciesData);

            return response()->json([
                'success' => true,
                'data' => $vacancies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch current vacancies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get candidates for a specific vacancy
     */
    public function getCandidates(Request $request, $vacancyId): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $search = $request->get('search', '');

            $vacancy = RecruitmentRequest::findOrFail($vacancyId);

            $query = CandidateJobApplication::with(['candidate'])
                ->where('recruitment_request_id', $vacancyId);

            if ($search) {
                $query->whereHas('candidate', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $applications = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applications,
                'vacancy' => $vacancy
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch candidates for vacancy:', [
                'vacancy_id' => $vacancyId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidates'
            ], 500);
        }
    }

    /**
     * Send interview invitations to selected candidates
     */
    public function sendInterviewInvitations(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'candidate_ids' => 'required|array|min:1',
                'candidate_ids.*' => 'exists:candidates,id',
                'interview_type' => 'required|string|in:physical,virtual,phone',
                'interview_date' => 'required|date|after:now',
                'interview_time' => 'required|date_format:H:i',
                'location' => 'nullable|string',
                'message' => 'nullable|string',
            ]);

            $recruitmentRequest = RecruitmentRequest::findOrFail($validated['recruitment_request_id']);
            $sentCount = 0;
            $failedCandidates = [];

            DB::beginTransaction();

            foreach ($validated['candidate_ids'] as $candidateId) {
                try {
                    $candidate = Candidate::findOrFail($candidateId);

                    // Check if invitation already exists
                    $existingInvitation = InterviewInvitation::where('candidate_id', $candidateId)
                        ->where('recruitment_request_id', $validated['recruitment_request_id'])
                        ->where('status', 'pending')
                        ->first();

                    if (!$existingInvitation) {
                        $invitation = InterviewInvitation::create([
                            'recruitment_request_id' => $validated['recruitment_request_id'],
                            'candidate_id' => $candidateId,
                            'interview_type' => $validated['interview_type'],
                            'interview_date' => $validated['interview_date'],
                            'interview_time' => $validated['interview_time'],
                            'location' => $validated['location'] ?? null,
                            'message' => $validated['message'] ?? '',
                            'status' => 'pending',
                            'sent_by' => auth('sanctum')->id() ?? 1, // Fallback to user ID 1 if no auth
                        ]);

                        // Load relationships needed for email
                        $invitation->load(['candidate', 'recruitmentRequest.jobStructure', 'recruitmentRequest.client']);

                        // Update candidate application status to interview_scheduled
                        DB::table('candidate_job_applications')
                            ->where('candidate_id', $candidateId)
                            ->where('recruitment_request_id', $validated['recruitment_request_id'])
                            ->update(['application_status' => 'interview_scheduled']);

                        // Send email invitation (don't fail the whole process if email fails)
                        try {
                            $this->sendInterviewInvitationEmail($invitation, $validated['message'] ?? '');
                        } catch (\Exception $emailError) {
                            Log::error("Failed to send interview invitation email, but invitation was created", [
                                'candidate_id' => $candidateId,
                                'invitation_id' => $invitation->id,
                                'email_error' => $emailError->getMessage()
                            ]);
                        }
                        $sentCount++;
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to send interview invitation to candidate {$candidateId}:", [
                        'error' => $e->getMessage()
                    ]);
                    $failedCandidates[] = $candidateId;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully sent {$sentCount} interview invitations",
                'data' => [
                    'sent_count' => $sentCount,
                    'failed_candidates' => $failedCandidates
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to send interview invitations:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send interview invitations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get interview invitations for a recruitment request
     */
    public function getInterviewInvitations(Request $request): JsonResponse
    {
        try {
            $recruitmentRequestId = $request->get('recruitment_request_id');

            if (!$recruitmentRequestId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request ID is required'
                ], 400);
            }

            $invitations = InterviewInvitation::with(['candidate', 'recruitmentRequest'])
                ->where('recruitment_request_id', $recruitmentRequestId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $invitations
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch interview invitations:', [
                'recruitment_request_id' => $request->get('recruitment_request_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interview invitations'
            ], 500);
        }
    }

    /**
     * Update an interview invitation
     */
    public function updateInvitation(Request $request, $invitationId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'interview_type' => 'sometimes|string|in:physical,virtual,phone',
                'interview_date' => 'sometimes|date|after:now',
                'interview_time' => 'sometimes|date_format:H:i',
                'location' => 'nullable|string',
                'meeting_link' => 'nullable|url',
                'phone_number' => 'nullable|string',
                'duration_minutes' => 'sometimes|integer|min:15|max:480',
                'instructions' => 'nullable|string',
                'status' => 'sometimes|string|in:pending,confirmed,cancelled,completed',
            ]);

            $invitation = InterviewInvitation::findOrFail($invitationId);
            $invitation->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Interview invitation updated successfully',
                'data' => $invitation->load(['candidate', 'recruitmentRequest'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update interview invitation:', [
                'invitation_id' => $invitationId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update interview invitation'
            ], 500);
        }
    }

    /**
     * Cancel an interview invitation
     */
    public function cancelInvitation($invitationId): JsonResponse
    {
        try {
            $invitation = InterviewInvitation::findOrFail($invitationId);
            $invitation->update(['status' => 'cancelled']);

            return response()->json([
                'success' => true,
                'message' => 'Interview invitation cancelled successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cancel interview invitation:', [
                'invitation_id' => $invitationId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel interview invitation'
            ], 500);
        }
    }

    /**
     * Send interview invitation email
     */
    private function sendInterviewInvitationEmail(InterviewInvitation $invitation, string $customMessage = ''): void
    {
        try {
            Mail::to($invitation->candidate->email)->send(
                new InterviewInvitationMail($invitation)
            );

            Log::info("Interview invitation email sent successfully", [
                'candidate_id' => $invitation->candidate_id,
                'recruitment_request_id' => $invitation->recruitment_request_id,
                'invitation_id' => $invitation->id
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send interview invitation email", [
                'candidate_id' => $invitation->candidate_id,
                'recruitment_request_id' => $invitation->recruitment_request_id,
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage()
            ]);
            // Don't throw the exception - let the invitation creation succeed even if email fails
        }
    }

    /**
     * Send test invitations to selected candidates
     */
    public function sendTestInvitations(Request $request): JsonResponse
    {
        try {
            // Add debugging
            Log::info('Test invitation request received:', [
                'method' => $request->method(),
                'url' => $request->url(),
                'data' => $request->all()
            ]);

            $validated = $request->validate([
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'candidate_ids' => 'required|array|min:1',
                'candidate_ids.*' => 'exists:candidates,id',
                'existing_test_id' => 'nullable|exists:tests,id',
                'test_data' => 'required_without:existing_test_id|array',
                'test_data.title' => 'required_with:test_data|string|max:255',
                'test_data.instructions' => 'required_with:test_data|string',
                'test_data.time_limit' => 'required_with:test_data|integer|min:1',
                'test_data.pass_score' => 'required_with:test_data|integer|min:0|max:100',
                'test_data.questions' => 'required_with:test_data|array|min:1',
                'test_data.questions.*.question' => 'required_with:test_data|string',
                'test_data.questions.*.type' => 'required_with:test_data|string|in:multiple_choice,true_false,short_answer',
                'test_data.questions.*.options' => 'required_with:test_data|array',
                'test_data.questions.*.correct_answers' => 'required_with:test_data|array',
                'test_data.questions.*.order' => 'required_with:test_data|integer',
                'test_message' => 'nullable|string',
            ]);

            Log::info('Validation passed:', $validated);

            $recruitmentRequest = RecruitmentRequest::findOrFail($validated['recruitment_request_id']);
            $sentCount = 0;
            $failedCandidates = [];

            DB::beginTransaction();

            // Create or use existing test
            if (isset($validated['existing_test_id'])) {
                $test = Test::findOrFail($validated['existing_test_id']);
                Log::info('Using existing test:', ['test_id' => $test->id, 'title' => $test->title]);
            } else {
                // Create a new test
                $testData = $validated['test_data'];
                
                $test = Test::create([
                    'title' => $testData['title'],
                    'instructions' => $testData['instructions'],
                    'time_limit' => $testData['time_limit'],
                    'pass_score' => $testData['pass_score'],
                    'status' => 'active',
                    'created_by' => Auth::id()
                ]);

                Log::info('Created new test:', ['test_id' => $test->id, 'title' => $test->title]);

                // Create questions for the new test
                foreach ($testData['questions'] as $questionData) {
                    TestQuestion::create([
                        'test_id' => $test->id,
                        'question' => $questionData['question'],
                        'type' => $questionData['type'],
                        'options' => json_encode($questionData['options']),
                        'correct_answers' => json_encode($questionData['correct_answers']),
                        'points' => 1,
                        'order_number' => $questionData['order'],
                        'required' => true,
                    ]);
                }
            }

            // Create test assignments for each candidate
            $invitationMessage = $validated['test_message'] ?? "You have been invited to take the test: {$test->title}";
            
            foreach ($validated['candidate_ids'] as $candidateId) {
                try {
                    $candidate = Candidate::findOrFail($candidateId);

                    // Check if assignment already exists
                    $existingAssignment = TestAssignment::where('test_id', $test->id)
                        ->where('candidate_id', $candidateId)
                        ->where('recruitment_request_id', $validated['recruitment_request_id'])
                        ->first();

                    if (!$existingAssignment) {
                        $assignment = TestAssignment::create([
                            'test_id' => $test->id,
                            'candidate_id' => $candidateId,
                            'recruitment_request_id' => $validated['recruitment_request_id'],
                            'status' => 'pending',
                            'assigned_at' => now(),
                            'expires_at' => now()->addDays(7), // 7 days to complete
                            'invitation_message' => $invitationMessage,
                        ]);

                        // Update candidate job application status
                        CandidateJobApplication::where('candidate_id', $candidateId)
                            ->where('recruitment_request_id', $validated['recruitment_request_id'])
                            ->update(['application_status' => 'test_sent']);

                        Log::info('Created test assignment:', [
                            'assignment_id' => $assignment->id,
                            'candidate_id' => $candidateId,
                            'test_id' => $test->id
                        ]);

                        $sentCount++;
                    } else {
                        Log::info('Test assignment already exists:', [
                            'candidate_id' => $candidateId,
                            'test_id' => $test->id
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to create test assignment for candidate {$candidateId}:", [
                        'error' => $e->getMessage()
                    ]);
                    $failedCandidates[] = $candidateId;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully sent {$sentCount} test invitations",
                'data' => [
                    'sent_count' => $sentCount,
                    'failed_candidates' => $failedCandidates,
                    'test_id' => $test->id,
                    'test_title' => $test->title
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to send test invitations:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send test invitations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get test invitations for a recruitment request
     */
    public function getTestInvitations(Request $request): JsonResponse
    {
        try {
            $recruitmentRequestId = $request->get('recruitment_request_id');

            if (!$recruitmentRequestId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request ID is required'
                ], 400);
            }

            $assignments = TestAssignment::with(['candidate', 'test', 'testResult'])
                ->where('recruitment_request_id', $recruitmentRequestId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch test invitations:', [
                'recruitment_request_id' => $request->get('recruitment_request_id'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch test invitations'
            ], 500);
        }
    }

    /**
     * Get available tests that can be reused
     */
    public function getAvailableTests(): JsonResponse
    {
        try {
            $tests = Test::where('status', 'active')
                ->withCount('questions')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($test) {
                    return [
                        'id' => $test->id,
                        'title' => $test->title,
                        'instructions' => $test->instructions,
                        'time_limit' => $test->time_limit,
                        'pass_score' => $test->pass_score,
                        'question_count' => $test->questions_count,
                        'created_at' => $test->created_at->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tests
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch available tests:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available tests'
            ], 500);
        }
    }

    /**
     * Get public job listings (no authentication required)
     * For use in public career board
     */
    public function publicIndex(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 12);
            $search = $request->get('search', '');
            $location = $request->get('location', '');
            $jobType = $request->get('job_type', '');

            $query = RecruitmentRequest::with([
                'jobStructure', 
                'client'
            ])
                ->where('status', 'active')
                ->where('recruitment_period_end', '>=', now());

            // Search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhereHas('jobStructure', function ($subQ) use ($search) {
                          $subQ->where('job_title', 'like', "%{$search}%");
                      })
                      ->orWhereHas('client', function ($subQ) use ($search) {
                          $subQ->where('organisation_name', 'like', "%{$search}%");
                      });
                });
            }

            // Location filter
            if ($location) {
                $query->where('lga', $location);
            }

            // Job type filter (SOL service type)
            if ($jobType) {
                $query->where('sol_service_type', $jobType);
            }

            $jobs = $query->orderBy('priority_level', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $jobs
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch public jobs:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job listings'
            ], 500);
        }
    }

    /**
     * Get single job details (no authentication required)
     * For use in public career board
     */
    public function publicShow(Request $request, string $ticketId): JsonResponse
    {
        try {
            $job = RecruitmentRequest::with([
                'jobStructure',
                'client'
            ])
                ->where('ticket_id', $ticketId)
                ->where('status', 'active')
                ->where('recruitment_period_end', '>=', now())
                ->first();

            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found or no longer available'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $job
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch public job details:', [
                'ticket_id' => $ticketId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job details'
            ], 500);
        }
    }
}
