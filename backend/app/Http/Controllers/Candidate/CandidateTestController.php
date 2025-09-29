<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Recruitment\Test;
use App\Models\Recruitment\TestAssignment;
use App\Models\Recruitment\TestResult;
use App\Models\Recruitment\TestQuestion;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\Recruitment\RecruitmentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CandidateTestController extends Controller
{
    /**
     * Get candidate ID from authenticated user
     */
    private function getCandidateId(Request $request): ?int
    {
        $user = Auth::user();
        
        if ($user && $user->user_type === 'candidate') {
            return $user->profile_id;
        }
        
        // Fallback to request parameter
        return $request->candidate_id ?? null;
    }

    /**
     * Get available tests for the authenticated candidate
     */
    public function getAvailableTests(Request $request): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);
            
            Log::info('getAvailableTests called', ['candidate_id' => $candidateId]);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            $assignments = TestAssignment::with(['test', 'recruitmentRequest.jobStructure'])
            ->where('candidate_id', $candidateId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('assigned_at', 'desc')
            ->get();

            Log::info('Test assignments query result', ['count' => $assignments->count()]);

            // Add expiration status to each assignment
            $assignments = $assignments->map(function($assignment) {
                $assignment->is_expired = $assignment->expires_at && Carbon::parse($assignment->expires_at)->isPast();
                return $assignment;
            });

            Log::info('Test assignments with expiration', ['assignments' => $assignments->toArray()]);

            return response()->json([
                'success' => true,
                'data' => $assignments,
                'message' => 'Available tests retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('getAvailableTests error', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available tests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a test assignment
     */
    public function startTest(Request $request, $assignmentId): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            $assignment = TestAssignment::with('test.questions')
                                       ->where('id', $assignmentId)
                                       ->where('candidate_id', $candidateId)
                                       ->firstOrFail();

            // Check if assignment is still valid
            if ($assignment->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Test has already been completed'
                ], 422);
            }

            if ($assignment->status === 'expired' || $assignment->is_expired) {
                return response()->json([
                    'success' => false,
                    'message' => 'Test assignment has expired'
                ], 422);
            }

            // Start the assignment if it's pending
            if ($assignment->status === 'pending') {
                $assignment->startTest();
            }

            // Prepare test data for candidate (without correct answers)
            $testData = [
                'assignment_id' => $assignment->id,
                'test' => [
                    'id' => $assignment->test->id,
                    'title' => $assignment->test->title,
                    'description' => $assignment->test->description,
                    'instructions' => $assignment->test->instructions,
                    'time_limit' => $assignment->test->time_limit, // minutes
                    'total_questions' => $assignment->test->questions->count(),
                    'randomize_questions' => $assignment->test->randomize_questions,
                ],
                'questions' => $assignment->test->questions->map(function($question) {
                    return [
                        'id' => $question->id,
                        'question_text' => $question->question,
                        'question_type' => $question->type,
                        'options' => $question->options,
                        'points' => $question->points,
                        'order_number' => $question->order_number,
                        'is_required' => $question->required,
                        // Don't include correct_answer or explanation
                    ];
                }),
                'time_remaining_minutes' => $assignment->test->time_limit,
                'started_at' => $assignment->started_at,
                'expires_at' => $assignment->expires_at,
            ];

            return response()->json([
                'success' => true,
                'data' => $testData,
                'message' => 'Test started successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit test answers
     */
    public function submitTest(Request $request, $assignmentId): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            $assignment = TestAssignment::with('test.questions')
                                       ->where('id', $assignmentId)
                                       ->where('candidate_id', $candidateId)
                                       ->firstOrFail();

            // Validate that test can be submitted
            if ($assignment->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Test has already been submitted'
                ], 422);
            }

            if ($assignment->status !== 'in_progress') {
                return response()->json([
                    'success' => false,
                    'message' => 'Test is not in progress'
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'answers' => 'required|array',
                'answers.*' => 'nullable|string',
                'auto_submitted' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Calculate time taken in minutes
            $timeTaken = $assignment->started_at ? 
                        now()->diffInMinutes($assignment->started_at) : 
                        0;

            // Get total questions for this test
            $totalQuestions = TestQuestion::where('test_id', $assignment->test->id)->count();
            
            // Calculate correct answers count
            $questions = TestQuestion::where('test_id', $assignment->test->id)->get();
            $correctCount = 0;
            
            foreach ($questions as $question) {
                $candidateAnswer = $request->answers[$question->id] ?? null;
                if ($candidateAnswer !== null) {
                    $correctAnswers = is_array($question->correct_answers) 
                        ? $question->correct_answers 
                        : json_decode($question->correct_answers, true);
                    
                    // Handle both letter format (A,B,C,D) and numeric format (0,1,2,3)
                    $correctAnswer = $correctAnswers[0] ?? null;
                    if (is_string($correctAnswer) && in_array($correctAnswer, ['A', 'B', 'C', 'D'])) {
                        $correctAnswer = array_search($correctAnswer, ['A', 'B', 'C', 'D']);
                    }
                    
                    if ((int)$candidateAnswer === (int)$correctAnswer) {
                        $correctCount++;
                    }
                }
            }
            
            // Calculate score percentage
            $scorePercentage = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100, 2) : 0;
            
            // Create test result
            $testResult = TestResult::create([
                'test_assignment_id' => $assignment->id,
                'test_id' => $assignment->test->id,
                'candidate_id' => $assignment->candidate_id,
                'answers' => $request->answers,
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctCount,
                'score_percentage' => $scorePercentage,
                'time_taken' => $timeTaken, // Time in minutes
                'started_at' => $assignment->started_at ?: now(),
                'completed_at' => now(),
            ]);

            // Calculate scores using the dedicated method
            $testResult->calculateScores();

            // Complete the assignment
            $assignment->completeTest();

            // Update job application status if exists
            if ($assignment->recruitment_request_id) {
                $jobApplication = CandidateJobApplication::where('candidate_id', $candidateId)
                                                        ->where('recruitment_request_id', $assignment->recruitment_request_id)
                                                        ->first();

                if ($jobApplication) {
                    $jobApplication->updateStatus('test_completed', 'Test completed with score: ' . $testResult->score_percentage . '%');
                }
            }

            DB::commit();

            // Prepare response data
            $responseData = [
                'result_id' => $testResult->id,
                'score_percentage' => $testResult->score_percentage,
                'total_questions' => $testResult->total_questions,
                'correct_answers' => $testResult->correct_answers,
                'passed' => $testResult->passed,
                'grade' => $testResult->grade,
                'performance_level' => $testResult->performance_level,
                'time_taken_minutes' => $testResult->time_taken_minutes,
                'submitted_at' => $testResult->submitted_at,
            ];

            // Include detailed answers if test allows review
            if ($assignment->test->allow_review) {
                $responseData['answer_analysis'] = $testResult->answer_analysis;
            }

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Test submitted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get test results for candidate
     */
    public function getTestResults(Request $request): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            $results = TestResult::with([
                'test:id,title,description,pass_score',
                'assignment.recruitmentRequest:id,ticket_id'
            ])
            ->where('candidate_id', $candidateId)
            ->orderBy('completed_at', 'desc')
            ->get();

            $formattedResults = $results->map(function($result) {
                return [
                    'id' => $result->id,
                    'test' => [
                        'title' => $result->test->title,
                        'description' => $result->test->description,
                        'pass_score' => $result->test->pass_score_percentage,
                    ],
                    'recruitment_request' => $result->assignment->recruitmentRequest ? [
                        'number' => $result->assignment->recruitmentRequest->recruitment_request_number,
                        'job_title' => $result->assignment->recruitmentRequest->job_title,
                    ] : null,
                    'score_percentage' => $result->score_percentage,
                    'total_questions' => $result->total_questions,
                    'correct_answers' => $result->correct_answers,
                    'passed' => $result->passed,
                    'grade' => $result->grade,
                    'performance_level' => $result->performance_level,
                    'time_taken_minutes' => $result->time_taken_minutes,
                    'submitted_at' => $result->submitted_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedResults,
                'message' => 'Test results retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve test results',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed test result with review (if allowed)
     */
    public function getTestResult(Request $request, $resultId): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            $result = TestResult::with([
                'test.questions',
                'assignment.recruitmentRequest'
            ])
            ->where('id', $resultId)
            ->where('candidate_id', $candidateId)
            ->firstOrFail();

            $responseData = [
                'id' => $result->id,
                'test' => [
                    'title' => $result->test->title,
                    'description' => $result->test->description,
                    'allow_review' => $result->test->allow_review,
                ],
                'score_percentage' => $result->score_percentage,
                'total_questions' => $result->total_questions,
                'correct_answers' => $result->correct_answers,
                'passed' => $result->passed,
                'grade' => $result->grade,
                'performance_level' => $result->performance_level,
                'time_taken_minutes' => $result->time_taken_minutes,
                'submitted_at' => $result->submitted_at,
            ];

            // Include detailed review if allowed
            if ($result->test->allow_review) {
                $responseData['answer_analysis'] = $result->answer_analysis;
            }

            return response()->json([
                'success' => true,
                'data' => $responseData,
                'message' => 'Test result retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test result not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Get available job positions for application
     */
    public function getAvailableJobs(Request $request): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate ID not found. Please ensure you are logged in as a candidate.'
                ], 400);
            }

            // Get active recruitment requests that candidate hasn't applied to
            $jobs = RecruitmentRequest::with(['client:id,organisation_name,client_name'])
                                     ->where('status', 'active')
                                     ->whereNotIn('id', function($query) use ($candidateId) {
                                         $query->select('recruitment_request_id')
                                               ->from('candidate_job_applications')
                                               ->where('candidate_id', $candidateId);
                                     })
                                     ->orderBy('created_at', 'desc')
                                     ->get();

            return response()->json([
                'success' => true,
                'data' => $jobs,
                'message' => 'Available jobs retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available jobs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply for a job position
     */
    public function applyForJob(Request $request): JsonResponse
    {
        try {
            $candidateId = Auth::user()->candidate_id ?? $request->candidate_id;

            $validator = Validator::make($request->all(), [
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'cover_letter' => 'nullable|string',
                'salary_expectations' => 'nullable|array',
                'salary_expectations.min' => 'nullable|numeric',
                'salary_expectations.max' => 'nullable|numeric',
                'salary_expectations.currency' => 'nullable|string',
                'motivation' => 'nullable|string',
                'availability' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if already applied
            $existingApplication = CandidateJobApplication::where('candidate_id', $candidateId)
                                                         ->where('recruitment_request_id', $request->recruitment_request_id)
                                                         ->first();

            if ($existingApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already applied for this position'
                ], 422);
            }

            // Create job application
            $application = CandidateJobApplication::create([
                'candidate_id' => $candidateId,
                'recruitment_request_id' => $request->recruitment_request_id,
                'application_status' => 'applied',
                'cover_letter' => $request->cover_letter,
                'salary_expectations' => $request->salary_expectations,
                'motivation' => $request->motivation,
                'availability' => $request->availability,
                'applied_at' => now(),
            ]);

            // Check eligibility criteria
            $application->checkAllCriteria();

            return response()->json([
                'success' => true,
                'data' => $application,
                'message' => 'Job application submitted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit job application',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
