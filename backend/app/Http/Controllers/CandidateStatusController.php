<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\Recruitment\TestAssignment;
use App\Models\InterviewInvitation;
use App\Models\Candidate;
use Illuminate\Support\Facades\DB;

class CandidateStatusController extends Controller
{
    /**
     * Get comprehensive status history for a candidate
     */
    public function getCandidateStatusHistory(Request $request, $candidateId)
    {
        try {
            $recruitmentRequestId = $request->query('recruitment_request_id');
            
            if (!$recruitmentRequestId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request ID is required'
                ], 400);
            }

            // Get candidate basic info
            $candidate = Candidate::find($candidateId);
            if (!$candidate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found'
                ], 404);
            }

            // Get application status
            $application = CandidateJobApplication::where('candidate_id', $candidateId)
                ->where('recruitment_request_id', $recruitmentRequestId)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found for this candidate and position'
                ], 404);
            }

            // Get test assignment status
            $testAssignment = TestAssignment::where('candidate_id', $candidateId)
                ->where('recruitment_request_id', $recruitmentRequestId)
                ->latest()
                ->first();

            // Get interview invitation status
            $interviewInvitation = InterviewInvitation::where('candidate_id', $candidateId)
                ->where('recruitment_request_id', $recruitmentRequestId)
                ->latest()
                ->first();

            // Compile comprehensive status
            $statusHistory = [
                'candidate_id' => $candidateId,
                'candidate_name' => $candidate->first_name . ' ' . $candidate->last_name,
                'recruitment_request_id' => $recruitmentRequestId,
                'application_status' => $application->application_status,
                'applied_at' => $application->created_at,
                'test_assignment' => $testAssignment ? [
                    'id' => $testAssignment->id,
                    'status' => $testAssignment->status,
                    'sent_at' => $testAssignment->created_at,
                    'completed_at' => $testAssignment->completed_at,
                    'expires_at' => $testAssignment->expires_at,
                    'score' => $testAssignment->score_percentage ?? null,
                    'passed' => $testAssignment->passed ?? null
                ] : null,
                'interview_invitation' => $interviewInvitation ? [
                    'id' => $interviewInvitation->id,
                    'status' => $interviewInvitation->status,
                    'interview_type' => $interviewInvitation->interview_type,
                    'sent_at' => $interviewInvitation->created_at,
                    'interview_date' => $interviewInvitation->interview_date,
                    'interview_time' => $interviewInvitation->interview_time,
                    'location' => $interviewInvitation->location,
                    'message' => $interviewInvitation->message,
                    'candidate_response' => $interviewInvitation->candidate_response,
                    'responded_at' => $interviewInvitation->responded_at
                ] : null
            ];

            return response()->json([
                'success' => true,
                'data' => $statusHistory,
                'message' => 'Candidate status history retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve candidate status history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get status summary for multiple candidates
     */
    public function getCandidatesStatusSummary(Request $request)
    {
        try {
            $recruitmentRequestId = $request->query('recruitment_request_id');
            
            if (!$recruitmentRequestId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request ID is required'
                ], 400);
            }

            // Get all applications for this recruitment request
            $candidatesSummary = DB::table('candidate_job_applications as ca')
                ->leftJoin('candidates as c', 'ca.candidate_id', '=', 'c.id')
                ->leftJoin('test_assignments as ta', function($join) use ($recruitmentRequestId) {
                    $join->on('ca.candidate_id', '=', 'ta.candidate_id')
                         ->where('ta.recruitment_request_id', '=', $recruitmentRequestId);
                })
                ->leftJoin('test_results as tr', 'ta.id', '=', 'tr.test_assignment_id')
                ->leftJoin('interview_invitations as ii', function($join) use ($recruitmentRequestId) {
                    $join->on('ca.candidate_id', '=', 'ii.candidate_id')
                         ->where('ii.recruitment_request_id', '=', $recruitmentRequestId);
                })
                ->select([
                    'ca.candidate_id',
                    'c.first_name',
                    'c.last_name',
                    'c.email',
                    'ca.application_status',
                    'ca.created_at as applied_at',
                    'ta.id as test_assignment_id',
                    'ta.status as test_status',
                    'ta.created_at as test_sent_at',
                    'ta.completed_at as test_completed_at',
                    'tr.score_percentage as test_score',
                    'ii.id as interview_invitation_id',
                    'ii.status as interview_status',
                    'ii.interview_type',
                    'ii.created_at as interview_sent_at',
                    'ii.interview_date'
                ])
                ->where('ca.recruitment_request_id', $recruitmentRequestId)
                ->orderBy('ca.created_at', 'desc')
                ->get()
                ->map(function($row) {
                    return [
                        'candidate_id' => $row->candidate_id,
                        'candidate_name' => $row->first_name . ' ' . $row->last_name,
                        'email' => $row->email,
                        'application_status' => $row->application_status,
                        'applied_at' => $row->applied_at,
                        'has_test' => !is_null($row->test_assignment_id),
                        'test_status' => $row->test_status,
                        'test_sent_at' => $row->test_sent_at,
                        'test_completed_at' => $row->test_completed_at,
                        'test_score' => $row->test_score,
                        'has_interview' => !is_null($row->interview_invitation_id),
                        'interview_status' => $row->interview_status,
                        'interview_type' => $row->interview_type,
                        'interview_sent_at' => $row->interview_sent_at,
                        'interview_date' => $row->interview_date,
                        'can_send_test' => is_null($row->test_assignment_id) || 
                                         in_array($row->test_status, ['expired', 'cancelled']),
                        'can_send_interview' => $row->test_status === 'completed' && 
                                              (is_null($row->interview_invitation_id) || 
                                               in_array($row->interview_status, ['declined', 'cancelled']))
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $candidatesSummary,
                'message' => 'Candidates status summary retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve candidates status summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
