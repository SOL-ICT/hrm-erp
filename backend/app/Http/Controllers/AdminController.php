<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Check if current user has admin access
     */
    private function checkAdminAccess()
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        // Check if user is staff and has admin role
        $staff = DB::table('staff')->where('email', $user->email)->first();
        if (!$staff) {
            return false;
        }

        // Check if staff has admin role
        $hasAdminRole = DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $staff->id)
            ->whereIn('roles.slug', ['super-admin', 'admin'])
            ->exists();

        return $hasAdminRole;
    }

    /**
     * Get dashboard statistics
     */
    public function getStats()
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $stats = [
                // Client statistics
                'total_clients' => DB::table('clients')->count(),
                'active_clients' => DB::table('clients')->where('status', 'active')->count(),
                'contracts_expiring_soon' => DB::table('clients')
                    ->where('contract_end_date', '<=', now()->addMonths(3))
                    ->where('status', 'active')
                    ->count(),

                // Staff statistics
                'total_staff' => DB::table('staff')->count(),
                'active_staff' => DB::table('staff')->where('status', 'active')->count(),
                'staff_on_probation' => DB::table('staff')->where('appointment_status', 'probation')->count(),

                // Job statistics
                'total_jobs' => DB::table('recruitment_requests')->count(),
                'active_jobs' => DB::table('recruitment_requests')->where('status', 'active')->count(),
                'jobs_closing_soon' => DB::table('recruitment_requests')
                    ->where('recruitment_period_end', '<=', now()->addDays(7))
                    ->where('status', 'active')
                    ->count(),

                // Application statistics
                'total_applications' => DB::table('candidate_job_applications')->count(),
                'pending_applications' => DB::table('candidate_job_applications')->where('application_status', 'applied')->count(),
                'applications_today' => DB::table('candidate_job_applications')
                    ->whereDate('applied_at', today())
                    ->count(),

                // Candidate statistics
                'total_candidates' => DB::table('candidates')->count(),
                'verified_candidates' => DB::table('candidates')
                    ->whereNotNull('account_verified_at')
                    ->count(),

                // Interview statistics - Using interview_invitations table
                'interviews_scheduled' => DB::table('interview_invitations')->count(),
                'interviews_completed' => DB::table('interview_invitations')->where('status', 'completed')->count(),
                'interviews_today' => DB::table('interview_invitations')
                    ->whereDate('interview_date', today())
                    ->count(),

                // Monthly metrics
                'hired_this_month' => DB::table('candidate_job_applications')
                    ->where('application_status', 'accepted')
                    ->whereMonth('updated_at', now()->month)
                    ->whereYear('updated_at', now()->year)
                    ->count(),
                'applications_this_month' => DB::table('candidate_job_applications')
                    ->whereMonth('applied_at', now()->month)
                    ->whereYear('applied_at', now()->year)
                    ->count(),
            ];

            // Recent applications
            $recent_applications = DB::table('candidate_job_applications')
                ->join('candidates', 'candidate_job_applications.candidate_id', '=', 'candidates.id')
                ->join('recruitment_requests', 'candidate_job_applications.recruitment_request_id', '=', 'recruitment_requests.id')
                ->join('clients', 'recruitment_requests.client_id', '=', 'clients.id')
                ->join('job_structures', 'recruitment_requests.job_structure_id', '=', 'job_structures.id')
                ->select(
                    'candidate_job_applications.id',
                    'candidate_job_applications.application_status as status',
                    'candidate_job_applications.applied_at',
                    'candidates.first_name',
                    'candidates.last_name',
                    'candidates.email',
                    'job_structures.title as job_title',
                    'clients.name as client_name'
                )
                ->orderBy('candidate_job_applications.applied_at', 'desc')
                ->limit(10)
                ->get();

            // Upcoming interviews - TODO: Update when interview system is migrated to new application system
            $upcoming_interviews = collect(); // Empty collection since interview system needs migration

            return response()->json([
                'status' => 'success',
                'data' => [
                    'stats' => $stats,
                    'recent_applications' => $recent_applications,
                    'upcoming_interviews' => $upcoming_interviews
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all clients
     */
    public function getClients()
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $clients = DB::table('clients')
                //    ->leftJoin('service_locations', 'clients.id', '=', 'service_locations.client_id')
                ->select(
                    'clients.*',
                    //             'service_locations.state',
                    // 'service_locations.city',
                    DB::raw('(SELECT COUNT(*) FROM staff WHERE staff.client_id = clients.id AND staff.status = "active") as active_staff_count'),
                    DB::raw('(SELECT COUNT(*) FROM recruitment_requests WHERE recruitment_requests.client_id = clients.id AND recruitment_requests.status = "active") as active_jobs_count')
                )
                ->orderBy('clients.name')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $clients
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch clients: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new client
     */
    public function createClient(Request $request)
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:clients',
            'client_code' => 'required|string|max:20|unique:clients',
            'prefix' => 'required|string|max:10|unique:clients',
            'address' => 'nullable|string',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'reg_no' => 'nullable|string|max:50',
            'industry_category' => 'required|string|max:100',
            'client_category' => 'required|string|max:100',
            'client_status' => 'required|in:Client,Sundry Customer',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status' => 'in:active,inactive,suspended',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        try {
            $validated = $validator->validated();
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logo = $request->file('logo');
                $logoName = time() . '_' . $validated['client_code'] . '.' . $logo->getClientOriginalExtension();
                $logoPath = $logo->storeAs('clients/logos', $logoName, 'public');
            }
            $configuration = [
                'contact_person' => $validated['contact_person'],
                'email' => $validated['email'],
                'industry_category' => $validated['industry_category'],
                'client_category' => $validated['client_category'],
                'client_status' => $validated['client_status'],
                'reg_no' => $validated['reg_no'],
                'logo_path' => $logoPath,
            ];
            $clientId = DB::table('clients')->insertGetId([
                'client_code' => strtoupper($validated['client_code']),
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
                'prefix' => strtoupper($validated['prefix']),
                'address' => $validated['address'],
                'configuration' => json_encode($configuration),
                'status' => $validated['status'] ?? 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            // Create default staff types
            $staffTypes = [
                ['type_code' => 'MGR', 'title' => 'Manager', 'description' => 'Management positions'],
                ['type_code' => 'SUP', 'title' => 'Supervisor', 'description' => 'Supervisory positions'],
                ['type_code' => 'STF', 'title' => 'Staff', 'description' => 'General staff positions'],
                ['type_code' => 'INT', 'title' => 'Intern', 'description' => 'Internship positions'],
            ];
            foreach ($staffTypes as $type) {
                DB::table('client_staff_types')->insert([
                    'client_id' => $clientId,
                    'type_code' => $type['type_code'],
                    'title' => $type['title'],
                    'description' => $type['description'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            $client = DB::table('clients')->find($clientId);
            $client->configuration = json_decode($client->configuration, true);
            return response()->json([
                'status' => 'success',
                'message' => 'Client created successfully',
                'data' => $client
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create client: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all jobs
     */
    public function getJobs()
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $jobs = DB::table('recruitment_requests')
                ->join('clients', 'recruitment_requests.client_id', '=', 'clients.id')
                ->join('job_structures', 'recruitment_requests.job_structure_id', '=', 'job_structures.id')
                ->join('service_locations', 'recruitment_requests.service_location_id', '=', 'service_locations.id')
                ->leftJoin('users', 'recruitment_requests.created_by', '=', 'users.id')
                ->select(
                    'recruitment_requests.*',
                    'clients.name as client_name',
                    'clients.client_code',
                    'job_structures.title as job_title',
                    'job_structures.job_category',
                    'service_locations.state',
                    'service_locations.lga',
                    DB::raw('CONCAT(users.first_name, " ", users.last_name) as created_by_name'),
                    DB::raw('(SELECT COUNT(*) FROM candidate_job_applications WHERE candidate_job_applications.recruitment_request_id = recruitment_requests.id) as applications_count'),
                    DB::raw('(SELECT COUNT(*) FROM candidate_job_applications WHERE candidate_job_applications.recruitment_request_id = recruitment_requests.id AND candidate_job_applications.application_status = "applied") as pending_applications'),
                    DB::raw('(SELECT COUNT(*) FROM candidate_job_applications WHERE candidate_job_applications.recruitment_request_id = recruitment_requests.id AND candidate_job_applications.application_status = "accepted") as hired_count')
                )
                ->orderBy('recruitment_requests.created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $jobs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch jobs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new job
     */
    public function createJob(Request $request)
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'job_category_id' => 'nullable|exists:job_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'salary_range_min' => 'nullable|numeric|min:0',
            'salary_range_max' => 'nullable|numeric|min:0|gte:salary_range_min',
            'employment_type' => 'required|in:full_time,part_time,contract,intern,temporary',
            'experience_level' => 'required|in:entry,junior,mid,senior,executive',
            'location' => 'nullable|string|max:255',
            'state_lga_id' => 'nullable|exists:states_lgas,id',
            'application_deadline' => 'nullable|date|after:today',
            'positions_available' => 'integer|min:1',
            'status' => 'in:draft,active,paused,closed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            // Generate job code
            $client = DB::table('clients')->find($validated['client_id']);
            $jobCount = DB::table('job_opportunities')->where('client_id', $validated['client_id'])->count() + 1;
            $jobCode = $client->prefix . '-' . str_pad($jobCount, 3, '0', STR_PAD_LEFT);

            $validated['job_code'] = $jobCode;
            $validated['slug'] = Str::slug($validated['title'] . '-' . $jobCode);

            // Get current admin staff
            $user = Auth::user();
            $adminStaff = DB::table('staff')->where('email', $user->email)->first();
            $validated['created_by'] = $adminStaff->id;

            // Set published_at if status is active
            if ($validated['status'] === 'active') {
                $validated['published_at'] = now();
            }

            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            $jobId = DB::table('job_opportunities')->insertGetId($validated);

            // Get the created job with related data
            $job = DB::table('job_opportunities')
                ->join('clients', 'job_opportunities.client_id', '=', 'clients.id')
                ->leftJoin('job_categories', 'job_opportunities.job_category_id', '=', 'job_categories.id')
                ->select('job_opportunities.*', 'clients.name as client_name', 'job_categories.name as category_name')
                ->where('job_opportunities.id', $jobId)
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Job created successfully',
                'data' => $job
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create job: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all applications
     */
    public function getApplications()
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $applications = DB::table('job_applications')
                ->join('candidates', 'job_applications.candidate_id', '=', 'candidates.id')
                ->join('recruitment_requests', 'job_applications.recruitment_request_id', '=', 'recruitment_requests.id')
                ->join('clients', 'recruitment_requests.client_id', '=', 'clients.id')
                ->leftJoin('staff as reviewer', 'job_applications.reviewed_by', '=', 'reviewer.id')
                ->select(
                    'job_applications.*',
                    'candidates.first_name',
                    'candidates.last_name',
                    'candidates.email as candidate_email',
                    'candidates.phone as candidate_phone',
                    'recruitment_requests.description as job_title',
                    'recruitment_requests.ticket_id as job_code',
                    'clients.name as client_name',
                    DB::raw('CONCAT(reviewer.first_name, " ", reviewer.last_name) as reviewed_by_name'),
                    DB::raw('(SELECT COUNT(*) FROM job_interviews WHERE job_interviews.job_application_id = job_applications.id) as interviews_count')
                )
                ->orderBy('job_applications.applied_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $applications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch applications: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update application status
     */
    public function updateApplicationStatus(Request $request, $applicationId)
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,reviewing,shortlisted,interviewed,offered,hired,rejected,withdrawn',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = DB::table('job_applications')->find($applicationId);
            if (!$application) {
                return response()->json(['error' => 'Application not found'], 404);
            }

            $validated = $validator->validated();

            // Get current admin staff
            $user = Auth::user();
            $adminStaff = DB::table('staff')->where('email', $user->email)->first();

            $updateData = [
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? $application->notes,
                'reviewed_by' => $adminStaff->id,
                'reviewed_at' => now(),
                'updated_at' => now()
            ];

            DB::table('job_applications')
                ->where('id', $applicationId)
                ->update($updateData);

            $updatedApplication = DB::table('job_applications')
                ->join('candidates', 'job_applications.candidate_id', '=', 'candidates.id')
                ->join('recruitment_requests', 'job_applications.recruitment_request_id', '=', 'recruitment_requests.id')
                ->select(
                    'job_applications.*',
                    'candidates.first_name',
                    'candidates.last_name',
                    'recruitment_requests.description as job_title'
                )
                ->where('job_applications.id', $applicationId)
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Application status updated successfully',
                'data' => $updatedApplication
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update application status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Schedule interview
     */
    public function scheduleInterview(Request $request, $applicationId)
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $validator = Validator::make($request->all(), [
            'interview_type' => 'required|in:phone,video,in_person,group,panel',
            'interview_date' => 'required|date|after:now',
            'location' => 'nullable|string|max:255',
            'interviewer_id' => 'nullable|exists:staff,id',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = DB::table('job_applications')->find($applicationId);
            if (!$application) {
                return response()->json(['error' => 'Application not found'], 404);
            }

            $validated = $validator->validated();
            $validated['job_application_id'] = $applicationId;
            $validated['status'] = 'scheduled';
            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            $interviewId = DB::table('job_interviews')->insertGetId($validated);

            // Update application status to interviewed
            DB::table('job_applications')
                ->where('id', $applicationId)
                ->update([
                    'status' => 'interviewed',
                    'updated_at' => now()
                ]);

            $interview = DB::table('job_interviews')
                ->leftJoin('staff', 'job_interviews.interviewer_id', '=', 'staff.id')
                ->select(
                    'job_interviews.*',
                    DB::raw('CONCAT(staff.first_name, " ", staff.last_name) as interviewer_name')
                )
                ->where('job_interviews.id', $interviewId)
                ->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Interview scheduled successfully',
                'data' => $interview
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to schedule interview: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job categories
     */
    public function getJobCategories()
    {
        try {
            $categories = DB::table('job_categories')
                ->where('is_active', true)
                ->orderBy('name')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch job categories: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff list (for interviewers, etc.)
     */
    public function getStaff()
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $staff = DB::table('staff')
                ->join('clients', 'staff.client_id', '=', 'clients.id')
                ->leftJoin('client_staff_types', 'staff.staff_type_id', '=', 'client_staff_types.id')
                ->select(
                    'staff.*',
                    'clients.name as client_name',
                    'client_staff_types.title as staff_type_title',
                    DB::raw('CONCAT(staff.first_name, " ", staff.last_name) as full_name')
                )
                ->where('staff.status', 'active')
                ->orderBy('staff.first_name')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch staff: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard overview for specific client
     */
    public function getClientDashboard($clientId)
    {
        if (!$this->checkAdminAccess()) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            $client = DB::table('clients')->find($clientId);
            if (!$client) {
                return response()->json(['error' => 'Client not found'], 404);
            }

            $stats = [
                'total_staff' => DB::table('staff')->where('client_id', $clientId)->count(),
                'active_staff' => DB::table('staff')->where('client_id', $clientId)->where('status', 'active')->count(),
                'total_jobs' => DB::table('recruitment_requests')->where('client_id', $clientId)->count(),
                'active_jobs' => DB::table('recruitment_requests')->where('client_id', $clientId)->where('status', 'active')->count(),
                'total_applications' => DB::table('job_applications')
                    ->join('recruitment_requests', 'job_applications.recruitment_request_id', '=', 'recruitment_requests.id')
                    ->where('recruitment_requests.client_id', $clientId)
                    ->count(),
                'pending_applications' => DB::table('job_applications')
                    ->join('recruitment_requests', 'job_applications.recruitment_request_id', '=', 'recruitment_requests.id')
                    ->where('recruitment_requests.client_id', $clientId)
                    ->where('job_applications.status', 'pending')
                    ->count(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'client' => $client,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch client dashboard: ' . $e->getMessage()
            ], 500);
        }
    }
}
