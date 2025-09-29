<?php

namespace App\Http\Controllers;

use App\Models\InvoiceTemplate;
use App\Models\Client;
use App\Models\PayGradeStructure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class InvoiceTemplateController extends Controller
{
    /**
     * Display a listing of invoice templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InvoiceTemplate::with(['client', 'payGradeStructure']);

            // Filter by client if provided
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            // Filter by pay grade if provided
            if ($request->has('pay_grade_structure_id')) {
                $query->where('pay_grade_structure_id', $request->pay_grade_structure_id);
            }

            // Filter by active status
            if ($request->has('active_only') && $request->boolean('active_only')) {
                $query->active();
            }

            // Filter by default templates
            if ($request->has('default_only') && $request->boolean('default_only')) {
                $query->default();
            }

            $templates = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Invoice templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created invoice template
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'custom_components' => 'required|array',
                'statutory_components' => 'required|array',
                'calculation_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'nullable|numeric|min:0|max:100',
                'attendance_calculation_method' => [
                    'required',
                    Rule::in(['working_days', 'calendar_days'])
                ],
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'nullable|numeric|min:0|max:1',
                'is_active' => 'boolean',
                'is_default' => 'boolean',
            ]);

            // Add creator information
            $validatedData['created_by'] = Auth::user()->email ?? 'system';

            // If setting as default, unset existing defaults for this client-grade combination
            if ($validatedData['is_default'] ?? false) {
                InvoiceTemplate::where('client_id', $validatedData['client_id'])
                    ->where('pay_grade_structure_id', $validatedData['pay_grade_structure_id'])
                    ->update(['is_default' => false]);
            }

            $template = InvoiceTemplate::create($validatedData);
            $template->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice template created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice template
     */
    public function show(string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::with(['client', 'payGradeStructure'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice template retrieved successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified invoice template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::findOrFail($id);

            $validatedData = $request->validate([
                'template_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'custom_components' => 'sometimes|required|array',
                'statutory_components' => 'sometimes|required|array',
                'calculation_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'nullable|numeric|min:0|max:100',
                'attendance_calculation_method' => [
                    'sometimes',
                    'required',
                    Rule::in(['working_days', 'calendar_days'])
                ],
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'nullable|numeric|min:0|max:1',
                'is_active' => 'boolean',
                'is_default' => 'boolean',
            ]);

            // Add updater information
            $validatedData['updated_by'] = Auth::user()->email ?? 'system';

            // If setting as default, unset existing defaults for this client-grade combination
            if (isset($validatedData['is_default']) && $validatedData['is_default']) {
                InvoiceTemplate::where('client_id', $template->client_id)
                    ->where('pay_grade_structure_id', $template->pay_grade_structure_id)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }

            $template->update($validatedData);
            $template->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice template updated successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified invoice template
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice template deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get default template for specific client and pay grade
     */
    public function getDefaultTemplate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|exists:clients,id',
                'pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
            ]);

            $template = InvoiceTemplate::with(['client', 'payGradeStructure'])
                ->forClientAndGrade($request->client_id, $request->pay_grade_structure_id)
                ->default()
                ->active()
                ->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'No default template found for the specified client and pay grade'
                ], 404);
            }

            // Mark as used
            $template->markAsUsed();

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Default template retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching default template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch default template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clone an existing template
     */
    public function clone(string $id, Request $request): JsonResponse
    {
        try {
            $originalTemplate = InvoiceTemplate::findOrFail($id);

            $validatedData = $request->validate([
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_default' => 'boolean',
            ]);

            // Create new template with cloned data
            $clonedData = $originalTemplate->toArray();
            unset($clonedData['id'], $clonedData['created_at'], $clonedData['updated_at'], $clonedData['last_used_at']);

            $clonedData = array_merge($clonedData, $validatedData);
            $clonedData['created_by'] = Auth::user()->email ?? 'system';
            $clonedData['is_default'] = $validatedData['is_default'] ?? false;

            // If setting as default, unset existing defaults
            if ($clonedData['is_default']) {
                InvoiceTemplate::where('client_id', $clonedData['client_id'])
                    ->where('pay_grade_structure_id', $clonedData['pay_grade_structure_id'])
                    ->update(['is_default' => false]);
            }

            $clonedTemplate = InvoiceTemplate::create($clonedData);
            $clonedTemplate->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $clonedTemplate,
                'message' => 'Invoice template cloned successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error cloning invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clone invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
