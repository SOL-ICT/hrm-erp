<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExportTemplate;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ExportTemplateController extends Controller
{
    /**
     * Display a listing of export templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ExportTemplate::with('client');

            // Apply filters
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->has('format')) {
                $query->where('format', $request->format);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('is_default')) {
                $query->where('is_default', $request->boolean('is_default'));
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('organisation_name', 'like', "%{$search}%");
                        });
                });
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate results
            $perPage = $request->get('per_page', 15);
            $templates = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Export templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving export templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve export templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created export template
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'format' => 'required|string|in:excel,pdf,csv,json',
                'column_mappings' => 'required|array',
                'formatting_rules' => 'required|array',
                'grouping_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'numeric|between:0,100',
                'fee_calculation_rules' => 'nullable|array',
                'header_config' => 'nullable|array',
                'footer_config' => 'nullable|array',
                'styling_config' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate column mappings
            $columnValidation = $this->validateColumnMappingsInternal($request->column_mappings);
            if (!$columnValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Column mappings validation failed',
                    'errors' => $columnValidation['errors']
                ], 422);
            }

            $template = ExportTemplate::create(array_merge(
                $request->validated(),
                [
                    'created_by' => Auth::user()->name ?? 'system',
                    'version' => '1.0'
                ]
            ));

            return response()->json([
                'success' => true,
                'data' => $template->load('client'),
                'message' => 'Export template created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create export template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified export template
     */
    public function show(string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::with('client')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Export template retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export template not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified export template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'client_id' => 'exists:clients,id',
                'name' => 'string|max:255',
                'description' => 'nullable|string',
                'format' => 'string|in:excel,pdf,csv,json',
                'column_mappings' => 'array',
                'formatting_rules' => 'array',
                'grouping_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'numeric|between:0,100',
                'fee_calculation_rules' => 'nullable|array',
                'header_config' => 'nullable|array',
                'footer_config' => 'nullable|array',
                'styling_config' => 'nullable|array',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate column mappings if provided
            if ($request->has('column_mappings')) {
                $columnValidation = $this->validateColumnMappingsInternal($request->column_mappings);
                if (!$columnValidation['valid']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Column mappings validation failed',
                        'errors' => $columnValidation['errors']
                    ], 422);
                }
            }

            $template->update(array_merge(
                $request->validated(),
                ['updated_by' => Auth::user()->name ?? 'system']
            ));

            return response()->json([
                'success' => true,
                'data' => $template->fresh()->load('client'),
                'message' => 'Export template updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update export template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified export template
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::findOrFail($id);

            // Check if template is being used
            $usageCount = $template->invoiceSnapshots()->count();
            if ($usageCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete template. It is used in {$usageCount} invoice snapshots."
                ], 400);
            }

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Export template deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete export template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get templates by client
     */
    public function getByClient(string $clientId): JsonResponse
    {
        try {
            $templates = ExportTemplate::forClient($clientId)
                ->active()
                ->orderBy('is_default', 'desc')
                ->orderBy('version', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get supported export formats
     */
    public function getSupportedFormats(): JsonResponse
    {
        $formats = ExportTemplate::getSupportedFormats();

        return response()->json([
            'success' => true,
            'data' => $formats,
            'message' => 'Supported formats retrieved successfully'
        ]);
    }

    /**
     * Validate column mappings
     */
    public function validateColumnMappings(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'column_mappings' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $validation = $this->validateColumnMappingsInternal($request->column_mappings);

            return response()->json([
                'success' => true,
                'data' => $validation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Column mappings validation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview export with sample data
     */
    public function preview(Request $request, string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'sample_data' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $sampleData = $request->sample_data;
            $exportConfig = $template->getExportConfiguration();

            // Generate preview based on template configuration
            $preview = $this->generateExportPreview($exportConfig, $sampleData);

            return response()->json([
                'success' => true,
                'data' => [
                    'template_id' => $id,
                    'export_config' => $exportConfig,
                    'preview' => $preview
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Preview generation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new version of template
     */
    public function createNewVersion(Request $request, string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::findOrFail($id);

            $newVersion = $template->createNewVersion($request->all());

            return response()->json([
                'success' => true,
                'data' => $newVersion->load('client'),
                'message' => 'New template version created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create new version',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set template as default for its client
     */
    public function setAsDefault(string $id): JsonResponse
    {
        try {
            $template = ExportTemplate::findOrFail($id);
            $template->setAsDefault();

            return response()->json([
                'success' => true,
                'data' => $template->fresh()->load('client'),
                'message' => 'Template set as default successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to set template as default',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Internal method to validate column mappings
     */
    private function validateColumnMappingsInternal(array $mappings): array
    {
        $errors = [];
        $requiredFields = [
            'employee_name',
            'employee_id',
            'gross_salary',
            'total_deductions',
            'net_salary'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($mappings[$field])) {
                $errors[] = "Required field '{$field}' is missing from column mappings";
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'required_fields' => $requiredFields,
            'provided_fields' => array_keys($mappings)
        ];
    }

    /**
     * Generate export preview
     */
    private function generateExportPreview(array $config, array $sampleData): array
    {
        $preview = [
            'format' => $config['format'],
            'columns' => [],
            'sample_rows' => [],
            'styling' => $config['branding']['styling'] ?? []
        ];

        // Generate column headers based on mappings
        foreach ($config['columns'] as $field => $mapping) {
            $preview['columns'][] = [
                'field' => $field,
                'label' => $mapping['label'] ?? ucfirst(str_replace('_', ' ', $field)),
                'type' => $mapping['type'] ?? 'text',
                'format' => $mapping['format'] ?? null
            ];
        }

        // Generate sample rows (first 3 records)
        $sampleRows = array_slice($sampleData, 0, 3);
        foreach ($sampleRows as $row) {
            $previewRow = [];
            foreach ($config['columns'] as $field => $mapping) {
                $value = $row[$field] ?? '';

                // Apply formatting if specified
                if (isset($mapping['format']) && is_numeric($value)) {
                    $value = number_format($value, 2);
                }

                $previewRow[$field] = $value;
            }
            $preview['sample_rows'][] = $previewRow;
        }

        return $preview;
    }
}
