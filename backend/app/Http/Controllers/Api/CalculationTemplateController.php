<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalculationTemplate;
use App\Services\SafeFormulaCalculator;
use App\Services\TemplateFormulaConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CalculationTemplateController extends Controller
{
    private SafeFormulaCalculator $calculator;
    private TemplateFormulaConverter $converter;

    public function __construct(SafeFormulaCalculator $calculator, TemplateFormulaConverter $converter)
    {
        $this->calculator = $calculator;
        $this->converter = $converter;
    }

    /**
     * Display a listing of calculation templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = CalculationTemplate::query();

            // Apply filters
            if ($request->has('pay_grade_code')) {
                $query->where('pay_grade_code', $request->pay_grade_code);
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
                        ->orWhere('pay_grade_code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
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
                'message' => 'Calculation templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving calculation templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve calculation templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created calculation template
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'pay_grade_code' => 'required|string|max:50',
                'description' => 'nullable|string',
                'salary_components' => 'required|array',
                'allowance_components' => 'required|array',
                'deduction_components' => 'required|array',
                'statutory_components' => 'required|array',
                'calculation_rules' => 'required|array',
                'annual_division_factor' => 'numeric|min:1|max:12',
                'attendance_calculation_method' => 'string|in:working_days,calendar_days',
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'numeric|between:0,1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate formulas in components
            $validationResult = $this->validateTemplateFormulas($request->all());
            if (!$validationResult['success']) {
                return response()->json($validationResult, 422);
            }

            $template = CalculationTemplate::create(array_merge(
                $request->validated(),
                [
                    'created_by' => Auth::user()->name ?? 'system',
                    'version' => '1.0'
                ]
            ));

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Calculation template created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating calculation template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create calculation template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified calculation template
     */
    public function show(string $id): JsonResponse
    {
        try {
            $template = CalculationTemplate::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Calculation template retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Calculation template not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified calculation template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $template = CalculationTemplate::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'string|max:255',
                'pay_grade_code' => 'string|max:50',
                'description' => 'nullable|string',
                'salary_components' => 'array',
                'allowance_components' => 'array',
                'deduction_components' => 'array',
                'statutory_components' => 'array',
                'calculation_rules' => 'array',
                'annual_division_factor' => 'numeric|min:1|max:12',
                'attendance_calculation_method' => 'string|in:working_days,calendar_days',
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'numeric|between:0,1',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate formulas if component data is being updated
            if ($request->hasAny(['salary_components', 'allowance_components', 'deduction_components', 'statutory_components'])) {
                $validationResult = $this->validateTemplateFormulas($request->all());
                if (!$validationResult['success']) {
                    return response()->json($validationResult, 422);
                }
            }

            $template->update(array_merge(
                $request->validated(),
                ['updated_by' => Auth::user()->name ?? 'system']
            ));

            return response()->json([
                'success' => true,
                'data' => $template->fresh(),
                'message' => 'Calculation template updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating calculation template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update calculation template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified calculation template
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $template = CalculationTemplate::findOrFail($id);

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
                'message' => 'Calculation template deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting calculation template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete calculation template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get templates by pay grade
     */
    public function getByPayGrade(string $gradeCode): JsonResponse
    {
        try {
            $templates = CalculationTemplate::forPayGrade($gradeCode)
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
     * Validate formula syntax
     */
    public function validateFormula(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'formula' => 'required|string',
                'variables' => 'array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $formula = $request->formula;
            $variables = $request->get('variables', []);

            $issues = $this->calculator->validateFormula($formula, $variables);
            $isValid = empty($issues);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => $isValid,
                    'issues' => $issues,
                    'variables_used' => $this->calculator->extractVariables($formula)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Formula validation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test calculation with sample data
     */
    public function testCalculation(Request $request, string $id): JsonResponse
    {
        try {
            $template = CalculationTemplate::findOrFail($id);

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
            $results = [];

            // Test each component type
            foreach (['salary_components', 'allowance_components', 'deduction_components', 'statutory_components'] as $componentType) {
                $components = $template->$componentType ?? [];

                foreach ($components as $component) {
                    if (isset($component['formula'])) {
                        $testResult = $this->calculator->testFormula($component['formula'], $sampleData);
                        $results[$componentType][] = [
                            'name' => $component['name'] ?? 'unknown',
                            'formula' => $component['formula'],
                            'result' => $testResult
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'template_id' => $id,
                    'sample_data' => $sampleData,
                    'test_results' => $results
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test calculation failed',
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
            $template = CalculationTemplate::findOrFail($id);

            $newVersion = $template->createNewVersion($request->all());

            return response()->json([
                'success' => true,
                'data' => $newVersion,
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
     * Set template as default for its pay grade
     */
    public function setAsDefault(string $id): JsonResponse
    {
        try {
            $template = CalculationTemplate::findOrFail($id);
            $template->setAsDefault();

            return response()->json([
                'success' => true,
                'data' => $template->fresh(),
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
     * Validate formulas in template components
     */
    private function validateTemplateFormulas(array $data): array
    {
        $allIssues = [];

        $componentTypes = ['salary_components', 'allowance_components', 'deduction_components', 'statutory_components'];

        foreach ($componentTypes as $type) {
            if (!isset($data[$type])) continue;

            foreach ($data[$type] as $index => $component) {
                if (isset($component['formula'])) {
                    $issues = $this->calculator->validateFormula($component['formula']);
                    if (!empty($issues)) {
                        $allIssues["{$type}[{$index}]"] = $issues;
                    }
                }
            }
        }

        if (!empty($allIssues)) {
            return [
                'success' => false,
                'message' => 'Formula validation failed',
                'formula_errors' => $allIssues
            ];
        }

        return ['success' => true];
    }
}
