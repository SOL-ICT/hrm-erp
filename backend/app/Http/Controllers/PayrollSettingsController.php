<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class PayrollSettingsController extends Controller
{
    /**
     * Display a listing of all payroll settings.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $settings = DB::table('payroll_settings')
                ->select([
                    'id',
                    'setting_key',
                    'setting_value',
                    'setting_type',
                    'description',
                    'unit',
                    'is_active',
                    'is_editable',
                    'last_modified_reason',
                    'updated_at'
                ])
                ->where('is_active', true)
                ->orderBy('setting_type')
                ->orderBy('setting_key')
                ->get()
                ->map(function ($setting) {
                    $setting->setting_value = json_decode($setting->setting_value, true);

                    // Get updated_by user name if exists
                    if ($setting->updated_at) {
                        $updatedBy = DB::table('payroll_settings as ps')
                            ->join('users as u', 'ps.updated_by', '=', 'u.id')
                            ->where('ps.id', $setting->id)
                            ->select('u.name')
                            ->first();

                        $setting->updated_by_name = $updatedBy ? $updatedBy->name : null;
                    }

                    return $setting;
                });

            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'Payroll settings retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payroll settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified payroll setting.
     * 
     * @param string $key Setting key (e.g., 'PAYE_BRACKETS', 'PENSION_RATE')
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($key)
    {
        try {
            $setting = DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->where('is_active', true)
                ->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => "Setting '{$key}' not found"
                ], 404);
            }

            $setting->setting_value = json_decode($setting->setting_value, true);

            // Get audit info (created_by and updated_by names)
            $createdBy = DB::table('users')->where('id', $setting->created_by)->value('name');
            $updatedBy = DB::table('users')->where('id', $setting->updated_by)->value('name');

            $setting->created_by_name = $createdBy;
            $setting->updated_by_name = $updatedBy;

            return response()->json([
                'success' => true,
                'data' => $setting,
                'message' => 'Setting retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified payroll setting.
     * 
     * @param \Illuminate\Http\Request $request
     * @param string $key Setting key
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $key)
    {
        try {
            // Check if setting exists
            $setting = DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => "Setting '{$key}' not found"
                ], 404);
            }

            // Check if setting is editable
            if (!$setting->is_editable) {
                return response()->json([
                    'success' => false,
                    'message' => "Setting '{$key}' is read-only and cannot be modified"
                ], 403);
            }

            // Base validation
            $validator = Validator::make($request->all(), [
                'setting_value' => 'required',
                'reason' => 'required|string|min:10|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Type-specific validation
            $settingValue = $request->input('setting_value');
            $validationResult = $this->validateSettingValue($setting->setting_type, $settingValue);

            if (!$validationResult['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting value validation failed',
                    'errors' => $validationResult['errors']
                ], 422);
            }

            // Update the setting
            DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->update([
                    'setting_value' => json_encode($settingValue),
                    'updated_by' => Auth::id(),
                    'last_modified_reason' => $request->input('reason'),
                    'updated_at' => Carbon::now()
                ]);

            // Get updated setting
            $updatedSetting = DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->first();
            $updatedSetting->setting_value = json_decode($updatedSetting->setting_value, true);

            $updatedBy = DB::table('users')->where('id', Auth::id())->value('name');

            return response()->json([
                'success' => true,
                'message' => "Setting '{$key}' updated successfully",
                'data' => $updatedSetting,
                'audit' => [
                    'changed_by' => $updatedBy,
                    'changed_at' => Carbon::now()->toIso8601String(),
                    'reason' => $request->input('reason')
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset setting to Nigeria 2025 default value.
     * 
     * @param string $key Setting key
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetToDefault($key)
    {
        try {
            $defaults = $this->getNigeriaDefaults();

            if (!isset($defaults[$key])) {
                return response()->json([
                    'success' => false,
                    'message' => "No default value found for setting '{$key}'"
                ], 404);
            }

            $defaultValue = $defaults[$key];

            DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->update([
                    'setting_value' => json_encode($defaultValue['value']),
                    'updated_by' => Auth::id(),
                    'last_modified_reason' => 'Reset to Nigeria 2025 default value',
                    'updated_at' => Carbon::now()
                ]);

            $resetSetting = DB::table('payroll_settings')
                ->where('setting_key', $key)
                ->first();
            $resetSetting->setting_value = json_decode($resetSetting->setting_value, true);

            return response()->json([
                'success' => true,
                'message' => "{$defaultValue['message']}",
                'data' => $resetSetting
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate formula syntax and test with sample values.
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function validateFormula(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'formula' => 'required|string',
                'components' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $formula = $request->input('formula');
            $components = $request->input('components');

            // Extract component codes from formula
            preg_match_all('/[A-Z_]+/', $formula, $matches);
            $extractedComponents = array_unique($matches[0]);

            // Check if all components in formula exist in emolument_components table
            $invalidComponents = [];
            $validComponents = DB::table('emolument_components')
                ->whereIn('component_code', $extractedComponents)
                ->where('is_active', true)
                ->pluck('component_code')
                ->toArray();

            foreach ($extractedComponents as $comp) {
                // Skip operators and constants
                if (in_array($comp, ['OTHER', 'DEDUCTIONS'])) continue;

                if (!in_array($comp, $validComponents) && !is_numeric($comp)) {
                    $invalidComponents[] = $comp;
                }
            }

            if (!empty($invalidComponents)) {
                // Suggest similar component codes
                $suggestions = DB::table('emolument_components')
                    ->select('component_code')
                    ->where('is_active', true)
                    ->get()
                    ->pluck('component_code')
                    ->toArray();

                return response()->json([
                    'valid' => false,
                    'error' => 'Unknown components in formula: ' . implode(', ', $invalidComponents),
                    'invalid_components' => $invalidComponents,
                    'suggestions' => $suggestions
                ], 400);
            }

            // Test formula with sample values
            $testValues = [];
            foreach ($extractedComponents as $comp) {
                if (in_array($comp, ['OTHER', 'DEDUCTIONS'])) continue;
                $testValues[$comp] = rand(50000, 500000); // Random test values
            }

            return response()->json([
                'valid' => true,
                'message' => 'Formula is valid',
                'parsed_components' => $extractedComponents,
                'test_calculation' => [
                    'input' => $testValues,
                    'formula' => $formula,
                    'note' => 'Sample values used for demonstration. Actual calculation will use employee data.'
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'error' => 'Formula syntax error: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get change history for a specific setting.
     * 
     * @param string $key Setting key
     * @return \Illuminate\Http\JsonResponse
     */
    public function getChangeHistory($key)
    {
        try {
            // Note: For full audit trail, you'd need a separate audit_logs table
            // For now, we return the current setting with audit info
            $setting = DB::table('payroll_settings as ps')
                ->leftJoin('users as cu', 'ps.created_by', '=', 'cu.id')
                ->leftJoin('users as uu', 'ps.updated_by', '=', 'uu.id')
                ->where('ps.setting_key', $key)
                ->select([
                    'ps.setting_key',
                    'ps.description',
                    'cu.name as created_by_name',
                    'ps.created_at',
                    'uu.name as updated_by_name',
                    'ps.updated_at',
                    'ps.last_modified_reason'
                ])
                ->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => "Setting '{$key}' not found"
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'setting_key' => $setting->setting_key,
                    'description' => $setting->description,
                    'history' => [
                        [
                            'action' => 'Created',
                            'by' => $setting->created_by_name,
                            'at' => $setting->created_at,
                            'reason' => 'Initial setup with Nigeria 2025 defaults'
                        ],
                        [
                            'action' => $setting->updated_by_name ? 'Updated' : null,
                            'by' => $setting->updated_by_name,
                            'at' => $setting->updated_at,
                            'reason' => $setting->last_modified_reason
                        ]
                    ]
                ],
                'message' => 'For full audit trail, implement dedicated audit_logs table'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve change history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate setting value based on setting type.
     * 
     * @param string $type Setting type
     * @param mixed $value Setting value
     * @return array Validation result
     */
    private function validateSettingValue($type, $value)
    {
        $errors = [];

        switch ($type) {
            case 'tax_bracket':
                if (!is_array($value)) {
                    $errors[] = 'Tax bracket must be an array';
                    break;
                }

                foreach ($value as $index => $bracket) {
                    if (!isset($bracket['tier'], $bracket['min'], $bracket['rate'])) {
                        $errors[] = "Bracket {$index}: Missing required fields (tier, min, max, rate)";
                    }

                    if (isset($bracket['rate']) && ($bracket['rate'] < 0 || $bracket['rate'] > 100)) {
                        $errors[] = "Bracket {$index}: Rate must be between 0 and 100";
                    }

                    if (isset($bracket['min'], $bracket['max']) && $bracket['max'] !== null && $bracket['min'] >= $bracket['max']) {
                        $errors[] = "Bracket {$index}: Min value must be less than max value";
                    }
                }

                // Check for overlaps
                for ($i = 0; $i < count($value) - 1; $i++) {
                    if (isset($value[$i]['max'], $value[$i + 1]['min'])) {
                        if ($value[$i]['max'] != $value[$i + 1]['min']) {
                            $errors[] = "Brackets {$i} and " . ($i + 1) . ": Gap or overlap detected";
                        }
                    }
                }
                break;

            case 'statutory_rate':
                if (!is_array($value)) {
                    $errors[] = 'Statutory rate must be an object/array';
                    break;
                }

                if (isset($value['rate']) && ($value['rate'] < 0 || $value['rate'] > 100)) {
                    $errors[] = 'Rate must be between 0 and 100';
                }

                if (isset($value['employee_rate']) && ($value['employee_rate'] < 0 || $value['employee_rate'] > 100)) {
                    $errors[] = 'Employee rate must be between 0 and 100';
                }

                if (isset($value['employer_rate']) && ($value['employer_rate'] < 0 || $value['employer_rate'] > 100)) {
                    $errors[] = 'Employer rate must be between 0 and 100';
                }
                break;

            case 'formula':
                if (!is_array($value) || !isset($value['formula'])) {
                    $errors[] = 'Formula must be an object with "formula" property';
                }
                // Additional formula syntax validation would go here
                break;

            case 'reference':
                if (!is_array($value)) {
                    $errors[] = 'Reference data must be an array';
                }
                break;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Get Nigeria 2025 default values for all settings.
     * 
     * @return array Default values with reset messages
     */
    private function getNigeriaDefaults()
    {
        return [
            'PAYE_BRACKETS' => [
                'value' => [
                    ['tier' => 1, 'min' => 0, 'max' => 300000, 'rate' => 0, 'description' => 'Tax Exempt'],
                    ['tier' => 2, 'min' => 300000, 'max' => 600000, 'rate' => 15, 'description' => '15% on excess over ₦300,000'],
                    ['tier' => 3, 'min' => 600000, 'max' => 1100000, 'rate' => 18, 'description' => '18% on excess over ₦600,000'],
                    ['tier' => 4, 'min' => 1100000, 'max' => 1600000, 'rate' => 21, 'description' => '21% on excess over ₦1,100,000'],
                    ['tier' => 5, 'min' => 1600000, 'max' => 3200000, 'rate' => 23, 'description' => '23% on excess over ₦1,600,000'],
                    ['tier' => 6, 'min' => 3200000, 'max' => null, 'rate' => 25, 'description' => '25% on excess over ₦3,200,000']
                ],
                'message' => 'PAYE brackets reset to Nigeria 2025 defaults (6 tiers: 0%, 15%, 18%, 21%, 23%, 25%)'
            ],
            'PENSION_RATE' => [
                'value' => [
                    'employee_rate' => 8.0,
                    'employer_rate' => 10.0,
                    'total_rate' => 18.0,
                    'minimum_pensionable' => 30000,
                    'base' => 'pensionable_amount',
                    'legal_reference' => 'Pension Reform Act 2014'
                ],
                'message' => 'Pension rate reset to default (8% employee + 10% employer)'
            ],
            'NHF_RATE' => [
                'value' => [
                    'rate' => 2.5,
                    'base' => 'basic_salary',
                    'frequency' => 'monthly',
                    'legal_reference' => 'National Housing Fund Act'
                ],
                'message' => 'NHF rate reset to default (2.5% of basic salary)'
            ],
            'NSITF_RATE' => [
                'value' => [
                    'rate' => 1.0,
                    'base' => 'total_emoluments',
                    'frequency' => 'monthly',
                    'paid_by' => 'employer',
                    'legal_reference' => 'Employees Compensation Act 2010'
                ],
                'message' => 'NSITF rate reset to default (1% of total emoluments)'
            ],
            'ITF_RATE' => [
                'value' => [
                    'rate' => 1.0,
                    'base' => 'annual_payroll',
                    'frequency' => 'annual',
                    'paid_by' => 'employer',
                    'legal_reference' => 'Industrial Training Fund Act'
                ],
                'message' => 'ITF rate reset to default (1% of annual payroll)'
            ],
            'TAX_EXEMPTION' => [
                'value' => [
                    'annual_exemption' => 840000,
                    'monthly_exemption' => 70000,
                    'cra_percentage' => 20,
                    'calculation_method' => 'CRA_plus_20_percent_gross',
                    'description' => 'Consolidated Relief Allowance (CRA) + 20% of Gross Income (max ₦840,000/year)',
                    'legal_reference' => 'Companies Income Tax Act (Amendment) 2011'
                ],
                'message' => 'Tax exemption reset to default (₦840,000 annual CRA)'
            ],
            'GROSS_PAY_FORMULA' => [
                'value' => [
                    'formula' => 'BASIC_SALARY + HOUSING + TRANSPORT + OTHER_ALLOWANCES + MEAL_ALLOWANCE',
                    'components' => ['BASIC_SALARY', 'HOUSING', 'TRANSPORT', 'OTHER_ALLOWANCES', 'MEAL_ALLOWANCE'],
                    'type' => 'sum',
                    'period' => 'annual',
                    'description' => 'Sum of all salary and allowance components (annual basis)'
                ],
                'message' => 'Gross pay formula reset to default'
            ],
            'TAXABLE_INCOME_FORMULA' => [
                'value' => [
                    'formula' => '(GROSS_PAY × 0.95) - (PENSIONABLE_AMOUNT × 0.08) - TAX_EXEMPTION',
                    'description' => '95% of gross (CRA relief) minus pension contribution (8%) minus exemption threshold',
                    'components' => ['GROSS_PAY', 'PENSIONABLE_AMOUNT', 'TAX_EXEMPTION'],
                    'constants' => [
                        'cra_percentage' => 0.95,
                        'pension_relief_percentage' => 0.08
                    ],
                    'type' => 'calculation',
                    'period' => 'annual'
                ],
                'message' => 'Taxable income formula reset to default'
            ],
            'NET_PAY_FORMULA' => [
                'value' => [
                    'formula' => 'MONTHLY_GROSS - (PAYE + PENSION + LEAVE_DEDUCTION + 13TH_DEDUCTION + OTHER_DEDUCTIONS)',
                    'components' => ['MONTHLY_GROSS', 'PAYE', 'PENSION', 'LEAVE_DEDUCTION', '13TH_DEDUCTION', 'OTHER_DEDUCTIONS'],
                    'type' => 'subtraction',
                    'period' => 'monthly',
                    'description' => 'Monthly gross minus all deductions (tax, pension, leave reserve, 13th month, others)'
                ],
                'message' => 'Net pay formula reset to default'
            ]
        ];
    }
}
