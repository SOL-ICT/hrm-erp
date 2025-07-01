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
                'total_jobs' => DB::table('job_opportunities')->count(),
                'active_jobs' => DB::table('job_opportunities')->where('status', 'active')->count(),
                'jobs_closing_soon' => DB::table('job_opportunities')
                    ->where('application_deadline', '<=', now()->addDays(7))
                    ->where('status', 'active')
                    ->count(),

                // Application statistics
                'total_applications' => DB::table('job_applications')->count(),
                'pending_applications' => DB::table('job_applications')->where('status', 'pending')->count(),
                'applications_today' => DB::table('job_applications')
                    ->whereDate('applied_at', today())
                    ->count(),

                // Candidate statistics
                'total_candidates' => DB::table('candidates')->count(),
                'verified_candidates' => DB::table('candidates')
                    ->whereNotNull('account_verified_at')
                    ->count(),

                // Interview statistics
                'interviews_scheduled' => DB::table('job_interviews')
                    ->where('status', 'scheduled')
                    ->count(),
                'interviews_today' => DB::table('job_interviews')
                    ->whereDate('interview_date', today())
                    ->count(),

                // Monthly metrics
                'hired_this_month' => DB::table('job_applications')
                    ->where('status', 'hired')
                    ->whereMonth('updated_at', now()->month)
                    ->whereYear('updated_at', now()->year)
                    ->count(),
                'applications_this_month' => DB::table('job_applications')
                    ->whereMonth('applied_at', now()->month)
                    ->whereYear('applied_at', now()->year)
                    ->count(),
            ];

            // Recent applications
            $recent_applications = DB::table('job_applications')
                ->join('candidates', 'job_applications.candidate_id', '=', 'candidates.id')
                ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                ->join('clients', 'job_opportunities.client_id', '=', 'clients.id')
                ->select(
                    'job_applications.id',
                    'job_applications.status',
                    'job_applications.applied_at',
                    'candidates.first_name',
                    'candidates.last_name',
                    'candidates.email',
                    'job_opportunities.title as job_title',
                    'clients.name as client_name'
                )
                ->orderBy('job_applications.applied_at', 'desc')
                ->limit(10)
                ->get();

            // Upcoming interviews
            $upcoming_interviews = DB::table('job_interviews')
                ->join('job_applications', 'job_interviews.job_application_id', '=', 'job_applications.id')
                ->join('candidates', 'job_applications.candidate_id', '=', 'candidates.id')
                ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                ->leftJoin('staff', 'job_interviews.interviewer_id', '=', 'staff.id')
                ->select(
                    'job_interviews.id',
                    'job_interviews.interview_date',
                    'job_interviews.interview_type',
                    'job_interviews.location',
                    'job_interviews.status',
                    'candidates.first_name',
                    'candidates.last_name',
                    'job_opportunities.title as job_title',
                    DB::raw('CONCAT(staff.first_name, " ", staff.last_name) as interviewer_name')
                )
                ->where('job_interviews.interview_date', '>', now())
                ->orderBy('job_interviews.interview_date', 'asc')
                ->limit(10)
                ->get();

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
                ->leftJoin('states_lgas', 'clients.state_lga_id', '=', 'states_lgas.id')
                ->select(
                    'clients.*',
                    'states_lgas.state_name',
                    'states_lgas.lga_name',
                    DB::raw('(SELECT COUNT(*) FROM staff WHERE staff.client_id = clients.id AND staff.status = "active") as active_staff_count'),
                    DB::raw('(SELECT COUNT(*) FROM job_opportunities WHERE job_opportunities.client_id = clients.id AND job_opportunities.status = "active") as active_jobs_count')
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
            'state_lga_id' => 'nullable|exists:states_lgas,id',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
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
            $validated['slug'] = Str::slug($validated['name']);
            $validated['created_at'] = now();
            $validated['updated_at'] = now();

            $clientId = DB::table('clients')->insertGetId($validated);

            // Create default staff types for the client
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
            $jobs = DB::table('job_opportunities')
                ->join('clients', 'job_opportunities.client_id', '=', 'clients.id')
                ->leftJoin('job_categories', 'job_opportunities.job_category_id', '=', 'job_categories.id')
                ->leftJoin('states_lgas', 'job_opportunities.state_lga_id', '=', 'states_lgas.id')
                ->leftJoin('staff', 'job_opportunities.created_by', '=', 'staff.id')
                ->select(
                    'job_opportunities.*',
                    'clients.name as client_name',
                    'clients.client_code',
                    'job_categories.name as category_name',
                    'states_lgas.state_name',
                    'states_lgas.lga_name',
                    DB::raw('CONCAT(staff.first_name, " ", staff.last_name) as created_by_name'),
                    DB::raw('(SELECT COUNT(*) FROM job_applications WHERE job_applications.job_opportunity_id = job_opportunities.id) as applications_count'),
                    DB::raw('(SELECT COUNT(*) FROM job_applications WHERE job_applications.job_opportunity_id = job_opportunities.id AND job_applications.status = "pending") as pending_applications'),
                    DB::raw('(SELECT COUNT(*) FROM job_applications WHERE job_applications.job_opportunity_id = job_opportunities.id AND job_applications.status = "hired") as hired_count')
                )
                ->orderBy('job_opportunities.created_at', 'desc')
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
                ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                ->join('clients', 'job_opportunities.client_id', '=', 'clients.id')
                ->leftJoin('staff as reviewer', 'job_applications.reviewed_by', '=', 'reviewer.id')
                ->select(
                    'job_applications.*',
                    'candidates.first_name',
                    'candidates.last_name',
                    'candidates.email as candidate_email',
                    'candidates.phone as candidate_phone',
                    'job_opportunities.title as job_title',
                    'job_opportunities.job_code',
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
                ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                ->select(
                    'job_applications.*',
                    'candidates.first_name',
                    'candidates.last_name',
                    'job_opportunities.title as job_title'
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
                'total_jobs' => DB::table('job_opportunities')->where('client_id', $clientId)->count(),
                'active_jobs' => DB::table('job_opportunities')->where('client_id', $clientId)->where('status', 'active')->count(),
                'total_applications' => DB::table('job_applications')
                    ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                    ->where('job_opportunities.client_id', $clientId)
                    ->count(),
                'pending_applications' => DB::table('job_applications')
                    ->join('job_opportunities', 'job_applications.job_opportunity_id', '=', 'job_opportunities.id')
                    ->where('job_opportunities.client_id', $clientId)
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
