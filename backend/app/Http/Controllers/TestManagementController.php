<?php

namespace App\Http\Controllers;

use App\Models\Recruitment\Test;
use App\Models\Recruitment\TestQuestion;
use App\Models\Recruitment\TestAssignment;
use App\Models\Recruitment\TestResult;
use App\Models\Candidate;
use App\Models\Recruitment\RecruitmentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TestManagementController extends Controller
{
    /**
     * Get all tests with statistics
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Test::with(['creator', 'questions'])
                        ->withCount(['assignments', 'results']);
            
            // Apply filters
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            
            if ($request->filled('search')) {
                $query->where('title', 'like', '%' . $request->search . '%');
            }
            
            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            $tests = $query->paginate($request->get('per_page', 15));
            
            // Add calculated fields
            $tests->getCollection()->transform(function ($test) {
                return [
                    'id' => $test->id,
                    'title' => $test->title,
                    'description' => $test->description,
                    'status' => $test->status,
                    'time_limit' => $test->time_limit,
                    'pass_score' => $test->pass_score,
                    'total_questions' => $test->total_questions,
                    'assignments_count' => $test->assignments_count,
                    'results_count' => $test->results_count,
                    'average_score' => $test->average_score,
                    'pass_rate' => $test->pass_rate,
                    'times_used' => $test->times_used,
                    'created_by' => $test->creator->name ?? 'Unknown',
                    'created_at' => $test->created_at,
                    'updated_at' => $test->updated_at,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $tests,
                'message' => 'Tests retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new test
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'instructions' => 'nullable|string',
                'time_limit' => 'required|integer|min:1|max:300',
                'pass_score' => 'required|numeric|min:0|max:100',
                'randomize_questions' => 'boolean',
                'show_results_immediately' => 'boolean',
                'allow_retake' => 'boolean',
                'max_attempts' => 'required|integer|min:1|max:10',
                'questions' => 'required|array|min:1',
                'questions.*.question' => 'required|string',
                'questions.*.type' => 'required|in:multiple_choice,true_false,short_answer',
                'questions.*.options' => 'required_if:questions.*.type,multiple_choice|array',
                'questions.*.correct_answers' => 'required|array',
                'questions.*.points' => 'required|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Create the test
            $test = Test::create([
                'title' => $request->title,
                'description' => $request->description,
                'instructions' => $request->instructions,
                'time_limit' => $request->time_limit,
                'pass_score' => $request->pass_score,
                'randomize_questions' => $request->randomize_questions ?? false,
                'show_results_immediately' => $request->show_results_immediately ?? true,
                'allow_retake' => $request->allow_retake ?? false,
                'max_attempts' => $request->max_attempts,
                'created_by' => Auth::id(),
                'status' => 'draft',
            ]);

            // Create the questions
            foreach ($request->questions as $index => $questionData) {
                TestQuestion::create([
                    'test_id' => $test->id,
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'options' => $questionData['options'] ?? null,
                    'correct_answers' => $questionData['correct_answers'],
                    'points' => $questionData['points'],
                    'order_number' => $index + 1,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $test->load(['questions', 'creator']),
                'message' => 'Test created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific test with questions
     */
    public function show($id): JsonResponse
    {
        try {
            $test = Test::with(['questions', 'creator', 'assignments.candidate', 'results.candidate'])
                       ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $test,
                'message' => 'Test retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update a test
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $test = Test::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'string|max:255',
                'description' => 'nullable|string',
                'instructions' => 'nullable|string',
                'time_limit' => 'integer|min:1|max:300',
                'pass_score' => 'numeric|min:0|max:100',
                'status' => 'in:draft,active,archived',
                'randomize_questions' => 'boolean',
                'show_results_immediately' => 'boolean',
                'allow_retake' => 'boolean',
                'max_attempts' => 'integer|min:1|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $test->update($request->only([
                'title', 'description', 'instructions', 'time_limit', 'pass_score',
                'status', 'randomize_questions', 'show_results_immediately',
                'allow_retake', 'max_attempts'
            ]));

            return response()->json([
                'success' => true,
                'data' => $test->load(['questions', 'creator']),
                'message' => 'Test updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a test
     */
    public function destroy($id): JsonResponse
    {
        try {
            $test = Test::findOrFail($id);

            // Check if test has any assignments
            if ($test->assignments()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete test with existing assignments'
                ], 422);
            }

            $test->delete();

            return response()->json([
                'success' => true,
                'message' => 'Test deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get test questions for management
     */
    public function getTestQuestions($id): JsonResponse
    {
        try {
            $test = Test::with(['questions' => function($query) {
                $query->orderBy('order_number');
            }])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $test->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'options' => $question->options,
                        'correct_answers' => $question->correct_answers,
                        'points' => $question->points,
                        'order_number' => $question->order_number,
                    ];
                }),
                'test' => [
                    'id' => $test->id,
                    'title' => $test->title,
                    'description' => $test->description,
                    'time_limit' => $test->time_limit,
                    'pass_score' => $test->pass_score,
                    'status' => $test->status,
                ],
                'message' => 'Test questions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update test questions
     */
    public function updateTestQuestions(Request $request, $id): JsonResponse
    {
        try {
            $test = Test::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'questions' => 'required|array|min:1',
                'questions.*.question' => 'required|string',
                'questions.*.type' => 'required|in:multiple_choice,true_false,short_answer',
                'questions.*.options' => 'nullable|array',
                'questions.*.correct_answers' => 'required|array',
                'questions.*.points' => 'required|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Delete existing questions
            $test->questions()->delete();

            // Create new questions
            foreach ($request->questions as $index => $questionData) {
                TestQuestion::create([
                    'test_id' => $test->id,
                    'question' => $questionData['question'],
                    'type' => $questionData['type'],
                    'options' => $questionData['options'] ?? null,
                    'correct_answers' => $questionData['correct_answers'],
                    'points' => $questionData['points'],
                    'order_number' => $index + 1,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Test questions updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update test questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign test to candidates
     */
    public function assignTest(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'test_id' => 'required|exists:tests,id',
                'candidate_ids' => 'required|array',
                'candidate_ids.*' => 'exists:candidates,id',
                'recruitment_request_id' => 'nullable|exists:recruitment_requests,id',
                'expires_in_days' => 'required|integer|min:1|max:30',
                'invitation_message' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $test = Test::findOrFail($request->test_id);
            $assignedCount = 0;
            $errors = [];

            foreach ($request->candidate_ids as $candidateId) {
                try {
                    // Check if assignment already exists
                    $existingAssignment = TestAssignment::where([
                        'test_id' => $request->test_id,
                        'candidate_id' => $candidateId,
                        'recruitment_request_id' => $request->recruitment_request_id,
                    ])->first();

                    if ($existingAssignment) {
                        $errors[] = "Test already assigned to candidate ID: {$candidateId}";
                        continue;
                    }

                    TestAssignment::create([
                        'test_id' => $request->test_id,
                        'candidate_id' => $candidateId,
                        'recruitment_request_id' => $request->recruitment_request_id,
                        'assigned_at' => Carbon::now(),
                        'expires_at' => Carbon::now()->addDays($request->expires_in_days),
                        'invitation_message' => $request->invitation_message,
                    ]);

                    $assignedCount++;

                } catch (\Exception $e) {
                    $errors[] = "Failed to assign test to candidate ID: {$candidateId} - " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => $assignedCount > 0,
                'data' => [
                    'assigned_count' => $assignedCount,
                    'total_requested' => count($request->candidate_ids),
                    'errors' => $errors
                ],
                'message' => "Test assigned to {$assignedCount} candidates"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get test results with filtering
     */
    public function getResults(Request $request): JsonResponse
    {
        try {
            $query = TestResult::with(['candidate', 'test', 'assignment.recruitmentRequest']);

            // Apply filters
            if ($request->filled('test_id')) {
                $query->where('test_id', $request->test_id);
            }

            if ($request->filled('recruitment_request_id')) {
                $query->whereHas('assignment', function ($q) use ($request) {
                    $q->where('recruitment_request_id', $request->recruitment_request_id);
                });
            }

            if ($request->filled('result_status')) {
                $query->where('result_status', $request->result_status);
            }

            if ($request->filled('min_score')) {
                $query->where('score_percentage', '>=', $request->min_score);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'completed_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $results = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $results,
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
     * Get test statistics
     */
    public function getStatistics($testId): JsonResponse
    {
        try {
            $test = Test::findOrFail($testId);
            $results = $test->results();

            $statistics = [
                'test_info' => [
                    'id' => $test->id,
                    'title' => $test->title,
                    'total_questions' => $test->total_questions,
                    'pass_score' => $test->pass_score,
                ],
                'assignments' => [
                    'total' => $test->assignments()->count(),
                    'pending' => $test->assignments()->pending()->count(),
                    'completed' => $test->assignments()->completed()->count(),
                    'expired' => $test->assignments()->expired()->count(),
                ],
                'results' => [
                    'total' => $results->count(),
                    'passed' => $results->passed()->count(),
                    'failed' => $results->failed()->count(),
                    'average_score' => round($results->avg('score_percentage'), 2),
                    'highest_score' => $results->max('score_percentage'),
                    'lowest_score' => $results->min('score_percentage'),
                    'pass_rate' => $test->pass_rate,
                ],
                'score_distribution' => [
                    '90-100' => $results->where('score_percentage', '>=', 90)->count(),
                    '80-89' => $results->whereBetween('score_percentage', [80, 89])->count(),
                    '70-79' => $results->whereBetween('score_percentage', [70, 79])->count(),
                    '60-69' => $results->whereBetween('score_percentage', [60, 69])->count(),
                    '0-59' => $results->where('score_percentage', '<', 60)->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics,
                'message' => 'Test statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve test statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overall test management statistics
     */
    public function getOverallStatistics(): JsonResponse
    {
        try {
            $totalTests = Test::count();
            $activeTests = Test::where('status', 'active')->count();
            $draftTests = Test::where('status', 'draft')->count();
            $archivedTests = Test::where('status', 'archived')->count();
            
            $totalAssignments = TestAssignment::count();
            $completedAssignments = TestAssignment::where('status', 'completed')->count();
            $pendingAssignments = TestAssignment::where('status', 'pending')->count();
            $inProgressAssignments = TestAssignment::where('status', 'in_progress')->count();
            
            $totalResults = TestResult::count();
            $averageScore = TestResult::avg('score_percentage') ?? 0;
            $passedResults = TestResult::where('passed', true)->count();
            
            // Get active tickets (recruitment requests) with test assignments
            $activeTickets = RecruitmentRequest::where('status', 'active')
                ->whereHas('testAssignments')
                ->with(['testAssignments.test', 'testAssignments.candidate'])
                ->get();

            $statistics = [
                'tests' => [
                    'total' => $totalTests,
                    'active' => $activeTests,
                    'draft' => $draftTests,
                    'archived' => $archivedTests,
                ],
                'assignments' => [
                    'total' => $totalAssignments,
                    'completed' => $completedAssignments,
                    'pending' => $pendingAssignments,
                    'in_progress' => $inProgressAssignments,
                ],
                'results' => [
                    'total' => $totalResults,
                    'average_score' => round($averageScore, 2),
                    'passed' => $passedResults,
                    'pass_rate' => $totalResults > 0 ? round(($passedResults / $totalResults) * 100, 2) : 0,
                ],
                'tickets' => $activeTickets->map(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'ticket_id' => $ticket->ticket_id,
                        'job_title' => $ticket->jobStructure->job_title ?? 'Unknown',
                        'test_assignments_count' => $ticket->testAssignments->count(),
                        'completed_tests' => $ticket->testAssignments->where('status', 'completed')->count(),
                        'pending_tests' => $ticket->testAssignments->where('status', 'pending')->count(),
                    ];
                }),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics,
                'message' => 'Overall test statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve overall test statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a single question for a test
     */
    public function createSingleQuestion(Request $request, $testId): JsonResponse
    {
        try {
            $test = Test::findOrFail($testId);

            $validator = Validator::make($request->all(), [
                'question' => 'required|string|max:1000',
                'type' => 'required|in:multiple_choice,true_false,short_answer',
                'options' => 'nullable|array|min:2|max:6',
                'options.*' => 'required_with:options|string|max:500',
                'correct_answers' => 'required|array|min:1',
                'points' => 'required|numeric|min:0.1|max:100',
                'order_number' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get the next order number if not provided
            $orderNumber = $request->order_number ?? ($test->questions()->max('order_number') + 1);

            $question = TestQuestion::create([
                'test_id' => $testId,
                'question' => $request->question,
                'type' => $request->type,
                'options' => $request->type === 'multiple_choice' ? $request->options : null,
                'correct_answers' => $request->correct_answers,
                'points' => $request->points,
                'order_number' => $orderNumber,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type,
                    'options' => $question->options,
                    'correct_answers' => $question->correct_answers,
                    'points' => $question->points,
                    'order_number' => $question->order_number,
                ],
                'message' => 'Question created successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a single question
     */
    public function updateSingleQuestion(Request $request, $testId, $questionId): JsonResponse
    {
        try {
            $test = Test::findOrFail($testId);
            $question = TestQuestion::where('test_id', $testId)->findOrFail($questionId);

            // Debug logging
            Log::info('Question update request data:', $request->all());

            $validator = Validator::make($request->all(), [
                'question' => 'required|string|max:1000',
                'type' => 'required|in:multiple_choice,true_false,short_answer',
                'options' => 'nullable|array|min:2|max:6',
                'options.*' => 'required_with:options|string|max:500',
                'correct_answers' => 'required|array|min:1',
                'points' => 'required|numeric|min:0.1|max:100',
                'order_number' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $question->update([
                'question' => $request->question,
                'type' => $request->type,
                'options' => $request->type === 'multiple_choice' ? $request->options : null,
                'correct_answers' => $request->correct_answers,
                'points' => $request->points,
                'order_number' => $request->order_number ?? $question->order_number,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type,
                    'options' => $question->options,
                    'correct_answers' => $question->correct_answers,
                    'points' => $question->points,
                    'order_number' => $question->order_number,
                ],
                'message' => 'Question updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single question
     */
    public function deleteSingleQuestion($testId, $questionId): JsonResponse
    {
        try {
            $test = Test::findOrFail($testId);
            $question = TestQuestion::where('test_id', $testId)->findOrFail($questionId);

            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
