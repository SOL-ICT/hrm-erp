<?php

namespace App\Http\Controllers\Admin\Boarding;

use App\Http\Controllers\Controller;
use App\Models\Boarding\BoardingRequest;
use App\Models\Boarding\StaffProfile;
use App\Models\Boarding\OfferAcceptance;
use App\Models\Candidate;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class BoardingController extends Controller
{
    /**
     * Get boarding dashboard statistics
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            $stats = [
                'total_boarded' => StaffProfile::where('employment_status', 'active')->count(),
                'pending_recommended' => BoardingRequest::where('status', 'pending')->count(),
                'active_tickets' => RecruitmentRequest::where('status', 'active')->count(),
                'clients_with_open_positions' => Client::whereHas('recruitmentRequests', function($query) {
                    $query->where('status', 'active');
                })->count(),
                'offers_sent' => BoardingRequest::where('status', 'offer_sent')->count(),
                'offers_accepted' => BoardingRequest::where('status', 'offer_accepted')->count(),
                'offers_rejected' => BoardingRequest::where('status', 'offer_rejected')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get clients with active recruitment tickets
     */
    public function getClientsWithActiveTickets(): JsonResponse
    {
        try {
            $clients = Client::with(['recruitmentRequests' => function($query) {
                $query->where('status', 'active')
                      ->orderBy('created_at', 'desc');
            }])
            ->whereHas('recruitmentRequests', function($query) {
                $query->where('status', 'active');
            })
            ->get()
            ->map(function($client) {
                return [
                    'id' => $client->id,
                    'name' => $client->company_name,
                    'prefix' => $client->company_prefix,
                    'active_tickets' => $client->recruitmentRequests->count(),
                    'tickets' => $client->recruitmentRequests->map(function($ticket) {
                        return [
                            'id' => $ticket->id,
                            'ticket_code' => $ticket->ticket_code,
                            'job_title' => $ticket->job_title,
                            'positions_required' => $ticket->positions_required,
                            'positions_filled' => $ticket->positions_filled ?? 0,
                            'status' => $ticket->status,
                            'created_date' => $ticket->created_at->format('Y-m-d'),
                            'deadline' => $ticket->deadline ? $ticket->deadline->format('Y-m-d') : null,
                        ];
                    })
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch clients with active tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recommended candidates for a specific ticket
     */
    public function getRecommendedCandidates(Request $request, $ticketId): JsonResponse
    {
        try {
            $validator = Validator::make(['ticket_id' => $ticketId], [
                'ticket_id' => 'required|exists:recruitment_requests,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid ticket ID',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get candidates with "Recommended" feedback status
            // This assumes there's a candidate_interview_feedback table
            $recommendedCandidates = DB::table('candidate_interview_feedback as cif')
                ->join('candidates as c', 'c.id', '=', 'cif.candidate_id')
                ->leftJoin('candidate_job_applications as cja', function($join) use ($ticketId) {
                    $join->on('cja.candidate_id', '=', 'c.id')
                         ->where('cja.recruitment_request_id', '=', $ticketId);
                })
                ->where('cif.recruitment_request_id', $ticketId)
                ->where('cif.feedback_status', 'Recommended')
                ->whereNotExists(function($query) {
                    $query->select(DB::raw(1))
                          ->from('boarding_requests as br')
                          ->whereColumn('br.candidate_id', 'c.id')
                          ->whereIn('br.status', ['pending', 'offer_sent', 'offer_accepted', 'onboarded']);
                })
                ->select([
                    'c.id as candidate_id',
                    'c.first_name',
                    'c.last_name',
                    'c.email',
                    'c.phone',
                    'c.qualification_type',
                    'c.field_of_study',
                    'c.experience_years',
                    'cif.interview_score',
                    'cif.interviewer_feedback',
                    'cif.expected_salary'
                ])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $recommendedCandidates
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recommended candidates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all boarding requests with filters
     */
    public function getBoardingRequests(Request $request): JsonResponse
    {
        try {
            $query = BoardingRequest::with([
                'candidate:id,first_name,middle_name,last_name,email,phone',
                'client:id,company_name',
                'recruitmentRequest:id,job_title,ticket_code',
                'jobStructure:id,job_title',
                'payGrade:id,pay_grade_name,min_salary,max_salary',
                'createdBy:id,name'
            ]);

            // Apply filters
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            if ($request->filled('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->filled('boarding_type')) {
                $query->where('boarding_type', $request->boarding_type);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('candidate', function($q) use ($search) {
                    $q->where(DB::raw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)"), 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->input('per_page', 25);
            $boardingRequests = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $boardingRequests
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch boarding requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a boarding request
     */
    public function createBoardingRequest(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'candidate_id' => 'required|exists:candidates,id',
                'client_id' => 'required|exists:clients,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'job_structure_id' => 'nullable|exists:job_structures,id',
                'pay_grade_id' => 'nullable|exists:pay_grade_structures,id',
                'boarding_type' => 'required|in:recommended,direct_placement',
                'proposed_start_date' => 'nullable|date|after:today',
                'offered_salary' => 'nullable|numeric|min:0',
                'offer_letter_content' => 'nullable|string',
                'terms_conditions' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if candidate already has an active boarding request
            $existingRequest = BoardingRequest::where('candidate_id', $request->candidate_id)
                ->whereIn('status', ['pending', 'offer_sent', 'offer_accepted'])
                ->first();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate already has an active boarding request'
                ], 409);
            }

            DB::beginTransaction();

            $boardingRequest = BoardingRequest::create([
                'candidate_id' => $request->candidate_id,
                'client_id' => $request->client_id,
                'recruitment_request_id' => $request->recruitment_request_id,
                'job_structure_id' => $request->job_structure_id,
                'pay_grade_id' => $request->pay_grade_id,
                'boarding_type' => $request->boarding_type,
                'status' => 'pending',
                'proposed_start_date' => $request->proposed_start_date,
                'offered_salary' => $request->offered_salary,
                'offer_letter_content' => $request->offer_letter_content,
                'terms_conditions' => $request->terms_conditions,
                'created_by' => Auth::id() ?? 1
            ]);

            // Log timeline event
            $boardingRequest->logTimeline(
                'request_created',
                'Boarding request created for ' . $boardingRequest->candidate->first_name . ' ' . $boardingRequest->candidate->last_name,
                [
                    'boarding_type' => $request->boarding_type,
                    'client' => $boardingRequest->client->company_name,
                    'position' => $boardingRequest->recruitmentRequest->job_title
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Boarding request created successfully',
                'data' => $boardingRequest->load([
                    'candidate:id,first_name,middle_name,last_name,email',
                    'client:id,company_name',
                    'recruitmentRequest:id,job_title,ticket_code'
                ])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create boarding request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send offer to candidate
     */
    public function sendOffer(Request $request, $boardingRequestId): JsonResponse
    {
        try {
            $validator = Validator::make([...$request->all(), 'boarding_request_id' => $boardingRequestId], [
                'boarding_request_id' => 'required|exists:boarding_requests,id',
                'offer_letter_content' => 'required|string',
                'offered_salary' => 'required|numeric|min:0',
                'proposed_start_date' => 'required|date|after:today',
                'terms_conditions' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $boardingRequest = BoardingRequest::findOrFail($boardingRequestId);

            if (!$boardingRequest->canSendOffer()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Offer cannot be sent for this boarding request'
                ], 400);
            }

            DB::beginTransaction();

            $boardingRequest->update([
                'status' => 'offer_sent',
                'offer_letter_content' => $request->offer_letter_content,
                'offered_salary' => $request->offered_salary,
                'proposed_start_date' => $request->proposed_start_date,
                'terms_conditions' => $request->terms_conditions,
                'offer_sent_at' => now()
            ]);

            // Log timeline event
            $boardingRequest->logTimeline(
                'offer_sent',
                'Offer sent to candidate with salary of ₦' . number_format($request->offered_salary),
                [
                    'offered_salary' => $request->offered_salary,
                    'proposed_start_date' => $request->proposed_start_date,
                    'sent_via' => 'email' // This could be configurable
                ]
            );

            // TODO: Send email notification to candidate
            // Mail::to($boardingRequest->candidate->email)->send(new OfferLetter($boardingRequest));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer sent successfully to candidate',
                'data' => $boardingRequest->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to send offer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Candidate responds to offer (accept/reject/negotiate)
     */
    public function respondToOffer(Request $request, $boardingRequestId): JsonResponse
    {
        try {
            $validator = Validator::make([...$request->all(), 'boarding_request_id' => $boardingRequestId], [
                'boarding_request_id' => 'required|exists:boarding_requests,id',
                'response_type' => 'required|in:accepted,rejected,negotiating',
                'candidate_message' => 'nullable|string',
                'negotiation_points' => 'nullable|array',
                'counter_offer_salary' => 'nullable|numeric|min:0',
                'preferred_start_date' => 'nullable|date',
                'additional_terms' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $boardingRequest = BoardingRequest::findOrFail($boardingRequestId);

            if (!$boardingRequest->canAcceptOffer()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot respond to this offer'
                ], 400);
            }

            DB::beginTransaction();

            // Create offer acceptance record
            $offerAcceptance = OfferAcceptance::create([
                'boarding_request_id' => $boardingRequestId,
                'candidate_id' => $boardingRequest->candidate_id,
                'response_type' => $request->response_type,
                'candidate_message' => $request->candidate_message,
                'negotiation_points' => $request->negotiation_points,
                'counter_offer_salary' => $request->counter_offer_salary,
                'preferred_start_date' => $request->preferred_start_date,
                'additional_terms' => $request->additional_terms,
                'responded_at' => now()
            ]);

            // Update boarding request status
            $newStatus = match($request->response_type) {
                'accepted' => 'offer_accepted',
                'rejected' => 'offer_rejected',
                'negotiating' => 'offer_sent', // Keep as offer_sent while negotiating
                default => $boardingRequest->status
            };

            $boardingRequest->update([
                'status' => $newStatus,
                'offer_responded_at' => now(),
                'rejection_reason' => $request->response_type === 'rejected' ? $request->candidate_message : null
            ]);

            // Log timeline event
            $action = 'offer_' . $request->response_type;
            $description = match($request->response_type) {
                'accepted' => 'Candidate accepted the offer',
                'rejected' => 'Candidate rejected the offer: ' . ($request->candidate_message ?? 'No reason provided'),
                'negotiating' => 'Candidate initiated negotiation',
                default => 'Candidate responded to offer'
            };

            $boardingRequest->logTimeline($action, $description, [
                'response_type' => $request->response_type,
                'counter_offer_salary' => $request->counter_offer_salary,
                'candidate_message' => $request->candidate_message
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Response recorded successfully',
                'data' => [
                    'boarding_request' => $boardingRequest->fresh(),
                    'offer_acceptance' => $offerAcceptance
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record offer response',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert candidate to staff (onboard)
     */
    public function convertToStaff(Request $request, $boardingRequestId): JsonResponse
    {
        try {
            $validator = Validator::make([...$request->all(), 'boarding_request_id' => $boardingRequestId], [
                'boarding_request_id' => 'required|exists:boarding_requests,id',
                'employee_id' => 'required|string|unique:staff_profiles,employee_id',
                'start_date' => 'required|date',
                'current_salary' => 'required|numeric|min:0',
                'contract_terms' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $boardingRequest = BoardingRequest::findOrFail($boardingRequestId);

            if (!$boardingRequest->canOnboard()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot onboard this candidate'
                ], 400);
            }

            DB::beginTransaction();

            // Generate SOL staff ID
            $solStaffId = $this->generateSOLStaffId($boardingRequest->client_id);

            // Create staff profile
            $staffProfile = StaffProfile::create([
                'boarding_request_id' => $boardingRequestId,
                'candidate_id' => $boardingRequest->candidate_id,
                'client_id' => $boardingRequest->client_id,
                'employee_id' => $request->employee_id,
                'sol_staff_id' => $solStaffId,
                'job_structure_id' => $boardingRequest->job_structure_id,
                'pay_grade_id' => $boardingRequest->pay_grade_id,
                'current_salary' => $request->current_salary,
                'start_date' => $request->start_date,
                'employment_status' => 'active',
                'contract_terms' => $request->contract_terms,
                'created_by' => Auth::id() ?? 1
            ]);

            // Update boarding request status
            $boardingRequest->update([
                'status' => 'onboarded',
                'onboarded_at' => now()
            ]);

            // Update candidate employment status
            $boardingRequest->candidate->update([
                'is_currently_employed' => true,
                'current_employer' => $boardingRequest->client->company_name,
                'current_job_title' => $boardingRequest->jobStructure->job_title ?? $boardingRequest->recruitmentRequest->job_title
            ]);

            // Log timeline event
            $boardingRequest->logTimeline(
                'onboarding_completed',
                'Candidate successfully onboarded as ' . $staffProfile->sol_staff_id,
                [
                    'employee_id' => $request->employee_id,
                    'sol_staff_id' => $solStaffId,
                    'start_date' => $request->start_date,
                    'salary' => $request->current_salary
                ]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Candidate successfully onboarded as staff',
                'data' => [
                    'boarding_request' => $boardingRequest->fresh(),
                    'staff_profile' => $staffProfile->load(['candidate', 'client', 'jobStructure', 'payGrade'])
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to onboard candidate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get boarding request details
     */
    public function getBoardingRequest($boardingRequestId): JsonResponse
    {
        try {
            $boardingRequest = BoardingRequest::with([
                'candidate',
                'client',
                'recruitmentRequest',
                'jobStructure',
                'payGrade',
                'staffProfile',
                'offerAcceptances' => function($query) {
                    $query->latest();
                },
                'documents',
                'timeline' => function($query) {
                    $query->with('performedBy:id,name')->latest('performed_at');
                },
                'createdBy:id,name'
            ])->findOrFail($boardingRequestId);

            return response()->json([
                'success' => true,
                'data' => $boardingRequest
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch boarding request details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate SOL Staff ID
     */
    private function generateSOLStaffId($clientId): string
    {
        $client = Client::findOrFail($clientId);
        $prefix = $client->company_prefix ?? 'SOL';
        $year = date('Y');
        
        // Get next sequence number
        $lastStaff = StaffProfile::where('sol_staff_id', 'LIKE', "{$prefix}-{$year}-%")
            ->orderBy('sol_staff_id', 'desc')
            ->first();
        
        if ($lastStaff) {
            $lastNumber = intval(substr($lastStaff->sol_staff_id, -4));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }
        
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }
}
