<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvoiceExportTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class InvoiceExportTemplateController extends Controller
{
    /**
     * Display a listing of export templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InvoiceExportTemplate::with('client');

            // Filter by client if provided
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $templates = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Export templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching export templates: ' . $e->getMessage());
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
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'line_items' => 'required|string', // JSON string
                'excel_settings' => 'nullable|string', // JSON string
                'include_summary_sheet' => 'boolean',
                'include_breakdown_sheet' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template = InvoiceExportTemplate::create([
                'client_id' => $request->client_id,
                'template_name' => $request->template_name,
                'description' => $request->description,
                'line_items' => $request->line_items,
                'excel_settings' => $request->excel_settings,
                'include_summary_sheet' => $request->include_summary_sheet ?? true,
                'include_breakdown_sheet' => $request->include_breakdown_sheet ?? true,
                'is_active' => $request->is_active ?? true,
            ]);

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
            $template = InvoiceExportTemplate::with('client')->findOrFail($id);

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
            $template = InvoiceExportTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'client_id' => 'sometimes|required|exists:clients,id',
                'template_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'line_items' => 'sometimes|required|json',
                'excel_settings' => 'nullable|json',
                'include_summary_sheet' => 'boolean',
                'include_breakdown_sheet' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template->update($request->only([
                'client_id',
                'template_name',
                'description',
                'line_items',
                'excel_settings',
                'include_summary_sheet',
                'include_breakdown_sheet',
                'is_active',
            ]));

            return response()->json([
                'success' => true,
                'data' => $template->load('client'),
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
            $template = InvoiceExportTemplate::findOrFail($id);
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
}
