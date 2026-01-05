<?php

namespace App\Http\Controllers;

use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\ServiceLocation;
use App\Models\SOLOffice;
use App\Models\User;
use App\Models\RecruitmentApplication;
use App\Services\CacheService;
use App\Services\Approval\ApprovalService;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class RecruitmentRequestController extends Controller
{
    protected $approvalService;
    protected $hierarchyService;

    public function __construct(
        ApprovalService $approvalService,
        RecruitmentHierarchyService $hierarchyService
    ) {
        $this->approvalService = $approvalService;
        $this->hierarchyService = $hierarchyService;
    }

    // ========================================
    // CRUD OPERATIONS
    // ========================================

    /**
     * Get all recruitment requests with filtering and pagination
     */
    public function index(Request $request)
    {
        try {
            // Generate cache key based on request parameters
            $cacheKey = CacheService::generateKey('recruitment_requests_index', $request->all());

            return CacheService::rememberApiResponse($cacheKey, 'recruitment', function () use ($request) {
                $query = RecruitmentRequest::with([
                    'client:id,organisation_name',
                    'jobStructure:id,job_title,job_code',
                    'serviceLocation:id,location_name,city',
                    'solOffice:id,office_name,office_code',
                    'createdBy:id,name,email',
                    'approval:id,status,current_approver_id,current_approval_level,total_approval_levels,due_date,is_overdue',
                    'approval.currentApprover:id,name,email'
                ]);

                // Apply filters
                if ($request->filled('client_id')) {
                    $query->where('client_id', $request->client_id);
                }

                if ($request->filled('status')) {
                    if (is_array($request->status)) {
                        $query->whereIn('status', $request->status);
                    } else {
                        $query->where('status', $request->status);
                    }
                }

                if ($request->filled('year')) {
                    $query->whereYear('created_at', $request->year);
                }

                if ($request->filled('priority')) {
                    $query->where('priority_level', $request->priority);
                }

                if ($request->filled('sol_service_type')) {
                    $query->where('sol_service_type', $request->sol_service_type);
                }

                if ($request->filled('search')) {
                    $search = $request->search;
                    $query->where(function ($q) use ($search) {
                        $q->where('ticket_id', 'LIKE', "%{$search}%")
                            ->orWhereHas('client', function ($clientQuery) use ($search) {
                                $clientQuery->where('organisation_name', 'LIKE', "%{$search}%");
                            })
                            ->orWhereHas('jobStructure', function ($jobQuery) use ($search) {
                                $jobQuery->where('job_title', 'LIKE', "%{$search}%");
                            });
                    });
                }

                // Sorting - support both frontend formats
                $sortBy = $request->get('sort_by') ?? $request->get('sort', 'created_at');
                $sortOrder = $request->get('sort_order') ?? $request->get('order', 'desc');
                $query->orderBy($sortBy, $sortOrder);

                // Pagination - support both frontend formats
                $perPage = $request->get('per_page');
                $limit = $request->get('limit');

                if ($limit && !$perPage) {
                    // For simple limit requests (like "Recent requests"), return collection
                    $requests = $query->limit($limit)->get();
                } else {
                    // For pagination requests, return paginated data
                    $perPage = $perPage ?? 15;
                    $requests = $query->paginate($perPage);
                }

                return response()->json([
                    'success' => true,
                    'data' => $requests
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recruitment requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard summary and statistics
     */
    public function dashboard(Request $request)
    {
        try {
            $clientId = $request->get('client_id');
            $year = $request->get('year', now()->year);

            // Get statistics
            $stats = RecruitmentRequest::getDashboardStats($clientId, $year);

            // Get client-grouped requests
            $clientGroupedRequests = RecruitmentRequest::getClientGroupedRequests($year);

            // Get recent requests
            $recentRequests = RecruitmentRequest::with([
                'client:id,organisation_name',
                'jobStructure:id,job_title'
            ])
                ->when($clientId, function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                })
                ->whereYear('created_at', $year)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            // Get overdue and due soon requests
            $overdueRequests = RecruitmentRequest::with(['client:id,organisation_name', 'jobStructure:id,job_title'])
                ->overdue()
                ->when($clientId, function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                })
                ->get();

            $dueSoonRequests = RecruitmentRequest::with(['client:id,organisation_name', 'jobStructure:id,job_title'])
                ->dueSoon()
                ->when($clientId, function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                })
                ->get();

            // Get monthly trend data
            $monthlyTrend = RecruitmentRequest::selectRaw('
                MONTH(created_at) as month,
                COUNT(*) as total,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) as closed
            ')
                ->whereYear('created_at', $year)
                ->when($clientId, function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                })
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'client_grouped_requests' => $clientGroupedRequests,
                    'recent_requests' => $recentRequests,
                    'overdue_requests' => $overdueRequests,
                    'due_soon_requests' => $dueSoonRequests,
                    'monthly_trend' => $monthlyTrend,
                    'filters' => [
                        'selected_client_id' => $clientId,
                        'selected_year' => $year
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new recruitment request
     */
    public function store(Request $request)
    {
        try {
            Log::info('Creating recruitment request', [
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            // Validation
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'job_structure_id' => 'required|exists:job_structures,id',
                'service_location_id' => 'required|exists:service_locations,id',
                'gender_requirement' => 'in:male,female,any',
                'religion_requirement' => 'in:christianity,islam,any',
                'age_limit_min' => 'nullable|integer|min:16|max:65',
                'age_limit_max' => 'nullable|integer|min:16|max:65|gte:age_limit_min',
                'experience_requirement' => 'nullable|string|max:1000',
                'qualifications' => 'nullable|array',
                'qualifications.*.name' => 'required|string|max:255',
                'qualifications.*.class' => 'nullable|string|max:255',
                'number_of_vacancies' => 'required|integer|min:1|max:1000',
                'compensation' => 'nullable|numeric|min:0',
                'sol_service_type' => 'required|in:MSS,RS,DSS',
                'recruitment_period_start' => 'nullable|date',
                'recruitment_period_end' => 'nullable|date|after:recruitment_period_start',
                'description' => 'nullable|string|max:2000',
                'special_requirements' => 'nullable|string|max:1000',
                'priority_level' => 'in:low,medium,high,urgent'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Auto-populate location data from service location
            $serviceLocation = ServiceLocation::with('solOffice')->find($request->service_location_id);

            // Generate ticket ID
            $ticketId = RecruitmentRequest::generateTicketId();

            // Create recruitment request
            $data = $request->all();
            $data['ticket_id'] = $ticketId;
            $data['created_by'] = Auth::id();
            $data['status'] = 'active';

            // Auto-populate location data
            if ($serviceLocation) {
                $data['lga'] = $serviceLocation->state ?? null;
                $data['zone'] = $serviceLocation->sol_zone ?? null;
                $data['sol_office_id'] = $serviceLocation->sol_office_id;
            }

            $recruitmentRequest = RecruitmentRequest::create($data);

            // Check if approval is required using centralized approval system
            $user = Auth::user();
            $userPermissions = $this->hierarchyService->getUserPermissions($user);
            $requiresApproval = !($userPermissions['can_create_without_approval'] ?? false);

            if ($requiresApproval) {
                // Create approval record via centralized system
                $approval = $this->approvalService->createApproval(
                    'App\\Models\\Recruitment\\RecruitmentRequest',
                    $recruitmentRequest->id,
                    'recruitment_request',
                    Auth::id(),
                    [
                        'ticket_id' => $ticketId,
                        'client_id' => $recruitmentRequest->client_id,
                        'job_structure_id' => $recruitmentRequest->job_structure_id,
                        'number_of_vacancies' => $recruitmentRequest->number_of_vacancies,
                        'priority' => $request->input('priority_level', 'medium'),
                    ]
                );

                // Submit for approval (assigns to approver and sends notification)
                $this->approvalService->submitForApproval($approval, 'Recruitment request created and submitted for approval');

                Log::info('Recruitment request created with approval', [
                    'recruitment_request_id' => $recruitmentRequest->id,
                    'approval_id' => $approval->id,
                    'user_id' => Auth::id(),
                ]);
            } else {
                Log::info('Recruitment request created without approval requirement', [
                    'recruitment_request_id' => $recruitmentRequest->id,
                    'user_id' => Auth::id(),
                ]);
            }

            // Load relationships for response
            $recruitmentRequest->load([
                'client:id,organisation_name',
                'jobStructure:id,job_title,job_code',
                'serviceLocation:id,location_name,city',
                'solOffice:id,office_name,office_code',
                'approval.currentApprover:id,name,email',
                'approval.workflow:id,workflow_name,total_levels'
            ]);

            DB::commit();

            // Invalidate related caches
            CacheService::invalidateTag('recruitment');
            CacheService::invalidateTag('clients');

            return response()->json([
                'success' => true,
                'message' => 'Recruitment request created successfully',
                'data' => $recruitmentRequest,
                'ticket_id' => $ticketId
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Recruitment request creation failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create recruitment request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific recruitment request
     */
    public function show($id)
    {
        try {
            $recruitmentRequest = RecruitmentRequest::with([
                'client:id,organisation_name,email,phone',
                'jobStructure:id,job_title,job_code,description,contract_type,contract_nature',
                'serviceLocation:id,location_name,city,full_address,contact_person_name,contact_person_phone',
                'solOffice:id,office_name,office_code,contact_person_name,contact_person_phone',
                'createdBy:id,name,email',
                'updatedBy:id,name,email',
                'approvedBy:id,name,email',
                'approval:id,status,current_approver_id,current_approval_level,total_approval_levels,requested_at,due_date,is_overdue,priority',
                'approval.currentApprover:id,name,email',
                'approval.requester:id,name,email',
                'approval.workflow:id,workflow_name,workflow_code,total_levels'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $recruitmentRequest
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Recruitment request not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update a recruitment request
     */
    public function update(Request $request, $id)
    {
        try {
            // Log the incoming request for debugging
            Log::info('Recruitment Request Update Attempt', [
                'request_id' => $id,
                'data' => $request->all(),
                'user_id' => Auth::id()
            ]);

            $recruitmentRequest = RecruitmentRequest::findOrFail($id);

            // Check if request can be updated (simple status check)
            if (in_array($recruitmentRequest->status, ['closed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This recruitment request cannot be updated in its current status: ' . $recruitmentRequest->status
                ], 422);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'client_id' => 'sometimes|required|exists:clients,id',
                'job_structure_id' => 'sometimes|required|exists:job_structures,id',
                'service_location_id' => 'sometimes|required|exists:service_locations,id',
                'gender_requirement' => 'sometimes|in:male,female,any',
                'religion_requirement' => 'sometimes|in:christianity,islam,any',
                'age_limit_min' => 'nullable|integer|min:16|max:65',
                'age_limit_max' => 'nullable|integer|min:16|max:65|gte:age_limit_min',
                'experience_requirement' => 'nullable|string|max:1000',
                'qualifications' => 'nullable|array',
                'qualifications.*.name' => 'required|string|max:255',
                'qualifications.*.class' => 'nullable|string|max:255',
                'number_of_vacancies' => 'sometimes|required|integer|min:1|max:1000',
                'compensation' => 'nullable|numeric|min:0',
                'sol_service_type' => 'sometimes|required|in:MSS,RS,DSS',
                'recruitment_period_start' => 'nullable|date',
                'recruitment_period_end' => 'nullable|date|after:recruitment_period_start',
                'description' => 'nullable|string|max:2000',
                'special_requirements' => 'nullable|string|max:1000',
                'priority_level' => 'sometimes|in:low,medium,high,urgent'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Update recruitment request
            $fillableFields = [
                'client_id',
                'job_structure_id',
                'service_location_id',
                'gender_requirement',
                'religion_requirement',
                'age_limit_min',
                'age_limit_max',
                'experience_requirement',
                'qualifications',
                'number_of_vacancies',
                'compensation',
                'sol_service_type',
                'recruitment_period_start',
                'recruitment_period_end',
                'description',
                'special_requirements',
                'priority_level'
            ];

            $data = $request->only($fillableFields);
            $data['updated_by'] = Auth::id();

            // Auto-populate location data if service location changed
            if ($request->has('service_location_id')) {
                $serviceLocation = DB::table('service_locations')
                    ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
                    ->where('service_locations.id', $request->service_location_id)
                    ->select('service_locations.*', 'sol_offices.id as sol_office_id')
                    ->first();

                if ($serviceLocation) {
                    $data['state'] = $serviceLocation->state ?? null;
                    $data['zone'] = $serviceLocation->sol_zone ?? null;
                    $data['sol_office_id'] = $serviceLocation->sol_office_id;
                }
            }

            $recruitmentRequest->update($data);

            // Load relationships for response
            $recruitmentRequest->load([
                'client:id,organisation_name',
                'jobStructure:id,job_title,job_code',
                'serviceLocation:id,location_name,city',
                'solOffice:id,office_name,office_code',
                'updatedBy:id,name,email'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Recruitment request updated successfully',
                'data' => $recruitmentRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error for debugging
            Log::error('Recruitment Request Update Failed', [
                'request_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update recruitment request',
                'error' => $e->getMessage(),
                'debug_info' => app()->environment('local') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Close a recruitment request
     */
    public function close(Request $request, $id)
    {
        try {
            Log::info('=== CLOSE REQUEST DEBUG ===', [
                'request_id' => $id,
                'all_data' => $request->all(),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method(),
                'raw_content' => $request->getContent()
            ]);

            $recruitmentRequest = RecruitmentRequest::findOrFail($id);

            Log::info('Found recruitment request', [
                'id' => $recruitmentRequest->id,
                'current_status' => $recruitmentRequest->status
            ]);

            // Check if request can be closed (simple status check)
            if (in_array($recruitmentRequest->status, ['closed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This recruitment request is already closed or cancelled'
                ], 422);
            }

            // Validate request  
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed in close method', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Close recruitment request
            $recruitmentRequest->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closed_reason' => $request->reason,
                'closed_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            Log::info('After update - checking status', [
                'id' => $recruitmentRequest->id,
                'new_status' => $recruitmentRequest->fresh()->status,
                'closed_at' => $recruitmentRequest->fresh()->closed_at,
                'closed_reason' => $recruitmentRequest->fresh()->closed_reason
            ]);

            // Load relationships for response
            $recruitmentRequest->load([
                'client:id,organisation_name',
                'jobStructure:id,job_title,job_code',
                'updatedBy:id,name,email'
            ]);

            DB::commit();

            Log::info('Transaction committed successfully', [
                'final_status' => $recruitmentRequest->fresh()->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recruitment request closed successfully',
                'data' => $recruitmentRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to close recruitment request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reopen a closed recruitment request
     */
    public function reopen(Request $request, $id)
    {
        try {
            Log::info('=== REOPEN REQUEST DEBUG ===', [
                'request_id' => $id,
                'all_data' => $request->all(),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method(),
                'raw_content' => $request->getContent()
            ]);

            $recruitmentRequest = RecruitmentRequest::findOrFail($id);

            Log::info('Found recruitment request for reopen', [
                'id' => $recruitmentRequest->id,
                'current_status' => $recruitmentRequest->status
            ]);

            // Check if request can be reopened
            if ($recruitmentRequest->status !== 'closed') {
                Log::error('Cannot reopen - not closed', [
                    'current_status' => $recruitmentRequest->status,
                    'expected' => 'closed'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Only closed recruitment requests can be reopened'
                ], 422);
            }

            // Validate request  
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed in reopen method', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Reopen recruitment request
            $recruitmentRequest->update([
                'status' => 'active',
                'closed_at' => null,
                'closed_reason' => null,
                'reopen_reason' => $request->reason,
                'reopened_at' => now(),
                'reopened_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            Log::info('After reopen update - checking status', [
                'id' => $recruitmentRequest->id,
                'new_status' => $recruitmentRequest->fresh()->status,
                'reopen_reason' => $recruitmentRequest->fresh()->reopen_reason,
                'reopened_at' => $recruitmentRequest->fresh()->reopened_at,
                'reopened_by' => $recruitmentRequest->fresh()->reopened_by
            ]);

            // Load relationships for response
            $recruitmentRequest->load([
                'client:id,organisation_name',
                'jobStructure:id,job_title,job_code',
                'updatedBy:id,name,email'
            ]);

            DB::commit();

            Log::info('Reopen transaction committed successfully', [
                'final_status' => $recruitmentRequest->fresh()->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Recruitment request reopened successfully',
                'data' => $recruitmentRequest
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to reopen recruitment request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================
    // HELPER ENDPOINTS
    // ========================================

    /**
     * Get job structures by client
     */
    public function getJobStructuresByClient($clientId)
    {
        try {
            Log::info('Fetching job structures for client', [
                'client_id' => $clientId,
                'user_id' => Auth::id()
            ]);

            // Check if client exists first
            $clientExists = DB::table('clients')->where('id', $clientId)->exists();
            if (!$clientExists) {
                Log::warning('Client not found', ['client_id' => $clientId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found',
                    'data' => []
                ], 404);
            }

            // Check if job_structures table exists
            $tableExists = DB::select("SHOW TABLES LIKE 'job_structures'");
            if (empty($tableExists)) {
                Log::error('job_structures table does not exist');
                return response()->json([
                    'success' => false,
                    'message' => 'Job structures table not found',
                    'data' => []
                ], 500);
            }

            // Get job structures with error handling
            $jobStructures = DB::table('job_structures')
                ->where('client_id', $clientId)
                ->where('is_active', 1)
                ->select('id', 'job_title', 'job_code', 'description', 'contract_type', 'contract_nature')
                ->orderBy('job_title')
                ->get();

            Log::info('Job structures fetched successfully', [
                'client_id' => $clientId,
                'count' => $jobStructures->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $jobStructures
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch job structures', [
                'client_id' => $clientId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job structures',
                'error' => $e->getMessage(),
                'debug_info' => app()->environment('local') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Get service locations by client
     */
    public function getServiceLocationsByClient($clientId)
    {
        try {
            Log::info('Fetching service locations for client', [
                'client_id' => $clientId,
                'user_id' => Auth::id()
            ]);

            // Check if client exists first
            $clientExists = DB::table('clients')->where('id', $clientId)->exists();
            if (!$clientExists) {
                Log::warning('Client not found', ['client_id' => $clientId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found',
                    'data' => []
                ], 404);
            }

            // Check if service_locations table exists and has data
            $tableExists = DB::select("SHOW TABLES LIKE 'service_locations'");
            if (empty($tableExists)) {
                Log::error('service_locations table does not exist');
                return response()->json([
                    'success' => false,
                    'message' => 'Service locations table not found',
                    'data' => []
                ], 500);
            }

            // Get service locations with error handling
            $serviceLocations = DB::table('service_locations')
                ->leftJoin('sol_offices', 'service_locations.sol_office_id', '=', 'sol_offices.id')
                ->where('service_locations.client_id', $clientId)
                ->where('service_locations.is_active', 1)
                ->select([
                    'service_locations.id',
                    'service_locations.location_name',
                    'service_locations.city',
                    'service_locations.state',
                    'service_locations.sol_zone',
                    'service_locations.sol_office_id',
                    'service_locations.full_address',
                    'sol_offices.office_name',
                    'sol_offices.office_code'
                ])
                ->orderBy('service_locations.location_name')
                ->get();

            Log::info('Service locations fetched successfully', [
                'client_id' => $clientId,
                'count' => $serviceLocations->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $serviceLocations
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch service locations', [
                'client_id' => $clientId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service locations',
                'error' => $e->getMessage(),
                'debug_info' => app()->environment('local') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null
            ], 500);
        }
    }

    /**
     * Get next ticket ID (for preview)
     */
    public function getNextTicketId()
    {
        try {
            $nextTicketId = RecruitmentRequest::generateTicketId();

            return response()->json([
                'success' => true,
                'data' => [
                    'ticket_id' => $nextTicketId
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate ticket ID',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recruitment request statistics
     */
    public function getStatistics(Request $request)
    {
        try {
            $clientId = $request->get('client_id');
            $year = $request->get('year', now()->year);
            $month = $request->get('month');

            $query = RecruitmentRequest::query();

            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            if ($year) {
                $query->whereYear('created_at', $year);
            }

            if ($month) {
                $query->whereMonth('created_at', $month);
            }

            $stats = [
                'by_status' => $query->clone()->groupBy('status')
                    ->selectRaw('status, COUNT(*) as count')
                    ->pluck('count', 'status'),

                'by_priority' => $query->clone()->groupBy('priority_level')
                    ->selectRaw('priority_level, COUNT(*) as count')
                    ->pluck('count', 'priority_level'),

                'by_sol_service' => $query->clone()->groupBy('sol_service_type')
                    ->selectRaw('sol_service_type, COUNT(*) as count')
                    ->pluck('count', 'sol_service_type'),

                'total_vacancies' => $query->clone()->sum('number_of_vacancies'),

                'by_client' => $query->clone()
                    ->join('clients', 'recruitment_requests.client_id', '=', 'clients.id')
                    ->groupBy('clients.organisation_name')
                    ->selectRaw('clients.organisation_name, COUNT(*) as count')
                    ->pluck('count', 'organisation_name')
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recruitment requests grouped by status with Redis caching
     */
    public function getGroupedByStatus()
    {
        try {
            // Cache key for grouped recruitment requests
            $cacheKey = 'recruitment:tickets_grouped_by_status';
            $cacheTTL = 600; // 10 minutes

            $result = Cache::remember($cacheKey, $cacheTTL, function () {
                // Get active tickets with statistics
                $activeTickets = DB::table('recruitment_requests as rr')
                    ->join('clients as cl', 'rr.client_id', '=', 'cl.id')
                    ->join('job_structures as js', 'rr.job_structure_id', '=', 'js.id')
                    ->leftJoin('candidate_job_applications as cja', 'rr.id', '=', 'cja.recruitment_request_id')
                    ->select(
                        'rr.id',
                        'rr.ticket_id',
                        'rr.description',
                        'rr.number_of_vacancies',
                        'rr.priority_level',
                        'rr.recruitment_period_end',
                        'rr.status',
                        'rr.created_at',
                        'cl.organisation_name as client_name',
                        'js.job_title as position_title',
                        DB::raw('COUNT(DISTINCT ra.id) as candidate_count'),
                        DB::raw('COUNT(DISTINCT CASE WHEN ra.status = "shortlisted" THEN ra.id END) as shortlisted_count')
                    )
                    ->where('rr.status', 'active')
                    ->groupBy(
                        'rr.id',
                        'rr.ticket_id',
                        'rr.description',
                        'rr.number_of_vacancies',
                        'rr.priority_level',
                        'rr.recruitment_period_end',
                        'rr.status',
                        'rr.created_at',
                        'cl.organisation_name',
                        'js.job_title'
                    )
                    ->orderBy('rr.created_at', 'desc')
                    ->get();

                // Get inactive tickets with closure details
                $inactiveTickets = DB::table('recruitment_requests as rr')
                    ->join('clients as cl', 'rr.client_id', '=', 'cl.id')
                    ->join('job_structures as js', 'rr.job_structure_id', '=', 'js.id')
                    ->leftJoin('candidate_job_applications as cja', 'rr.id', '=', 'cja.recruitment_request_id')
                    ->leftJoin('users as u', 'rr.closed_by', '=', 'u.id')
                    ->select(
                        'rr.id',
                        'rr.ticket_id',
                        'rr.description',
                        'rr.number_of_vacancies',
                        'rr.priority_level',
                        'rr.status',
                        'rr.created_at',
                        'rr.closed_at',
                        'rr.closure_reason',
                        'rr.staff_accepted_offer',
                        'cl.organisation_name as client_name',
                        'js.job_title as position_title',
                        DB::raw('CONCAT(u.first_name, " ", u.last_name) as closed_by_name'),
                        DB::raw('COUNT(DISTINCT ra.id) as candidate_count')
                    )
                    ->whereIn('rr.status', ['closed', 'cancelled'])
                    ->groupBy(
                        'rr.id',
                        'rr.ticket_id',
                        'rr.description',
                        'rr.number_of_vacancies',
                        'rr.priority_level',
                        'rr.status',
                        'rr.created_at',
                        'rr.closed_at',
                        'rr.closure_reason',
                        'rr.staff_accepted_offer',
                        'cl.organisation_name',
                        'js.job_title',
                        'u.first_name',
                        'u.last_name'
                    )
                    ->orderBy('rr.closed_at', 'desc')
                    ->get();

                // Calculate summary statistics
                $summary = [
                    'active_count' => $activeTickets->count(),
                    'inactive_count' => $inactiveTickets->count(),
                    'total_count' => $activeTickets->count() + $inactiveTickets->count()
                ];

                return [
                    'active_tickets' => $activeTickets,
                    'inactive_tickets' => $inactiveTickets,
                    'summary' => $summary
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Recruitment requests grouped by status retrieved successfully',
                'cached' => Cache::has($cacheKey)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve recruitment requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get closure statistics for a specific recruitment request
     */
    public function getClosureStats($id)
    {
        try {
            // Cache key for closure stats
            $cacheKey = "recruitment:closure_stats:{$id}";
            $cacheTTL = 300; // 5 minutes

            $stats = Cache::remember($cacheKey, $cacheTTL, function () use ($id) {
                $request = RecruitmentRequest::findOrFail($id);

                // Get application statistics from candidate_job_applications
                $applications = DB::table('candidate_job_applications as cja')
                    ->where('cja.recruitment_request_id', $id)
                    ->select(
                        DB::raw('COUNT(*) as total_candidates'),
                        DB::raw('COUNT(CASE WHEN cja.application_status = "under_review" THEN 1 END) as shortlisted_candidates'),
                        DB::raw('COUNT(CASE WHEN cja.application_status = "interview_completed" THEN 1 END) as interviewed_candidates'),
                        DB::raw('COUNT(CASE WHEN cja.application_status = "accepted" THEN 1 END) as offered_candidates'),
                        DB::raw('COUNT(CASE WHEN cja.application_status = "accepted" THEN 1 END) as hired_candidates')
                    )
                    ->first();

                return [
                    'total_vacancies' => $request->number_of_vacancies,
                    'total_candidates' => $applications->total_candidates ?? 0,
                    'shortlisted_candidates' => $applications->shortlisted_candidates ?? 0,
                    'interviewed_candidates' => $applications->interviewed_candidates ?? 0,
                    'offered_candidates' => $applications->offered_candidates ?? 0,
                    'hired_candidates' => $applications->hired_candidates ?? 0,
                    'unfilled_positions' => max(0, $request->number_of_vacancies - ($applications->hired_candidates ?? 0))
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Closure statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve closure statistics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Close a recruitment request
     */
    public function closeRecruitmentRequest(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'closure_reason' => 'required|in:fulfilled,expired',
            'closure_comments' => 'nullable|string|max:1000',
            'staff_accepted_offer' => 'nullable|integer|min:0',
            'expired_reason' => 'required_if:closure_reason,expired|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $recruitmentRequest = RecruitmentRequest::findOrFail($id);

            // Check if already closed
            if (in_array($recruitmentRequest->status, ['closed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recruitment request is already closed'
                ], 400);
            }

            // Update the recruitment request
            $updateData = [
                'status' => 'closed',
                'closure_reason' => $request->closure_reason,
                'closure_comments' => $request->closure_comments,
                'closed_at' => now(),
                'closed_by' => Auth::id()
            ];

            // Add staff accepted offer for expired tickets
            if ($request->closure_reason === 'expired') {
                $updateData['staff_accepted_offer'] = $request->staff_accepted_offer ?? 0;
                $updateData['expired_reason'] = $request->expired_reason;
            } else {
                // For fulfilled tickets, set staff accepted to total vacancies
                $updateData['staff_accepted_offer'] = $recruitmentRequest->number_of_vacancies;
            }

            $recruitmentRequest->update($updateData);

            // Invalidate related caches
            $this->invalidateRecruitmentCaches();

            return response()->json([
                'success' => true,
                'data' => $recruitmentRequest->fresh(),
                'message' => 'Recruitment request closed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to close recruitment request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a recruitment request
     */
    public function destroy($id)
    {
        try {
            $recruitmentRequest = RecruitmentRequest::findOrFail($id);

            // Check if request can be deleted (only allow for certain statuses)
            if (in_array($recruitmentRequest->status, ['closed', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete a recruitment request that is already closed or cancelled. Use the close functionality instead.'
                ], 422);
            }

            DB::beginTransaction();

            // Soft delete or hard delete based on business requirements
            $recruitmentRequest->delete();

            DB::commit();

            // Invalidate related caches
            CacheService::invalidateTag('recruitment');
            CacheService::invalidateTag('clients');

            return response()->json([
                'success' => true,
                'message' => 'Recruitment request deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Recruitment Request Deletion Failed', [
                'request_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete recruitment request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================
    // TICKET DELEGATION
    // ========================================

    /**
     * Assign/Delegate a recruitment request to another user
     * POST /api/recruitment-requests/{id}/assign
     */
    public function assignTicket(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assigned_to' => 'required|exists:users,id',
                'assignment_notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $ticket = RecruitmentRequest::findOrFail($id);
            $assignee = User::findOrFail($request->assigned_to);

            // Check if user has permission to assign tickets
            $currentUser = Auth::user();

            // Get user's role_id from staff_roles table
            $userRoleId = DB::table('staff_roles')
                ->where('staff_id', $currentUser->staff_profile_id)
                ->value('role_id');

            // Check recruitment hierarchy permissions
            $canAssign = DB::table('recruitment_hierarchy')
                ->where('role_id', $userRoleId)
                ->where('can_assign_ticket', 1)
                ->exists();

            if (!$canAssign) {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to assign tickets'
                ], 403);
            }

            DB::beginTransaction();

            // Update ticket assignment
            $ticket->update([
                'assigned_to' => $request->assigned_to,
                'delegated_by' => Auth::id(),
                'delegated_at' => now(),
                'delegation_notes' => $request->assignment_notes,  // Map from assignment_notes
                'requires_approval' => false  // Simplified for now
            ]);

            // Load relationships
            $ticket->load([
                'assignedTo:id,name,email',
                'delegatedBy:id,name,email',
                'client:id,organisation_name',
                'jobStructure:id,job_title,job_code'
            ]);

            DB::commit();

            // Invalidate caches
            CacheService::invalidateTag('recruitment');

            return response()->json([
                'success' => true,
                'message' => 'Ticket assigned successfully',
                'data' => $ticket
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Ticket assignment failed', [
                'error' => $e->getMessage(),
                'ticket_id' => $id,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of users who can be assigned tickets
     * GET /api/recruitment-requests/assignable-users
     */
    public function getAssignableUsers(Request $request)
    {
        try {
            $cacheKey = CacheService::generateKey('assignable_users', $request->all());

            return CacheService::rememberApiResponse($cacheKey, 'recruitment', function () use ($request) {
                // Get active Strategic Outsourcing Limited staff (user_type = 'admin')
                // with recruitment-related roles only
                // Roles: HR(3), Recruitment(7), Regional Manager(8), Implant Manager(9), 
                //        Recruitment Assistant(10), Implant Assistant(11), Regional Technician(15)

                $recruitmentRoleIds = [3, 7, 8, 9, 10, 11, 15];

                $query = User::select('users.id', 'users.name', 'users.email', 'users.user_type', 'users.staff_profile_id')
                    ->join('staff_roles', 'users.staff_profile_id', '=', 'staff_roles.staff_id')
                    ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
                    ->where('users.is_active', true)
                    ->where('users.user_type', 'admin') // Only Strategic Outsourcing Limited staff
                    ->whereIn('staff_roles.role_id', $recruitmentRoleIds)
                    ->addSelect('roles.id as role_id', 'roles.name as role_name');

                // Filter by specific role if requested
                if ($request->filled('role_id')) {
                    $query->where('staff_roles.role_id', $request->role_id);
                }

                $users = $query->orderBy('users.name')->get();

                // Format users for the TicketAssignmentModal
                // Modal expects: id, first_name, last_name, role_name, department (optional)
                $formattedUsers = $users->map(function ($user) {
                    // Split name into first and last (simple approach)
                    $nameParts = explode(' ', trim($user->name), 2);

                    return [
                        'id' => $user->id,
                        'first_name' => $nameParts[0] ?? '',
                        'last_name' => $nameParts[1] ?? '',
                        'role_name' => $user->role_name,  // From roles table
                        'department' => null,  // Not available in current schema
                        'email' => $user->email,
                        'user_type' => $user->user_type
                    ];
                });

                // Return array directly (not nested in 'all_users')
                return response()->json([
                    'success' => true,
                    'data' => $formattedUsers
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error('Failed to get assignable users', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get assignable users',
                'error' => $e->getMessage()
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
        try {
            $redis = Redis::connection();
            $keys = $redis->keys('recruitment:*');
            if (!empty($keys)) {
                $redis->del($keys);
            }
        } catch (\Exception $e) {
            // Redis operations might fail, but we shouldn't break the main functionality
            Log::warning('Failed to clear Redis cache: ' . $e->getMessage());
        }
    }
}
