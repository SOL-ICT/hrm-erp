<?php

namespace App\Http\Controllers;

use App\Models\ClientInterview;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\RecruitmentApplication;
use App\Models\Client;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class ClientInterviewController extends Controller
{
    /**
     * Get active tickets with their candidates for client interview invitation
     */
    public function getActiveTicketsWithCandidates()
    {
        try {
            // Cache key for active tickets with candidates
            $cacheKey = 'recruitment:active_tickets_with_candidates';
            $cacheTTL = 900; // 15 minutes

            // Try to get from cache first
            $formattedData = Cache::remember($cacheKey, $cacheTTL, function () {
                $ticketsWithCandidates = DB::table('recruitment_requests as rr')
                    ->join('candidate_job_applications as cja', 'rr.id', '=', 'cja.recruitment_request_id')
                    ->join('candidates as c', 'cja.candidate_id', '=', 'c.id')
                    ->join('clients as cl', 'rr.client_id', '=', 'cl.id')
                    ->join('job_structures as js', 'rr.job_structure_id', '=', 'js.id')
                    ->select(
                        'rr.id as recruitment_request_id',
                        'rr.ticket_id',
                        'rr.description',
                        'rr.number_of_vacancies',
                        'cl.organisation_name as client_name',
                        'js.job_title as position_title',
                        'c.id as candidate_id',
                        DB::raw('CONCAT(c.first_name, " ", c.last_name) as candidate_name'),
                        'c.email as candidate_email',
                        'c.phone as candidate_phone',
                        'cja.application_status',
                        'cja.applied_at'
                    )
                    ->where('rr.status', 'active')
                    ->whereIn('cja.application_status', ['under_review', 'interview_scheduled', 'interview_completed', 'applied'])
                    ->orderBy('rr.ticket_id')
                    ->orderBy('c.first_name')
                    ->get()
                    ->groupBy('ticket_id');

                // Format the response to group candidates under tickets
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
                                'applied_at' => $candidate->applied_at
                            ];
                        })->toArray()
                    ];
                }
                
                return $formattedData;
            });

            return response()->json([
                'success' => true,
                'data' => $formattedData,
                'message' => 'Active tickets with candidates retrieved successfully',
                'cached' => Cache::has($cacheKey)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client interviews: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get clients dropdown data
     */
    public function getClientsDropdown()
    {
        try {
            // Cache key for clients dropdown
            $cacheKey = 'recruitment:clients_dropdown';
            $cacheTTL = 1800; // 30 minutes

            $clients = Cache::remember($cacheKey, $cacheTTL, function () {
                return Client::select('id', 'organisation_name', 'phone')
                    ->where('status', 'active')
                    ->orderBy('organisation_name')
                    ->get();
            });

            return response()->json([
                'success' => true,
                'data' => $clients,
                'message' => 'Clients retrieved successfully',
                'cached' => Cache::has($cacheKey)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of client interviews
     */
    public function index()
    {
        try {
            $interviews = ClientInterview::with(['candidate', 'client', 'recruitmentRequest'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $interviews,
                'message' => 'Client interviews retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client interviews: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created client interview
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'recruitment_request_id' => 'required|exists:recruitment_requests,id',
            'candidate_id' => 'required|exists:candidates,id',
            'client_id' => 'required|exists:clients,id',
            'interview_type' => 'required|in:physical,online',
            'interview_date' => 'required|date|after_or_equal:today',
            'interview_time' => 'required|date_format:H:i',
            'contact_person' => 'required_if:interview_type,physical|string|max:255',
            'contact_person_phone' => 'required_if:interview_type,physical|string|max:20',
            'location' => 'required_if:interview_type,physical|string|max:500',
            'meeting_link' => 'required_if:interview_type,online|url|max:1000',
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $interviewData = $request->only([
                'recruitment_request_id', 'candidate_id', 'client_id',
                'interview_type', 'interview_date', 'interview_time',
                'contact_person', 'contact_person_phone', 'location',
                'meeting_link', 'notes'
            ]);

            $interviewData['status'] = 'scheduled';
            $interviewData['created_by'] = Auth::id();

            // Clear fields based on interview type
            if ($request->interview_type === 'online') {
                $interviewData['contact_person'] = null;
                $interviewData['contact_person_phone'] = null;
                $interviewData['location'] = null;
            } else {
                $interviewData['meeting_link'] = null;
            }

            $clientInterview = ClientInterview::create($interviewData);
            $clientInterview->load(['candidate', 'client', 'recruitmentRequest']);

            // Invalidate related caches
            $this->invalidateRecruitmentCaches();

            return response()->json([
                'success' => true,
                'data' => $clientInterview,
                'message' => 'Client interview scheduled successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule client interview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified client interview
     */
    public function show($id)
    {
        try {
            $clientInterview = ClientInterview::with(['candidate', 'client', 'recruitmentRequest'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $clientInterview,
                'message' => 'Client interview retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client interview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update client interview
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'interview_type' => 'sometimes|in:physical,online',
            'interview_date' => 'sometimes|date|after_or_equal:today',
            'interview_time' => 'sometimes|date_format:H:i',
            'contact_person' => 'required_if:interview_type,physical|string|max:255',
            'contact_person_phone' => 'required_if:interview_type,physical|string|max:20',
            'location' => 'required_if:interview_type,physical|string|max:500',
            'meeting_link' => 'required_if:interview_type,online|url|max:1000',
            'status' => 'sometimes|in:scheduled,completed,cancelled,rescheduled',
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clientInterview = ClientInterview::findOrFail($id);
            
            $updateData = $request->only([
                'interview_type', 'interview_date', 'interview_time', 
                'contact_person', 'contact_person_phone', 'location', 
                'meeting_link', 'status', 'notes'
            ]);

            // Clear fields based on interview type
            if ($request->has('interview_type')) {
                if ($request->interview_type === 'online') {
                    $updateData['contact_person'] = null;
                    $updateData['contact_person_phone'] = null;
                    $updateData['location'] = null;
                } else {
                    $updateData['meeting_link'] = null;
                }
            }

            $clientInterview->update($updateData);
            $clientInterview->load(['candidate', 'client', 'recruitmentRequest']);

            return response()->json([
                'success' => true,
                'data' => $clientInterview,
                'message' => 'Client interview updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client interview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete client interview
     */
    public function destroy($id)
    {
        try {
            $clientInterview = ClientInterview::findOrFail($id);
            $clientInterview->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client interview deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client interview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Invalidate recruitment-related caches
     */
    private function invalidateRecruitmentCaches()
    {
        $cacheKeys = [
            'recruitment:active_tickets_with_candidates',
            'recruitment:clients_dropdown',
            'recruitment:tickets_grouped_by_status',
            'recruitment:interviews_list'
        ];

        foreach ($cacheKeys as $key) {
            Cache::forget($key);
        }

        // Also clear any pattern-based cache keys
        $redis = Redis::connection();
        $keys = $redis->keys('recruitment:*');
        if (!empty($keys)) {
            $redis->del($keys);
        }
    }
}