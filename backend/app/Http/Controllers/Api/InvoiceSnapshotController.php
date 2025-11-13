<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvoiceSnapshot;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use App\Services\SafeFormulaCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class InvoiceSnapshotController extends Controller
{
    private SafeFormulaCalculator $formulaCalculator;

    public function __construct(SafeFormulaCalculator $formulaCalculator)
    {
        $this->formulaCalculator = $formulaCalculator;
    }

    /**
     * Display a listing of invoice snapshots
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InvoiceSnapshot::with(['calculationTemplate', 'exportTemplate']);

            // Apply filters
            if ($request->has('calculation_template_id')) {
                $query->where('calculation_template_id', $request->calculation_template_id);
            }

            if ($request->has('export_template_id')) {
                $query->where('export_template_id', $request->export_template_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('generated_by')) {
                $query->where('generated_by', $request->generated_by);
            }

            if ($request->has('payroll_period')) {
                $query->where('payroll_period', $request->payroll_period);
            }

            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('generated_at', [
                    $request->date_from,
                    $request->date_to
                ]);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('snapshot_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('payroll_period', 'like', "%{$search}%");
                });
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'generated_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate results
            $perPage = $request->get('per_page', 15);
            $snapshots = $query->paginate($perPage);

            // Add additional metadata
            $snapshots->getCollection()->transform(function ($snapshot) {
                $snapshot->employee_count = count($snapshot->calculation_data);
                $snapshot->total_gross = array_sum(array_column($snapshot->calculation_data, 'gross_salary'));
                $snapshot->total_net = array_sum(array_column($snapshot->calculation_data, 'net_salary'));
                return $snapshot;
            });

            return response()->json([
                'success' => true,
                'data' => $snapshots,
                'message' => 'Invoice snapshots retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving invoice snapshots: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoice snapshots',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created invoice snapshot
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'calculation_template_id' => 'required|exists:calculation_templates,id',
                'export_template_id' => 'required|exists:export_templates,id',
                'snapshot_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'payroll_period' => 'required|string|max:100',
                'employee_data' => 'required|array',
                'employee_data.*.employee_id' => 'required|string',
                'employee_data.*.employee_name' => 'required|string',
                'employee_data.*.grade' => 'required|string',
                'employee_data.*.basic_salary' => 'required|numeric|min:0',
                'processing_notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Get templates
            $calculationTemplate = CalculationTemplate::findOrFail($request->calculation_template_id);
            $exportTemplate = ExportTemplate::findOrFail($request->export_template_id);

            // Process calculations
            $calculationResults = $this->processCalculations(
                $calculationTemplate,
                $request->employee_data
            );

            if (!$calculationResults['success']) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Calculation processing failed',
                    'errors' => $calculationResults['errors']
                ], 422);
            }

            // Create snapshot
            $snapshot = InvoiceSnapshot::create([
                'calculation_template_id' => $request->calculation_template_id,
                'export_template_id' => $request->export_template_id,
                'snapshot_name' => $request->snapshot_name,
                'description' => $request->description,
                'payroll_period' => $request->payroll_period,
                'employee_data' => $request->employee_data,
                'calculation_data' => $calculationResults['data'],
                'calculation_metadata' => $calculationResults['metadata'],
                'processing_notes' => $request->processing_notes,
                'generated_by' => Auth::user()->name ?? 'system',
                'generated_at' => now(),
                'status' => 'generated'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $snapshot->load(['calculationTemplate', 'exportTemplate']),
                'message' => 'Invoice snapshot created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating invoice snapshot: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice snapshot
     */
    public function show(string $id): JsonResponse
    {
        try {
            $snapshot = InvoiceSnapshot::with(['calculationTemplate', 'exportTemplate'])
                ->findOrFail($id);

            // Add calculated metadata
            $snapshot->employee_count = count($snapshot->calculation_data);
            $snapshot->total_gross = array_sum(array_column($snapshot->calculation_data, 'gross_salary'));
            $snapshot->total_net = array_sum(array_column($snapshot->calculation_data, 'net_salary'));
            $snapshot->total_deductions = $snapshot->total_gross - $snapshot->total_net;

            return response()->json([
                'success' => true,
                'data' => $snapshot,
                'message' => 'Invoice snapshot retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice snapshot not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified invoice snapshot
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $snapshot = InvoiceSnapshot::findOrFail($id);

            // Only allow updating certain fields after generation
            $validator = Validator::make($request->all(), [
                'snapshot_name' => 'string|max:255',
                'description' => 'nullable|string',
                'processing_notes' => 'nullable|string',
                'status' => 'string|in:generated,exported,archived,cancelled'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $snapshot->update(array_merge(
                $request->validated(),
                ['updated_by' => Auth::user()->name ?? 'system']
            ));

            return response()->json([
                'success' => true,
                'data' => $snapshot->fresh()->load(['calculationTemplate', 'exportTemplate']),
                'message' => 'Invoice snapshot updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating invoice snapshot: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified invoice snapshot
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $snapshot = InvoiceSnapshot::findOrFail($id);

            // Check if snapshot can be deleted
            if ($snapshot->status === 'exported') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete exported snapshot. Archive it instead.'
                ], 400);
            }

            $snapshot->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice snapshot deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting invoice snapshot: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice snapshot',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate invoice calculations with preview
     */
    public function generateCalculations(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'calculation_template_id' => 'required|exists:calculation_templates,id',
                'employee_data' => 'required|array',
                'employee_data.*.employee_id' => 'required|string',
                'employee_data.*.employee_name' => 'required|string',
                'employee_data.*.grade' => 'required|string',
                'employee_data.*.basic_salary' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $calculationTemplate = CalculationTemplate::findOrFail($request->calculation_template_id);

            $results = $this->processCalculations(
                $calculationTemplate,
                $request->employee_data
            );

            return response()->json([
                'success' => true,
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Calculation generation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export snapshot data
     */
    public function export(Request $request, string $id): JsonResponse
    {
        try {
            $snapshot = InvoiceSnapshot::with(['calculationTemplate', 'exportTemplate'])
                ->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'format' => 'string|in:excel,pdf,csv,json',
                'include_metadata' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $format = $request->get('format', $snapshot->exportTemplate->format);
            $includeMetadata = $request->boolean('include_metadata', true);

            // Generate export data
            $exportData = $this->generateExportData($snapshot, $format, $includeMetadata);

            // Update snapshot status
            $snapshot->update([
                'status' => 'exported',
                'exported_at' => now(),
                'exported_by' => Auth::user()->name ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'data' => $exportData,
                'message' => 'Snapshot exported successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get snapshot statistics
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $query = InvoiceSnapshot::query();

            // Apply date filters
            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('generated_at', [
                    $request->date_from,
                    $request->date_to
                ]);
            }

            $stats = [
                'total_snapshots' => $query->count(),
                'by_status' => $query->groupBy('status')
                    ->selectRaw('status, count(*) as count')
                    ->pluck('count', 'status'),
                'recent_snapshots' => $query->orderBy('generated_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'snapshot_name', 'generated_at', 'status']),
                'total_employees_processed' => 0,
                'total_payroll_value' => 0
            ];

            // Calculate totals
            $allSnapshots = $query->get(['calculation_data']);
            foreach ($allSnapshots as $snapshot) {
                $stats['total_employees_processed'] += count($snapshot->calculation_data);
                $stats['total_payroll_value'] += array_sum(array_column($snapshot->calculation_data, 'net_salary'));
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive old snapshots
     */
    public function archiveOld(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'older_than_days' => 'required|integer|min:30'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $cutoffDate = now()->subDays($request->older_than_days);

            $archivedCount = InvoiceSnapshot::where('generated_at', '<', $cutoffDate)
                ->where('status', '!=', 'archived')
                ->update([
                    'status' => 'archived',
                    'archived_at' => now(),
                    'archived_by' => Auth::user()->name ?? 'system'
                ]);

            return response()->json([
                'success' => true,
                'data' => ['archived_count' => $archivedCount],
                'message' => "Successfully archived {$archivedCount} snapshots"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Archiving failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process calculations for employee data
     */
    private function processCalculations(CalculationTemplate $template, array $employeeData): array
    {
        $results = [];
        $errors = [];
        $metadata = [
            'template_used' => $template->name,
            'template_version' => $template->version,
            'processed_at' => now()->toISOString(),
            'total_employees' => count($employeeData)
        ];

        foreach ($employeeData as $index => $employee) {
            try {
                $variables = [
                    'basic_salary' => (float) $employee['basic_salary'],
                    'employee_id' => $employee['employee_id'],
                    'employee_name' => $employee['employee_name'],
                    'grade' => $employee['grade'],
                ];

                $calculations = [];

                foreach ($template->formulas as $field => $formula) {
                    try {
                        $result = $this->formulaCalculator->evaluate($formula, $variables);
                        $calculations[$field] = $result;
                        $variables[$field] = $result; // Make available for subsequent calculations
                    } catch (\Exception $e) {
                        $errors[] = "Employee {$employee['employee_id']}: Error calculating {$field} - " . $e->getMessage();
                        $calculations[$field] = 0;
                    }
                }

                $results[] = array_merge($employee, $calculations);
            } catch (\Exception $e) {
                $errors[] = "Employee {$employee['employee_id']}: " . $e->getMessage();
            }
        }

        return [
            'success' => empty($errors),
            'data' => $results,
            'metadata' => $metadata,
            'errors' => $errors
        ];
    }

    /**
     * Generate export data based on format
     */
    private function generateExportData(InvoiceSnapshot $snapshot, string $format, bool $includeMetadata): array
    {
        $exportConfig = $snapshot->exportTemplate->getExportConfiguration();

        $exportData = [
            'format' => $format,
            'snapshot_id' => $snapshot->id,
            'snapshot_name' => $snapshot->snapshot_name,
            'generated_at' => $snapshot->generated_at->toISOString(),
            'data' => $snapshot->calculation_data
        ];

        if ($includeMetadata) {
            $exportData['metadata'] = [
                'template_info' => [
                    'calculation_template' => $snapshot->calculationTemplate->name,
                    'export_template' => $snapshot->exportTemplate->name,
                ],
                'payroll_period' => $snapshot->payroll_period,
                'employee_count' => count($snapshot->calculation_data),
                'total_gross' => array_sum(array_column($snapshot->calculation_data, 'gross_salary')),
                'total_net' => array_sum(array_column($snapshot->calculation_data, 'net_salary')),
                'processing_notes' => $snapshot->processing_notes
            ];
        }

        // Apply export template formatting
        if (isset($exportConfig['columns'])) {
            $formattedData = [];
            foreach ($snapshot->calculation_data as $row) {
                $formattedRow = [];
                foreach ($exportConfig['columns'] as $field => $config) {
                    $value = $row[$field] ?? '';

                    // Apply formatting
                    if (isset($config['format']) && is_numeric($value)) {
                        $value = number_format($value, 2);
                    }

                    $formattedRow[$config['label'] ?? $field] = $value;
                }
                $formattedData[] = $formattedRow;
            }
            $exportData['formatted_data'] = $formattedData;
        }

        return $exportData;
    }
}
