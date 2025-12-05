<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\PayStructureType;
use App\Models\EmolumentComponent;
use App\Models\Client;

class SalaryStructureController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getDashboardStatistics()
    {
        try {
            $stats = [
                'job_structures' => [
                    'total' => JobStructure::count(),
                    'active' => JobStructure::where('is_active', 1)->count(),
                    'employment' => JobStructure::where('contract_type', 'employment')->count(),
                    'service' => JobStructure::where('contract_type', 'service')->count()
                ],
                'pay_grades' => [
                    'total' => PayGradeStructure::count(),
                    'active' => PayGradeStructure::where('is_active', 1)->count(),
                    'avg_compensation' => PayGradeStructure::where('is_active', 1)->avg('total_compensation') ?? 0,
                    'max_compensation' => PayGradeStructure::where('is_active', 1)->max('total_compensation') ?? 0
                ],
                'compensation_range' => [
                    'min' => PayGradeStructure::where('is_active', 1)->min('total_compensation') ?? 0,
                    'max' => PayGradeStructure::where('is_active', 1)->max('total_compensation') ?? 0,
                    'avg' => PayGradeStructure::where('is_active', 1)->avg('total_compensation') ?? 0
                ]
            ];

            // Format currency values
            foreach (['avg_compensation', 'max_compensation'] as $key) {
                $stats['pay_grades']['formatted_' . $key] = '₦' . number_format($stats['pay_grades'][$key], 2);
            }

            foreach (['min', 'max', 'avg'] as $key) {
                $stats['compensation_range']['formatted_' . $key] = '₦' . number_format($stats['compensation_range'][$key], 2);
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Dashboard statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all job structures with statistics
     */
    public function getJobStructures(Request $request)
    {
        try {
            $query = JobStructure::with(['payGrades', 'client']);

            // Apply client filter
            if ($request->has('client_id') && $request->client_id) {
                $query->where('client_id', $request->client_id);
            }

            // Apply search filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('job_title', 'like', "%{$search}%")
                        ->orWhere('job_code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->has('contract_type') && $request->contract_type) {
                $query->where('contract_type', $request->contract_type);
            }

            if ($request->has('contract_nature') && $request->contract_nature) {
                $query->where('contract_nature', $request->contract_nature);
            }

            if ($request->has('status') && $request->status !== '') {
                $query->where('is_active', $request->status == 'active' ? 1 : 0);
            }

            $perPage = $request->get('per_page', 15);
            $jobStructures = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Transform data to include computed fields
            $jobStructures->getCollection()->transform(function ($job) {
                $job->grades_count = $job->payGrades->count();
                $job->active_grades_count = $job->payGrades->where('is_active', 1)->count();
                $job->client_name = $job->client ? $job->client->organisation_name : 'N/A';

                // Get pay structure types from database
                if (!empty($job->pay_structures)) {
                    $payStructures = is_string($job->pay_structures) ? json_decode($job->pay_structures, true) : $job->pay_structures;
                    $job->pay_structure_details = PayStructureType::whereIn('type_code', $payStructures)->get();
                } else {
                    $job->pay_structure_details = [];
                }

                // Calculate average compensation
                $avgCompensation = $job->payGrades->where('is_active', 1)->avg('total_compensation') ?? 0;
                $job->average_compensation = $avgCompensation;
                $job->formatted_average_compensation = '₦' . number_format($avgCompensation, 2);

                return $job;
            });

            return response()->json([
                'success' => true,
                'data' => $jobStructures,
                'message' => 'Job structures retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching job structures: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching job structures',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job structure statistics
     */
    public function getJobStructureStatistics()
    {
        try {
            $stats = [
                'total' => JobStructure::count(),
                'active' => JobStructure::where('is_active', 1)->count(),
                'inactive' => JobStructure::where('is_active', 0)->count(),
                'by_contract_type' => [
                    'employment' => JobStructure::where('contract_type', 'employment')->count(),
                    'service' => JobStructure::where('contract_type', 'service')->count()
                ],
                'by_contract_nature' => [
                    'at_will' => JobStructure::where('contract_nature', 'at_will')->count(),
                    'tenured' => JobStructure::where('contract_nature', 'tenured')->count()
                ],
                'recent_additions' => JobStructure::where('created_at', '>=', now()->subDays(30))->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Job structure statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching job structure statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching job structure statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show single job structure
     */
    public function showJobStructure($id)
    {
        try {
            $jobStructure = JobStructure::with(['payGrades'])->findOrFail($id);

            $jobStructure->grades_count = $jobStructure->payGrades->count();
            $jobStructure->active_grades_count = $jobStructure->payGrades->where('is_active', 1)->count();

            // Get pay structure details
            if (!empty($jobStructure->pay_structures)) {
                if (is_string($jobStructure->pay_structures)) {
                    $payStructures = json_decode($jobStructure->pay_structures, true);
                } elseif (is_array($jobStructure->pay_structures)) {
                    $payStructures = $jobStructure->pay_structures;
                } else {
                    $payStructures = [];
                }
                $jobStructure->pay_structure_details = PayStructureType::whereIn('type_code', $payStructures)->get();
            } else {
                $jobStructure->pay_structure_details = [];
            }

            $avgCompensation = $jobStructure->payGrades->where('is_active', 1)->avg('total_compensation') ?? 0;
            $jobStructure->average_compensation = $avgCompensation;
            $jobStructure->formatted_average_compensation = '₦' . number_format($avgCompensation, 2);

            return response()->json([
                'success' => true,
                'data' => $jobStructure,
                'message' => 'Job structure retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching job structure: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching job structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new job structure
     */
    public function storeJobStructure(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'job_code' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('job_structures')->where(function ($query) use ($request) {
                        return $query->where('client_id', $request->client_id);
                    })
                ],
                'job_title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'contract_type' => 'required|in:employment,service',
                'contract_nature' => 'required|in:at_will,tenured',
                'pay_structures' => 'required|array|min:1',
                'pay_structures.*' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $jobStructure = JobStructure::create([
                'client_id' => $request->client_id,
                'job_code' => strtoupper($request->job_code),
                'job_title' => $request->job_title,
                'description' => $request->description,
                'contract_type' => $request->contract_type,
                'contract_nature' => $request->contract_nature,
                'pay_structures' => json_encode($request->pay_structures),
                'is_active' => $request->get('is_active', 1),
                'created_by' => null // Will be set when auth is working
            ]);

            DB::commit();

            $jobStructure->load(['payGrades', 'client']);
            $jobStructure->grades_count = 0;
            $jobStructure->client_name = $jobStructure->client ? $jobStructure->client->organisation_name : 'N/A';

            // Get pay structure details
            $jobStructure->pay_structure_details = PayStructureType::whereIn('type_code', $request->pay_structures)->get();

            return response()->json([
                'success' => true,
                'data' => $jobStructure,
                'message' => 'Job structure created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating job structure: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating job structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update job structure
     */
    public function updateJobStructure(Request $request, $id)
    {
        try {
            $jobStructure = JobStructure::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'job_code' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('job_structures')->where(function ($query) use ($jobStructure) {
                        return $query->where('client_id', $jobStructure->client_id);
                    })->ignore($id)
                ],
                'job_title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'contract_type' => 'required|in:employment,service',
                'contract_nature' => 'required|in:at_will,tenured',
                'pay_structures' => 'required|array|min:1',
                'pay_structures.*' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $jobStructure->update([
                'job_code' => strtoupper($request->job_code),
                'job_title' => $request->job_title,
                'description' => $request->description,
                'contract_type' => $request->contract_type,
                'contract_nature' => $request->contract_nature,
                'pay_structures' => json_encode($request->pay_structures),
                'is_active' => $request->get('is_active', $jobStructure->is_active),
                'updated_by' => null // Will be set when auth is working
            ]);

            DB::commit();

            $jobStructure->load(['payGrades']);
            $jobStructure->grades_count = $jobStructure->payGrades->count();
            $jobStructure->pay_structure_details = PayStructureType::whereIn('type_code', $request->pay_structures)->get();

            return response()->json([
                'success' => true,
                'data' => $jobStructure,
                'message' => 'Job structure updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating job structure: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating job structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete job structure
     */
    public function deleteJobStructure($id)
    {
        try {
            $jobStructure = JobStructure::findOrFail($id);

            // Check if job structure has associated pay grades
            if ($jobStructure->payGrades()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete job structure with existing pay grades. Please delete pay grades first.'
                ], 422);
            }

            DB::beginTransaction();
            $jobStructure->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Job structure deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting job structure: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting job structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pay grades - FIXED to handle both route patterns
     */
    public function getPayGrades(Request $request, $jobStructureId = null)
    {
        try {
            $query = PayGradeStructure::with(['jobStructure']);

            // Handle jobStructureId from URL parameter OR query parameter OR request body
            if (!$jobStructureId) {
                $jobStructureId = $request->route('jobStructureId') ?? $request->get('job_structure_id');
            }

            if ($jobStructureId) {
                $query->where('job_structure_id', $jobStructureId);
            }

            // Apply search filters
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('grade_name', 'like', "%{$search}%")
                        ->orWhere('grade_code', 'like', "%{$search}%")
                        ->orWhere('pay_structure_type', 'like', "%{$search}%");
                });
            }

            if ($request->has('pay_structure_type') && $request->pay_structure_type) {
                $query->where('pay_structure_type', $request->pay_structure_type);
            }

            if ($request->has('status') && $request->status !== '') {
                $query->where('is_active', $request->status == 'active' ? 1 : 0);
            }

            $perPage = $request->get('per_page', 15);
            $payGrades = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Transform data to include computed fields
            $payGrades->getCollection()->transform(function ($grade) {
                // Simple emolument breakdown from JSON data
                $emoluments = is_string($grade->emoluments) ? json_decode($grade->emoluments, true) : $grade->emoluments;
                $grade->emolument_breakdown = $emoluments ?? [];
                $grade->formatted_total_compensation = '₦' . number_format($grade->total_compensation, 2);

                return $grade;
            });

            return response()->json([
                'success' => true,
                'data' => $payGrades,
                'message' => 'Pay grades retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pay grades: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pay grades',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show single pay grade
     */
    public function showPayGrade($id)
    {
        try {
            $payGrade = PayGradeStructure::with(['jobStructure'])->findOrFail($id);

            $emoluments = is_string($payGrade->emoluments) ? json_decode($payGrade->emoluments, true) : $payGrade->emoluments;
            $payGrade->emolument_breakdown = $emoluments ?? [];
            $payGrade->formatted_total_compensation = '₦' . number_format($payGrade->total_compensation, 2);

            return response()->json([
                'success' => true,
                'data' => $payGrade,
                'message' => 'Pay grade retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pay grade: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pay grade',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new pay grade
     */
    public function storePayGrade(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'job_structure_id' => 'required|exists:job_structures,id',
                'grade_name' => 'required|string|max:100',
                'grade_code' => 'required|string|max:20|unique:pay_grade_structures,grade_code',
                'pay_structure_type' => 'required|string',
                'emoluments' => 'nullable|array', // Changed from 'required' to 'nullable' - can add emoluments later via bulk upload
                'currency' => 'nullable|string|max:3'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Calculate total compensation from emoluments
            $totalCompensation = 0;
            // Calculate total compensation from emoluments (if provided)
            $totalCompensation = 0;
            $emoluments = $request->emoluments ?? [];
            foreach ($emoluments as $component => $amount) {
                if (is_numeric($amount) && $amount > 0) {
                    $totalCompensation += $amount;
                }
            }

            $payGrade = PayGradeStructure::create([
                'job_structure_id' => $request->job_structure_id,
                'grade_name' => $request->grade_name,
                'grade_code' => strtoupper($request->grade_code),
                'pay_structure_type' => $request->pay_structure_type,
                'emoluments' => json_encode($emoluments), // Use the null-safe $emoluments variable
                'total_compensation' => $totalCompensation,
                'currency' => $request->get('currency', 'NGN'),
                'is_active' => $request->get('is_active', 1),
                'created_by' => null // Will be set when auth is working
            ]);

            DB::commit();

            $payGrade->load(['jobStructure']);
            $payGrade->emolument_breakdown = $emoluments; // Use the null-safe variable
            $payGrade->formatted_total_compensation = '₦' . number_format($payGrade->total_compensation, 2);

            return response()->json([
                'success' => true,
                'data' => $payGrade,
                'message' => 'Pay grade created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating pay grade: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating pay grade',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update pay grade
     */
    public function updatePayGrade(Request $request, $id)
    {
        try {
            $payGrade = PayGradeStructure::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'job_structure_id' => 'required|exists:job_structures,id',
                'grade_name' => 'required|string|max:100',
                'grade_code' => 'required|string|max:20|unique:pay_grade_structures,grade_code,' . $id,
                'pay_structure_type' => 'required|string',
                'emoluments' => 'nullable|array', // Changed from 'required' to 'nullable' - can add emoluments later via bulk upload
                'currency' => 'nullable|string|max:3'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Calculate total compensation from emoluments (if provided)
            $totalCompensation = 0;
            $emoluments = $request->emoluments ?? [];
            foreach ($emoluments as $component => $amount) {
                if (is_numeric($amount) && $amount > 0) {
                    $totalCompensation += $amount;
                }
            }

            $payGrade->update([
                'job_structure_id' => $request->job_structure_id,
                'grade_name' => $request->grade_name,
                'grade_code' => strtoupper($request->grade_code),
                'pay_structure_type' => $request->pay_structure_type,
                'emoluments' => json_encode($emoluments), // Use the null-safe $emoluments variable
                'total_compensation' => $totalCompensation,
                'currency' => $request->get('currency', $payGrade->currency),
                'is_active' => $request->get('is_active', $payGrade->is_active),
                'updated_by' => null // Will be set when auth is working
            ]);

            DB::commit();

            $payGrade->load(['jobStructure']);
            $payGrade->emolument_breakdown = $emoluments; // Use the null-safe variable
            $payGrade->formatted_total_compensation = '₦' . number_format($payGrade->total_compensation, 2);

            return response()->json([
                'success' => true,
                'data' => $payGrade,
                'message' => 'Pay grade updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating pay grade: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating pay grade',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete pay grade
     */
    public function deletePayGrade($id)
    {
        try {
            $payGrade = PayGradeStructure::findOrFail($id);

            DB::beginTransaction();
            $payGrade->delete();
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pay grade deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting pay grade: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting pay grade',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pay structure types
     */
    public function getPayStructureTypes()
    {
        try {
            $types = PayStructureType::where('is_active', 1)->orderBy('type_code')->get();

            // Simple grouping by contract type and nature
            $grouped = $types->groupBy(function ($item) {
                return $item->contract_type . '_' . $item->contract_nature;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'all' => $types,
                    'grouped' => $grouped
                ],
                'message' => 'Pay structure types retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pay structure types: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pay structure types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get emolument components
     */
    public function getEmolumentComponents()
    {
        try {
            $components = EmolumentComponent::where('is_active', 1)
                ->orderBy('display_order')
                ->orderBy('component_name')
                ->get();

            // Simple grouping by category
            $grouped = $components->groupBy('category');

            return response()->json([
                'success' => true,
                'data' => [
                    'all' => $components,
                    'grouped' => $grouped
                ],
                'message' => 'Emolument components retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching emolument components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching emolument components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get clients for dropdown
     */
    public function getClients()
    {
        try {
            $clients = Client::where('status', 'active')
                ->orderBy('organisation_name')
                ->get(['id', 'organisation_name']);

            return response()->json([
                'success' => true,
                'data' => $clients,
                'message' => 'Clients retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching clients: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================================================
    // PAYROLL PROCESSING MODULE - PAY GRADE BULK UPLOAD
    // ============================================================================

    /**
     * Download bulk emolument template for a job structure
     * 
     * Generates Excel file with pay grades as rows and components as columns
     * Users fill in amounts and upload back for bulk processing
     * 
     * @param Request $request (job_structure_id, client_id)
     * @return \Illuminate\Http\Response Excel file download
     */
    public function downloadBulkTemplate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'job_structure_id' => 'required|exists:job_structures,id',
                'client_id' => 'required|exists:clients,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Use PayGradeExcelService to generate template
            $excelService = new \App\Services\PayGradeExcelService();
            $result = $excelService->generateTemplate(
                $request->job_structure_id,
                $request->client_id
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            // Return file download
            return response()->download(
                $result['file_path'],
                $result['file_name'],
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]
            )->deleteFileAfterSend();
        } catch (\Exception $e) {
            Log::error('SalaryStructureController::downloadBulkTemplate error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error generating template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and process bulk emolument file
     * 
     * Accepts Excel file, parses data, validates, and returns preview
     * User can review preview before confirming save
     * 
     * @param Request $request (file, job_structure_id, client_id)
     * @return \Illuminate\Http\JsonResponse Preview data with validation errors
     */
    public function uploadBulkEmoluments(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|mimes:xlsx,xls|max:5120', // 5MB max
                'job_structure_id' => 'required|exists:job_structures,id',
                'client_id' => 'required|exists:clients,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Parse uploaded file
            $excelService = new \App\Services\PayGradeExcelService();
            $parseResult = $excelService->parseUploadedFile(
                $request->file('file'),
                $request->job_structure_id,
                $request->client_id
            );

            if (!$parseResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $parseResult['message'],
                    'errors' => $parseResult['errors'] ?? []
                ], 400);
            }

            // Return preview data (don't save yet - wait for confirmation)
            return response()->json([
                'success' => true,
                'data' => $parseResult['data'],
                'errors' => $parseResult['errors'] ?? [],
                'rows_processed' => $parseResult['rows_processed'],
                'message' => $parseResult['message'] . '. Review and confirm to save.',
            ]);
        } catch (\Exception $e) {
            Log::error('SalaryStructureController::uploadBulkEmoluments error: ' . $e->getMessage(), [
                'request' => $request->except('file'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirm and save bulk emoluments
     * 
     * Receives validated data from preview and saves to database
     * This is called after user reviews and confirms the upload
     * 
     * @param Request $request (data: array of pay grade emoluments)
     * @return \Illuminate\Http\JsonResponse Success/failure response
     */
    public function confirmBulkEmoluments(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'preview_data' => 'required|array',
                'preview_data.*.pay_grade_id' => 'required|exists:pay_grade_structures,id',
                'preview_data.*.emoluments' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Save emoluments
            $excelService = new \App\Services\PayGradeExcelService();
            $result = $excelService->saveEmoluments($request->preview_data);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            return response()->json([
                'success' => true,
                'updated_count' => $result['updated_count'],
                'message' => $result['message']
            ]);
        } catch (\Exception $e) {
            Log::error('SalaryStructureController::confirmBulkEmoluments error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error saving emoluments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Load universal template into a specific pay grade
     * 
     * Loads the 11 universal payroll components with zero amounts
     * User can then edit amounts manually
     * 
     * @param int $id Pay Grade ID
     * @return \Illuminate\Http\JsonResponse Success/failure response
     */
    public function loadUniversalTemplate($id)
    {
        try {
            $payGrade = PayGradeStructure::find($id);

            if (!$payGrade) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pay grade not found'
                ], 404);
            }

            // Load universal template
            $excelService = new \App\Services\PayGradeExcelService();
            $result = $excelService->loadUniversalTemplate($id);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }

            // Reload pay grade with updated emoluments
            $payGrade->refresh();

            return response()->json([
                'success' => true,
                'data' => $payGrade,
                'components_loaded' => $result['components_loaded'],
                'message' => $result['message']
            ]);
        } catch (\Exception $e) {
            Log::error('SalaryStructureController::loadUniversalTemplate error: ' . $e->getMessage(), [
                'pay_grade_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error loading template: ' . $e->getMessage()
            ], 500);
        }
    }
}
