<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BulkUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BulkUploadController extends Controller
{
    private BulkUploadService $bulkUploadService;

    public function __construct(BulkUploadService $bulkUploadService)
    {
        $this->bulkUploadService = $bulkUploadService;
    }

    /**
     * Upload calculation templates in bulk
     */
    public function uploadCalculationTemplates(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
                'dry_run' => 'boolean',
                'replace_existing' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $options = [
                'dry_run' => $request->boolean('dry_run', false),
                'replace_existing' => $request->boolean('replace_existing', false)
            ];

            $result = $this->bulkUploadService->processCalculationTemplateUpload(
                $request->file('file'),
                $options
            );

            $statusCode = $result['success'] ? 200 : 422;

            return response()->json($result, $statusCode);
        } catch (\Exception $e) {
            Log::error('Bulk calculation template upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload export templates in bulk
     */
    public function uploadExportTemplates(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
                'dry_run' => 'boolean',
                'replace_existing' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $options = [
                'dry_run' => $request->boolean('dry_run', false),
                'replace_existing' => $request->boolean('replace_existing', false)
            ];

            $result = $this->bulkUploadService->processExportTemplateUpload(
                $request->file('file'),
                $options
            );

            $statusCode = $result['success'] ? 200 : 422;

            return response()->json($result, $statusCode);
        } catch (\Exception $e) {
            Log::error('Bulk export template upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload employee data for payroll processing
     */
    public function uploadEmployeeData(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
                'calculation_template_id' => 'required|exists:calculation_templates,id',
                'preview_only' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $options = [
                'preview_only' => $request->boolean('preview_only', false)
            ];

            $result = $this->bulkUploadService->processEmployeeDataUpload(
                $request->file('file'),
                $request->calculation_template_id,
                $options
            );

            $statusCode = $result['success'] ? 200 : 422;

            return response()->json($result, $statusCode);
        } catch (\Exception $e) {
            Log::error('Bulk employee data upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample template files
     */
    public function downloadSample(string $type): JsonResponse
    {
        try {
            $samples = $this->bulkUploadService->generateSampleFiles();

            if (!isset($samples[$type])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid sample type',
                    'available_types' => array_keys($samples)
                ], 404);
            }

            $sampleData = $samples[$type];

            return response()->json([
                'success' => true,
                'data' => $sampleData,
                'message' => 'Sample template generated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate sample',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate upload file without processing
     */
    public function validateUpload(Request $request, string $type): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Perform validation based on type
            switch ($type) {
                case 'calculation-templates':
                    $result = $this->bulkUploadService->processCalculationTemplateUpload(
                        $request->file('file'),
                        ['dry_run' => true]
                    );
                    break;

                case 'export-templates':
                    $result = $this->bulkUploadService->processExportTemplateUpload(
                        $request->file('file'),
                        ['dry_run' => true]
                    );
                    break;

                case 'employee-data':
                    if (!$request->has('calculation_template_id')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'calculation_template_id is required for employee data validation'
                        ], 422);
                    }

                    $result = $this->bulkUploadService->processEmployeeDataUpload(
                        $request->file('file'),
                        $request->calculation_template_id,
                        ['preview_only' => true]
                    );
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid validation type',
                        'available_types' => ['calculation-templates', 'export-templates', 'employee-data']
                    ], 404);
            }

            return response()->json([
                'success' => true,
                'validation_result' => $result,
                'message' => 'File validation completed'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview upload results without saving
     */
    public function previewUpload(Request $request, string $type): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,xlsx,xls|max:10240'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generate preview based on type
            switch ($type) {
                case 'calculation-templates':
                    $result = $this->bulkUploadService->processCalculationTemplateUpload(
                        $request->file('file'),
                        ['dry_run' => true]
                    );
                    break;

                case 'export-templates':
                    $result = $this->bulkUploadService->processExportTemplateUpload(
                        $request->file('file'),
                        ['dry_run' => true]
                    );
                    break;

                case 'employee-data':
                    if (!$request->has('calculation_template_id')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'calculation_template_id is required for employee data preview'
                        ], 422);
                    }

                    $result = $this->bulkUploadService->processEmployeeDataUpload(
                        $request->file('file'),
                        $request->calculation_template_id,
                        ['preview_only' => true]
                    );
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid preview type',
                        'available_types' => ['calculation-templates', 'export-templates', 'employee-data']
                    ], 404);
            }

            return response()->json([
                'success' => true,
                'preview' => $result,
                'message' => 'Preview generated successfully'
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
     * Get upload statistics and status
     */
    public function getUploadStatistics(): JsonResponse
    {
        try {
            // This could be extended to track upload history
            $stats = [
                'recent_uploads' => [],
                'total_uploads_today' => 0,
                'success_rate' => 100.0,
                'common_errors' => []
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Upload statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
