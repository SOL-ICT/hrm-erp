<?php

namespace App\Http\Controllers;

use App\Models\OfferLetterTemplate;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class OfferLetterTemplateController extends Controller
{
    /**
     * Get offer letter template for specific grade
     */
    public function getForGrade(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|integer|exists:clients,id',
                'job_structure_id' => 'required|integer|exists:job_structures,id',
                'pay_grade_structure_id' => 'required|integer|exists:pay_grade_structures,id'
            ]);

            $template = OfferLetterTemplate::with(['client', 'jobStructure', 'payGradeStructure'])
                ->forGrade($request->client_id, $request->job_structure_id, $request->pay_grade_structure_id)
                ->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'No offer letter template found for this pay grade',
                    'data' => null
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Offer letter template retrieved successfully',
                'data' => [
                    'template' => $template,
                    'sections_count' => $template->getSectionsCount(),
                    'variables_count' => $template->getVariablesCount(),
                    'client_name' => $template->client->organisation_name,
                    'job_category_name' => $template->jobStructure->job_title,
                    'pay_grade_name' => $template->payGradeStructure->pay_grade
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving offer letter template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve offer letter template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new offer letter template
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'client_id' => 'required|integer|exists:clients,id',
                'job_structure_id' => 'required|integer|exists:job_structures,id',
                'pay_grade_structure_id' => 'required|integer|exists:pay_grade_structures,id',
                'header' => 'nullable|array',
                'content' => 'nullable|string',
                'footer' => 'nullable|array',
                'variables' => 'nullable|array',
                'description' => 'nullable|string'
            ]);

            // Check if template already exists for this grade combination
            $existingTemplate = OfferLetterTemplate::forGrade(
                $request->client_id,
                $request->job_structure_id,
                $request->pay_grade_structure_id
            )->first();

            if ($existingTemplate) {
                return response()->json([
                    'success' => false,
                    'message' => 'An offer letter template already exists for this pay grade. Each grade can only have one template.',
                    'data' => $existingTemplate
                ], 409);
            }

            DB::beginTransaction();

            // Load pay grade to generate variables if needed
            $payGrade = PayGradeStructure::find($request->pay_grade_structure_id);

            $template = OfferLetterTemplate::create([
                'name' => $request->name,
                'client_id' => $request->client_id,
                'job_structure_id' => $request->job_structure_id,
                'pay_grade_structure_id' => $request->pay_grade_structure_id,
                'header_config' => $request->header ?? ['logo' => true, 'date' => true],
                'content' => $request->input('content', ''),
                'footer_config' => $request->footer ?? ['candidate_signature' => true, 'agent_declaration' => true],
                'variables' => $request->variables ?? $this->generateVariablesFromPayGrade($payGrade),
                'description' => $request->description,
                'status' => 'active',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            $template->load(['client', 'jobStructure', 'payGradeStructure']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer letter template created successfully',
                'data' => $template
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating offer letter template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create offer letter template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update existing offer letter template
     */
    public function update(Request $request, OfferLetterTemplate $template): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'header' => 'nullable|array',
                'content' => 'nullable|string',
                'footer' => 'nullable|array',
                'variables' => 'nullable|array',
                'description' => 'nullable|string',
                'status' => ['sometimes', Rule::in(['draft', 'active', 'archived'])]
            ]);

            DB::beginTransaction();

            $template->update([
                'name' => $request->name ?? $template->name,
                'header_config' => $request->header ?? $template->header_config,
                'content' => $request->input('content') ?? $template->content,
                'footer_config' => $request->footer ?? $template->footer_config,
                'variables' => $request->variables ?? $template->variables,
                'description' => $request->description ?? $template->description,
                'status' => $request->status ?? $template->status,
                'updated_by' => Auth::id()
            ]);

            $template->load(['client', 'jobStructure', 'payGradeStructure']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer letter template updated successfully',
                'data' => $template
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating offer letter template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update offer letter template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete offer letter template
     */
    public function destroy(OfferLetterTemplate $template): JsonResponse
    {
        try {
            DB::beginTransaction();

            $template->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Offer letter template deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting offer letter template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete offer letter template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get salary components for specific pay grade
     */
    public function getPayGradeSalaryComponents(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pay_grade_id' => 'required|integer|exists:pay_grade_structures,id'
            ]);

            $payGrade = PayGradeStructure::find($request->pay_grade_id);
            $components = [];

            // Map pay grade fields to component names
            $salaryFields = [
                'basic_salary' => 'Basic Salary',
                'housing_allowance' => 'Housing Allowance',
                'transport_allowance' => 'Transport Allowance',
                'medical_allowance' => 'Medical Allowance'
            ];

            foreach ($salaryFields as $field => $label) {
                if ($payGrade->$field && $payGrade->$field > 0) {
                    $components[] = [
                        'component_name' => $label,
                        'amount' => $payGrade->$field,
                        'type' => 'fixed',
                        'variable_key' => $field
                    ];
                }
            }

            // Calculate net salary
            $totalSalary = array_sum(array_column($components, 'amount'));
            if ($totalSalary > 0) {
                $components[] = [
                    'component_name' => 'Net Salary',
                    'amount' => $totalSalary,
                    'type' => 'calculated',
                    'variable_key' => 'net_salary'
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Salary components retrieved successfully',
                'data' => $components
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving salary components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve salary components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate template variables from pay grade
     */
    private function generateVariablesFromPayGrade(PayGradeStructure $payGrade): array
    {
        $variables = OfferLetterTemplate::getDefaultVariables();

        // Add salary component variables based on pay grade
        $salaryFields = [
            'basic_salary' => 'Basic Salary',
            'housing_allowance' => 'Housing Allowance',
            'transport_allowance' => 'Transport Allowance',
            'medical_allowance' => 'Medical Allowance'
        ];

        foreach ($salaryFields as $field => $label) {
            if ($payGrade->$field && $payGrade->$field > 0) {
                $variables[] = [
                    'key' => $field,
                    'label' => $label,
                    'type' => 'naira',
                    'default_value' => $payGrade->$field
                ];
            }
        }

        return $variables;
    }

    /**
     * Get salary components for pay grade
     */
    public function getSalaryComponents(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'pay_grade_id' => 'required|integer|exists:pay_grade_structures,id'
            ]);

            $payGrade = PayGradeStructure::with('jobStructure')->findOrFail($request->pay_grade_id);
            
            $components = [];
            
            // Parse emoluments JSON to extract salary components
            if ($payGrade->emoluments) {
                $emoluments = $payGrade->emoluments;
                
                // If it's a string, decode it; otherwise use it as-is
                if (is_string($emoluments)) {
                    $emoluments = json_decode($emoluments, true);
                }

                if (is_array($emoluments)) {
                    foreach ($emoluments as $key => $value) {
                        if ($value && $value > 0) {
                            $components[] = [
                                'component_name' => $this->formatComponentName($key),
                                'amount' => (float) $value,
                                'variable_key' => $key,
                                'type' => 'allowance'
                            ];
                        }
                    }
                }
            }

            // Add net salary calculation
            $totalAmount = array_sum(array_column($components, 'amount'));
            if ($totalAmount > 0) {
                $components[] = [
                    'component_name' => 'Net Salary',
                    'amount' => $totalAmount,
                    'variable_key' => 'net_salary',
                    'type' => 'calculated'
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Salary components retrieved successfully',
                'data' => $components,
                'pay_grade_info' => [
                    'grade_name' => $payGrade->grade_name,
                    'total_compensation' => $payGrade->total_compensation,
                    'job_title' => $payGrade->jobStructure->job_title ?? null
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving salary components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve salary components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format component name for display
     */
    private function formatComponentName(string $key): string
    {
        return ucwords(str_replace('_', ' ', $key));
    }

    /**
     * Generate offer letter preview
     */
    public function generatePreview(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'template_id' => 'required|integer|exists:offer_letter_templates,id',
                'candidate_data' => 'required|array'
            ]);

            $template = OfferLetterTemplate::with(['client', 'jobStructure', 'payGradeStructure'])
                ->findOrFail($request->template_id);

            // Process template with candidate data
            $processedSections = $this->processTemplateVariables($template->sections, $request->candidate_data);

            return response()->json([
                'success' => true,
                'message' => 'Preview generated successfully',
                'data' => [
                    'processed_sections' => $processedSections,
                    'header_config' => $template->header_config,
                    'footer_config' => $template->footer_config,
                    'template_info' => [
                        'client_name' => $template->client->organisation_name,
                        'job_title' => $template->jobStructure->job_title,
                        'pay_grade' => $template->payGradeStructure->pay_grade
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating preview: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate preview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process template variables in content
     */
    private function processTemplateVariables(array $sections, array $candidateData): array
    {
        foreach ($sections as &$section) {
            if (is_string($section['content'])) {
                foreach ($candidateData as $key => $value) {
                    $section['content'] = str_replace("{{$key}}", $value, $section['content']);
                }
            }
        }

        return $sections;
    }
}
