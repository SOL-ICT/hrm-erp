<?php

namespace App\Http\Controllers\Api\RecruitmentManagement;

use App\Http\Controllers\Controller;
use App\Models\BoardingRequest;
use App\Models\BoardingTimeline;
use App\Models\OfferResponse;
use App\Models\Staff;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\Candidate;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\OfferLetterTemplate;
use App\Models\ClientInterviewFeedback;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BoardingController extends Controller
{
    /**
     * Test method for debugging
     */
    public function testMethod(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'BoardingController is working!',
            'timestamp' => now()
        ]);
    }

    /**
     * Get clients with active recruitment requests
     */
    public function getClients(): JsonResponse
    {
        try {
            // Get clients with their actual count of active recruitment requests
            $clients = Client::where('status', 'active')
                ->withCount(['recruitmentRequests' => function ($query) {
                    $query->where('status', 'active');
                }])
                ->having('recruitment_requests_count', '>', 0) // Only clients with active tickets
                ->orderBy('organisation_name')
                ->get(['id', 'organisation_name', 'prefix']);

            // Transform to match boarding API expected format
            $transformedClients = $clients->map(function ($client) {
                return [
                    'id' => $client->id,
                    'company_name' => $client->organisation_name,
                    'prefix' => $client->prefix ?? substr($client->organisation_name, 0, 3),
                    'active_tickets' => $client->recruitment_requests_count
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedClients,
                'message' => $transformedClients->isEmpty() ? 'No clients with active recruitment requests found' : 'Clients retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching clients for boarding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Get recruitment tickets for a client
     */
    public function getTickets(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id'
        ]);

        try {
            $tickets = RecruitmentRequest::where('client_id', $request->client_id)
                ->where('status', 'active')
                ->with(['jobStructure'])
                ->get()
                ->map(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'client_id' => $ticket->client_id,
                        'ticket_code' => $ticket->ticket_id, // Use ticket_id instead of recruitment_code
                        'job_title' => $ticket->jobStructure->job_title ?? 'N/A', // Get from relationship
                        'positions_required' => $ticket->number_of_vacancies, // Use number_of_vacancies
                        'positions_filled' => $ticket->staff_accepted_offer ?? 0, // Use staff_accepted_offer
                        'job_structure_id' => $ticket->job_structure_id,
                        'status' => $ticket->status,
                        'created_at' => $ticket->created_at
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $tickets,
                'message' => $tickets->isEmpty() ? 'No active tickets found for this client' : 'Tickets retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch tickets: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Debug method to check job structure data integrity
     */
    public function debugJobStructure(Request $request): JsonResponse
    {
        try {
            $recruitmentRequestId = $request->recruitment_request_id;

            if (!$recruitmentRequestId) {
                // If no specific request ID, show general debug info
                $allRequests = RecruitmentRequest::with(['client'])
                    ->take(5)
                    ->get(['id', 'ticket_id', 'job_structure_id', 'client_id'])
                    ->map(function ($req) {
                        return [
                            'id' => $req->id,
                            'ticket_id' => $req->ticket_id,
                            'job_structure_id' => $req->job_structure_id,
                            'client_name' => $req->client ? $req->client->company_name : 'No client'
                        ];
                    });

                $jobStructureCount = DB::table('job_structures')->count();
                $payGradeCount = DB::table('pay_grade_structures')->count();

                return response()->json([
                    'success' => true,
                    'debug_data' => [
                        'sample_recruitment_requests' => $allRequests,
                        'total_job_structures' => $jobStructureCount,
                        'total_pay_grades' => $payGradeCount,
                        'message' => 'Add ?recruitment_request_id=X to debug specific request'
                    ]
                ]);
            }

            // Get recruitment request with job structure
            $recruitmentRequest = RecruitmentRequest::with(['jobStructure.payGradeStructures', 'client'])
                ->find($recruitmentRequestId);

            if (!$recruitmentRequest) {
                return response()->json([
                    'error' => 'Recruitment request not found',
                    'recruitment_request_id' => $recruitmentRequestId
                ], 404);
            }

            $debug = [
                'recruitment_request' => [
                    'id' => $recruitmentRequest->id,
                    'ticket_id' => $recruitmentRequest->ticket_id,
                    'job_structure_id' => $recruitmentRequest->job_structure_id,
                    'client_id' => $recruitmentRequest->client_id,
                    'client_name' => $recruitmentRequest->client ? $recruitmentRequest->client->company_name : 'No client'
                ],
                'job_structure' => null,
                'pay_grades_count' => 0,
                'active_pay_grades_count' => 0
            ];

            if ($recruitmentRequest->jobStructure) {
                $debug['job_structure'] = [
                    'id' => $recruitmentRequest->jobStructure->id,
                    'structure_name' => $recruitmentRequest->jobStructure->structure_name,
                    'is_active' => $recruitmentRequest->jobStructure->is_active,
                    'client_id' => $recruitmentRequest->jobStructure->client_id
                ];

                $debug['pay_grades_count'] = $recruitmentRequest->jobStructure->payGradeStructures->count();
                $debug['active_pay_grades_count'] = $recruitmentRequest->jobStructure->payGradeStructures
                    ->where('is_active', true)->count();

                $debug['pay_grades'] = $recruitmentRequest->jobStructure->payGradeStructures
                    ->map(function ($grade) {
                        return [
                            'id' => $grade->id,
                            'grade_name' => $grade->grade_name,
                            'is_active' => $grade->is_active,
                            'total_compensation' => $grade->total_compensation
                        ];
                    });
            } else {
                $debug['error'] = 'Job structure not found for ID: ' . $recruitmentRequest->job_structure_id;
            }

            return response()->json([
                'success' => true,
                'debug_data' => $debug
            ]);
        } catch (\Exception $e) {
            Log::error('Debug job structure failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Debug failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pay grades for a job structure
     */
    public function getPayGrades(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'job_structure_id' => 'required|exists:job_structures,id'
            ]);

            if ($validator->fails()) {
                Log::warning('Pay grades validation failed', [
                    'job_structure_id' => $request->job_structure_id,
                    'errors' => $validator->errors()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'The selected job structure id is invalid.',
                    'errors' => $validator->errors()
                ], 422);
            }

            $payGrades = PayGradeStructure::where('job_structure_id', $request->job_structure_id)
                ->where('is_active', true)
                ->orderBy('total_compensation')
                ->get()
                ->map(function ($grade) {
                    return [
                        'id' => $grade->id,
                        'job_structure_id' => $grade->job_structure_id,
                        'grade_name' => $grade->grade_name,
                        'grade_code' => $grade->grade_code,
                        'total_compensation' => $grade->total_compensation,
                        'currency' => $grade->currency,
                        'emoluments' => $grade->emoluments
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $payGrades,
                'message' => $payGrades->isEmpty() ? 'No pay grades found for this job structure' : 'Pay grades retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch pay grades: ' . $e->getMessage(), [
                'job_structure_id' => $request->job_structure_id ?? 'null',
                'request_data' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pay grades',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Get candidates for offer issuance (recommended candidates who haven't received offers)
     */
    public function getCandidatesForOffer(Request $request): JsonResponse
    {
        $request->validate([
            'recruitment_request_id' => 'required|exists:recruitment_requests,id'
        ]);

        try {
            // Get recommended candidates from interview feedback
            $recommendedCandidates = ClientInterviewFeedback::where('recruitment_request_id', $request->recruitment_request_id)
                ->where('feedback_status', 'successful')
                ->whereDoesntHave('candidate.boardingRequests', function ($query) use ($request) {
                    $query->where('recruitment_request_id', $request->recruitment_request_id)
                        ->whereIn('status', ['pending', 'offer_sent', 'offer_accepted', 'onboarded']);
                })
                ->with([
                    'candidate' => function ($query) {
                        $query->select('id', 'first_name', 'last_name', 'email', 'phone');
                    }
                ])
                ->get()
                ->map(function ($feedback) {
                    return [
                        'id' => $feedback->candidate->id,
                        'first_name' => $feedback->candidate->first_name,
                        'last_name' => $feedback->candidate->last_name,
                        'email' => $feedback->candidate->email,
                        'phone' => $feedback->candidate->phone,
                        'feedback_status' => $feedback->feedback_status,
                        'interviewer_feedback' => $feedback->comments
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $recommendedCandidates,
                'message' => $recommendedCandidates->isEmpty() ? 'No candidates available for offer' : 'Candidates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch candidates for offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidates for offer',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Get candidates for boarding (those with accepted offers)
     */
    public function getCandidatesForBoarding(Request $request): JsonResponse
    {
        $request->validate([
            'recruitment_request_id' => 'required|exists:recruitment_requests,id'
        ]);

        try {
            $boardingCandidates = BoardingRequest::where('recruitment_request_id', $request->recruitment_request_id)
                ->where('status', 'offer_accepted')
                ->with([
                    'candidate',
                    'payGradeStructure',
                    'offerResponses' => function ($query) {
                        $query->where('response_type', 'accepted')->latest();
                    }
                ])
                ->get()
                ->map(function ($request) {
                    $latestResponse = $request->offerResponses->first();
                    return [
                        'id' => $request->candidate->id,
                        'boarding_request_id' => $request->id,
                        'first_name' => $request->candidate->first_name,
                        'last_name' => $request->candidate->last_name,
                        'email' => $request->candidate->email,
                        'phone' => $request->candidate->phone,
                        'offer_status' => 'accepted',
                        'offer_sent_at' => $request->offer_sent_at,
                        'offer_responded_at' => $request->offer_responded_at,
                        'offered_salary' => $request->payGradeStructure->total_compensation,
                        'pay_grade' => $request->payGradeStructure->grade_name,
                        'preferred_start_date' => $latestResponse?->preferred_start_date ?? $request->proposed_start_date,
                        'candidate_message' => $latestResponse?->candidate_message
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $boardingCandidates,
                'message' => $boardingCandidates->isEmpty() ? 'No candidates ready for boarding' : 'Boarding candidates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch candidates for boarding: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch candidates for boarding',
                'error' => config('app.debug') ? $e->getMessage() : 'Please contact support'
            ], 500);
        }
    }

    /**
     * Send offers to multiple candidates (bulk operation)
     */
    public function sendOffers(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'recruitment_request_id' => 'required|exists:recruitment_requests,id',
            'job_structure_id' => 'required|exists:job_structures,id',
            'offers' => 'required|array|min:1',
            'offers.*.candidate_id' => 'required|exists:candidates,id',
            'offers.*.pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
            'offers.*.proposed_start_date' => 'required|date|after:today'
        ]);

        try {
            DB::beginTransaction();

            $successCount = 0;
            $failedCandidates = [];

            foreach ($request->offers as $offer) {
                try {
                    // Check if candidate already has an active boarding request for this ticket
                    $existingRequest = BoardingRequest::where('candidate_id', $offer['candidate_id'])
                        ->where('recruitment_request_id', $request->recruitment_request_id)
                        ->whereIn('status', ['pending', 'offer_sent', 'offer_accepted', 'onboarded'])
                        ->first();

                    if ($existingRequest) {
                        $failedCandidates[] = [
                            'candidate_id' => $offer['candidate_id'],
                            'reason' => 'Candidate already has an active offer for this position'
                        ];
                        continue;
                    }

                    // Get the appropriate offer letter template
                    $template = OfferLetterTemplate::where('client_id', $request->client_id)
                        ->where('job_structure_id', $request->job_structure_id)
                        ->where('pay_grade_structure_id', $offer['pay_grade_structure_id'])
                        ->where('status', 'active')
                        ->first();

                    if (!$template) {
                        $failedCandidates[] = [
                            'candidate_id' => $offer['candidate_id'],
                            'reason' => 'No active offer letter template found for this combination'
                        ];
                        continue;
                    }

                    // Create boarding request
                    $boardingRequest = BoardingRequest::create([
                        'candidate_id' => $offer['candidate_id'],
                        'client_id' => $request->client_id,
                        'recruitment_request_id' => $request->recruitment_request_id,
                        'job_structure_id' => $request->job_structure_id,
                        'pay_grade_structure_id' => $offer['pay_grade_structure_id'],
                        'offer_letter_template_id' => $template->id,
                        'status' => 'offer_sent',
                        'proposed_start_date' => $offer['proposed_start_date'],
                        'offer_sent_at' => now(),
                        'created_by' => Auth::id() ?? 1
                    ]);

                    // Log timeline
                    BoardingTimeline::logAction(
                        $boardingRequest->id,
                        'offer_sent',
                        'Offer letter sent to candidate',
                        [
                            'pay_grade' => $offer['pay_grade_structure_id'],
                            'proposed_start_date' => $offer['proposed_start_date']
                        ],
                        Auth::id() ?? 1
                    );

                    $successCount++;
                } catch (\Exception $e) {
                    $failedCandidates[] = [
                        'candidate_id' => $offer['candidate_id'],
                        'reason' => 'Failed to process offer: ' . $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully sent offers to {$successCount} candidate(s)",
                'data' => [
                    'success_count' => $successCount,
                    'failed_candidates' => $failedCandidates
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to send offers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send offers'
            ], 500);
        }
    }

    /**
     * Board multiple candidates (bulk operation)
     */
    public function boardCandidates(Request $request): JsonResponse
    {
        $request->validate([
            'candidates' => 'required|array|min:1',
            'candidates.*' => 'required|exists:boarding_requests,id'
        ]);

        try {
            DB::beginTransaction();

            $successCount = 0;
            $failedCandidates = [];

            foreach ($request->candidates as $boardingRequestId) {
                try {
                    $boardingRequest = BoardingRequest::with([
                        'candidate',
                        'client',
                        'recruitmentRequest',
                        'jobStructure',
                        'payGradeStructure',
                        'offerResponses' => function ($query) {
                            $query->where('response_type', 'accepted')->latest();
                        }
                    ])->find($boardingRequestId);

                    if (!$boardingRequest || !$boardingRequest->canBeBoarded()) {
                        $failedCandidates[] = [
                            'boarding_request_id' => $boardingRequestId,
                            'reason' => 'Boarding request not found or not eligible for boarding'
                        ];
                        continue;
                    }

                    // Check if candidate is already staff
                    $existingStaff = Staff::where('candidate_id', $boardingRequest->candidate_id)
                        ->where('status', 'active')
                        ->first();

                    if ($existingStaff) {
                        $failedCandidates[] = [
                            'boarding_request_id' => $boardingRequestId,
                            'reason' => 'Candidate is already an active staff member'
                        ];
                        continue;
                    }

                    // Generate unique staff codes
                    $staffId = $this->generateStaffId($boardingRequest->client->company_code ?? 'SOL');
                    $employeeCode = $this->generateEmployeeCode($boardingRequest->client_id);

                    $latestResponse = $boardingRequest->offerResponses->first();
                    $startDate = $latestResponse?->preferred_start_date ?? $boardingRequest->proposed_start_date;

                    // Get recruitment request for additional details
                    $recruitmentRequest = $boardingRequest->recruitmentRequest;
                    
                    // Get the specific service location the candidate applied to
                    $candidateServiceLocationId = null;
                    $candidateApplication = \App\Models\Candidate\CandidateJobApplication::where('candidate_id', $boardingRequest->candidate_id)
                        ->where('recruitment_request_id', $recruitmentRequest->id)
                        ->first();
                    
                    if ($candidateApplication && $candidateApplication->service_location_id) {
                        $candidateServiceLocationId = $candidateApplication->service_location_id;
                    } else {
                        // Fallback to ticket's service_location_id if no application found
                        $candidateServiceLocationId = $recruitmentRequest->service_location_id;
                    }
                    
                    // Determine sol_office_id from ticket or service location
                    $solOfficeId = $recruitmentRequest->sol_office_id;
                    if (!$solOfficeId && $candidateServiceLocationId) {
                        $serviceLocation = \App\Models\ServiceLocation::find($candidateServiceLocationId);
                        $solOfficeId = $serviceLocation?->sol_office_id;
                    }

                    // Create staff record with complete job details
                    $staff = Staff::create([
                        'candidate_id' => $boardingRequest->candidate_id,
                        'client_id' => $boardingRequest->client_id,
                        'staff_type_id' => 1, // Default staff type
                        'recruitment_request_id' => $recruitmentRequest->id,
                        'employee_code' => $employeeCode,
                        'staff_id' => $staffId,
                        'email' => $boardingRequest->candidate->email,
                        'first_name' => $boardingRequest->candidate->first_name,
                        'last_name' => $boardingRequest->candidate->last_name,
                        'entry_date' => $startDate,
                        'appointment_status' => 'probation',
                        'employment_type' => 'full_time',
                        'status' => 'active',
                        // Job details from recruitment request
                        'job_structure_id' => $recruitmentRequest->job_structure_id,
                        'job_title' => $recruitmentRequest->jobStructure->job_title ?? null,
                        'service_location_id' => $candidateServiceLocationId, // Use candidate's applied location
                        'sol_office_id' => $solOfficeId,
                        'pay_grade_structure_id' => null, // TODO: Add pay grade selection during boarding
                        // Boarding metadata
                        'onboarding_method' => 'from_candidate',
                        'onboarded_by' => Auth::id() ?? 1
                    ]);

                    // Copy candidate data to staff-related tables
                    $this->copyDataToStaffTables($boardingRequest->candidate_id, $staff->id, $latestResponse);

                    // Update boarding request status
                    $boardingRequest->update([
                        'status' => 'onboarded',
                        'onboarded_at' => now()
                    ]);

                    // Log timeline
                    BoardingTimeline::logAction(
                        $boardingRequest->id,
                        'onboarding_completed',
                        'Candidate successfully onboarded as staff member',
                        [
                            'staff_id' => $staff->id,
                            'employee_code' => $employeeCode,
                            'staff_internal_id' => $staffId
                        ],
                        Auth::id() ?? 1
                    );

                    $successCount++;
                } catch (\Exception $e) {
                    Log::error("Failed to board candidate: " . $e->getMessage());
                    $failedCandidates[] = [
                        'boarding_request_id' => $boardingRequestId,
                        'reason' => 'Failed to create staff record: ' . $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully boarded {$successCount} candidate(s)",
                'data' => [
                    'success_count' => $successCount,
                    'failed_candidates' => $failedCandidates
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to board candidates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to board candidates'
            ], 500);
        }
    }

    /**
     * Copy candidate data to corresponding staff tables
     */
    private function copyDataToStaffTables($candidateId, $staffId, $offerResponse = null)
    {
        try {
            // Get candidate data for personal info
            $candidate = \App\Models\Candidate::find($candidateId);
            
            // Create staff personal info with candidate data
            if ($candidate) {
                \App\Models\StaffPersonalInfo::create([
                    'staff_id' => $staffId,
                    'date_of_birth' => $candidate->date_of_birth,
                    'mobile_phone' => $candidate->phone,
                    'personal_email' => $candidate->email,
                ]);
            }
            
            // Copy emergency contacts
            $emergencyContacts = DB::table('candidate_emergency_contacts')
                ->where('candidate_id', $candidateId)
                ->get();

            foreach ($emergencyContacts as $contact) {
                DB::table('staff_emergency_contacts')->insert([
                    'staff_id' => $staffId,
                    'relationship' => $contact->relationship,
                    'first_name' => $contact->first_name,
                    'last_name' => $contact->last_name,
                    'phone' => $contact->phone,
                    'email' => $contact->email,
                    'address' => $contact->address,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Copy work experience
            $experiences = DB::table('candidate_experience')
                ->where('candidate_id', $candidateId)
                ->get();

            foreach ($experiences as $experience) {
                DB::table('staff_experience')->insert([
                    'staff_id' => $staffId,
                    'company_name' => $experience->company_name,
                    'job_title' => $experience->job_title,
                    'start_date' => $experience->start_date,
                    'end_date' => $experience->end_date,
                    'responsibilities' => $experience->responsibilities,
                    'reason_for_leaving' => $experience->reason_for_leaving,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Copy primary education
            $primaryEducation = DB::table('candidate_primary_education')
                ->where('candidate_id', $candidateId)
                ->get();

            foreach ($primaryEducation as $education) {
                DB::table('staff_education')->insert([
                    'staff_id' => $staffId,
                    'level' => 'primary',
                    'institution_name' => $education->school_name,
                    'year_completed' => $education->primary_year,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Copy secondary education
            $secondaryEducation = DB::table('candidate_secondary_education')
                ->where('candidate_id', $candidateId)
                ->get();

            foreach ($secondaryEducation as $education) {
                DB::table('staff_education')->insert([
                    'staff_id' => $staffId,
                    'level' => 'secondary',
                    'institution_name' => $education->school_name,
                    'year_completed' => $education->secondary_year,
                    'certificate' => $education->highest_level,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // Copy tertiary education
            $tertiaryEducation = DB::table('candidate_tertiary_education')
                ->where('candidate_id', $candidateId)
                ->get();

            foreach ($tertiaryEducation as $education) {
                DB::table('staff_education')->insert([
                    'staff_id' => $staffId,
                    'level' => 'tertiary',
                    'institution_name' => $education->institute_name,
                    'course_of_study' => $education->course_of_study,
                    'degree_type' => $education->qualification_type,
                    'year_completed' => $education->year_of_completion,
                    'grade' => $education->grade_class,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // If candidate provided updated banking/legal info during offer acceptance
            if ($offerResponse && !empty($offerResponse->updated_candidate_info)) {
                $updatedInfo = $offerResponse->updated_candidate_info;

                // Banking information
                if (!empty($updatedInfo['banking'])) {
                    DB::table('staff_banking')->insert([
                        'staff_id' => $staffId,
                        'bank_name' => $updatedInfo['banking']['bank_name'] ?? null,
                        'account_number' => $updatedInfo['banking']['account_number'] ?? null,
                        'account_name' => $updatedInfo['banking']['account_name'] ?? null,
                        'sort_code' => $updatedInfo['banking']['sort_code'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                // Legal IDs (BVN, NIN, etc.)
                if (!empty($updatedInfo['legal_ids'])) {
                    DB::table('staff_legal_ids')->insert([
                        'staff_id' => $staffId,
                        'bvn' => $updatedInfo['legal_ids']['bvn'] ?? null,
                        'nin' => $updatedInfo['legal_ids']['nin'] ?? null,
                        'passport_number' => $updatedInfo['legal_ids']['passport_number'] ?? null,
                        'drivers_license' => $updatedInfo['legal_ids']['drivers_license'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to copy candidate data to staff tables: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate unique staff ID
     */
    private function generateStaffId($clientCode = 'SOL'): string
    {
        $year = date('Y');
        $prefix = strtoupper($clientCode) . '-' . $year . '-';

        $lastStaff = Staff::where('staff_id', 'like', $prefix . '%')
            ->orderBy('staff_id', 'desc')
            ->first();

        if ($lastStaff) {
            $lastNumber = intval(substr($lastStaff->staff_id, -4));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate unique employee code
     */
    private function generateEmployeeCode($clientId): string
    {
        $prefix = 'EMP' . str_pad($clientId, 3, '0', STR_PAD_LEFT) . '-';

        $lastEmployee = Staff::where('employee_code', 'like', $prefix . '%')
            ->orderBy('employee_code', 'desc')
            ->first();

        if ($lastEmployee) {
            $lastNumber = intval(substr($lastEmployee->employee_code, -4));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}
