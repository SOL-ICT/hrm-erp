<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CalculationTemplateController extends Controller
{
    /**
     * Get all calculation templates
     */
    public function index()
    {
        $templates = DB::table('calculation_templates')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($templates);
    }

    /**
     * Get template by pay grade code
     */
    public function getByGradeCode($gradeCode)
    {
        $template = DB::table('calculation_templates')
            ->where('pay_grade_code', $gradeCode)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            return response()->json([
                'message' => 'No template found for this grade',
                'grade_code' => $gradeCode
            ], 404);
        }

        return response()->json($template);
    }

    /**
     * Get specific template by ID
     */
    public function show($id)
    {
        $template = DB::table('calculation_templates')->find($id);

        if (!$template) {
            return response()->json([
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json($template);
    }

    /**
     * Store a new calculation template
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'pay_grade_code' => 'required|string|max:255',
            'description' => 'nullable|string',
            'allowance_components' => 'required|string', // JSON string
            'deduction_components' => 'required|string', // JSON string
            'statutory_components' => 'required|string', // JSON string
            'salary_components' => 'nullable|string',
            'calculation_rules' => 'nullable|string',
            'annual_division_factor' => 'nullable|numeric',
            'attendance_calculation_method' => 'nullable|string',
            'prorate_salary' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
        ]);

        // Set defaults
        $validated['version'] = $validated['version'] ?? '1.0';
        $validated['salary_components'] = $validated['salary_components'] ?? '{}';
        $validated['calculation_rules'] = $validated['calculation_rules'] ?? '{}';
        $validated['annual_division_factor'] = $validated['annual_division_factor'] ?? 12;
        $validated['attendance_calculation_method'] = $validated['attendance_calculation_method'] ?? 'working_days';
        $validated['prorate_salary'] = $validated['prorate_salary'] ?? true;
        $validated['minimum_attendance_factor'] = 0.50;
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['is_default'] = $validated['is_default'] ?? false;
        $validated['created_by'] = Auth::check() ? Auth::user()->name : 'system';
        $validated['created_at'] = now();
        $validated['updated_at'] = now();

        try {
            $id = DB::table('calculation_templates')->insertGetId($validated);

            $template = DB::table('calculation_templates')->find($id);

            Log::info('Calculation template created', [
                'id' => $id,
                'name' => $validated['name'],
                'pay_grade_code' => $validated['pay_grade_code']
            ]);

            return response()->json($template, 201);
        } catch (\Exception $e) {
            Log::error('Error creating calculation template', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'message' => 'Error creating template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing calculation template
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'pay_grade_code' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'allowance_components' => 'sometimes|required|string',
            'deduction_components' => 'sometimes|required|string',
            'statutory_components' => 'sometimes|required|string',
            'salary_components' => 'nullable|string',
            'calculation_rules' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
        ]);

        $validated['updated_by'] = Auth::check() ? Auth::user()->name : 'system';
        $validated['updated_at'] = now();

        try {
            $updated = DB::table('calculation_templates')
                ->where('id', $id)
                ->update($validated);

            if (!$updated) {
                return response()->json([
                    'message' => 'Template not found'
                ], 404);
            }

            $template = DB::table('calculation_templates')->find($id);

            Log::info('Calculation template updated', [
                'id' => $id,
                'updated_fields' => array_keys($validated)
            ]);

            return response()->json($template);
        } catch (\Exception $e) {
            Log::error('Error updating calculation template', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Error updating template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a calculation template
     */
    public function destroy($id)
    {
        try {
            // Soft delete by setting is_active = false
            $updated = DB::table('calculation_templates')
                ->where('id', $id)
                ->update([
                    'is_active' => false,
                    'updated_by' => Auth::check() ? Auth::user()->name : 'system',
                    'updated_at' => now()
                ]);

            if (!$updated) {
                return response()->json([
                    'message' => 'Template not found'
                ], 404);
            }

            Log::info('Calculation template deleted', ['id' => $id]);

            return response()->json([
                'message' => 'Template deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting calculation template', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Error deleting template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all components from all templates (for palette)
     */
    public function getAllComponents()
    {
        $templates = DB::table('calculation_templates')
            ->where('is_active', true)
            ->get();

        $allComponents = [
            'allowances' => [],
            'deductions' => [],
            'statutory' => []
        ];

        foreach ($templates as $template) {
            // Parse allowances
            $allowances = json_decode($template->allowance_components, true);
            foreach ($allowances as $key => $value) {
                $allComponents['allowances'][$key] = [
                    'label' => ucwords(str_replace('_', ' ', $key)),
                    'formula' => $value['formula'],
                    'description' => $value['description']
                ];
            }

            // Parse deductions
            $deductions = json_decode($template->deduction_components, true);
            foreach ($deductions as $key => $value) {
                $allComponents['deductions'][$key] = [
                    'label' => ucwords(str_replace('_', ' ', $key)),
                    'formula' => $value['formula'],
                    'description' => $value['description']
                ];
            }

            // Parse statutory
            $statutory = json_decode($template->statutory_components, true);
            foreach ($statutory as $key => $value) {
                $allComponents['statutory'][$key] = [
                    'label' => ucwords(str_replace('_', ' ', $key)),
                    'formula' => $value['formula'],
                    'description' => $value['description']
                ];
            }
        }

        return response()->json($allComponents);
    }
}
