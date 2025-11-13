<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class InvoiceExportTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoice_export_templates';

    protected $fillable = [
        'client_id',
        'template_name',
        'description',
        'line_items',
        'excel_settings',
        'include_summary_sheet',
        'include_breakdown_sheet',
        'is_active',
    ];

    protected $casts = [
        'line_items' => 'array',
        'excel_settings' => 'array',
        'include_summary_sheet' => 'boolean',
        'include_breakdown_sheet' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get the client that owns this template
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get active template for a client
     */
    public static function getActiveForClient($clientId)
    {
        return static::where('client_id', $clientId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Apply line items to calculated payroll data
     */
    public function applyLineItems($payrollData)
    {
        if (!$this->line_items) {
            return $payrollData;
        }

        $results = [];
        $componentValues = [
            'total_staff_cost' => $payrollData['gross_payroll'] ?? 0,
            'gross_payroll' => $payrollData['gross_payroll'] ?? 0,
            'net_payroll' => $payrollData['net_payroll'] ?? 0,
            'total_deductions' => $payrollData['total_deductions'] ?? 0,
        ];

        foreach ($this->line_items as $lineItem) {
            $value = $this->calculateLineItemValue($lineItem, $componentValues, $results);
            $results[$lineItem['name']] = $value;

            // Store calculated values for dependent calculations
            $componentKey = strtolower(str_replace(' ', '_', $lineItem['name']));
            $componentValues[$componentKey] = $value;
        }

        return array_merge($payrollData, [
            'export_line_items' => $results,
            'final_invoice_total' => end($results) ?: $payrollData['gross_payroll']
        ]);
    }

    /**
     * Calculate individual line item value
     */
    private function calculateLineItemValue($lineItem, $componentValues, $results)
    {
        switch ($lineItem['formula_type']) {
            case 'percentage':
                $baseComponent = $lineItem['depends_on'] ?? 'total_staff_cost';
                $baseValue = $componentValues[$baseComponent] ?? 0;
                return $baseValue * ($lineItem['percentage'] / 100);

            case 'percentage_subtraction':
                $baseComponent = $lineItem['depends_on'] ?? 'total_staff_cost';
                $baseValue = $componentValues[$baseComponent] ?? 0;
                return - ($baseValue * ($lineItem['percentage'] / 100)); // Return negative value

            case 'component_sum':
                $components = $lineItem['depends_on'] ?? [];
                $sum = 0;
                foreach ($components as $component) {
                    $sum += $componentValues[$component] ?? 0;
                }
                return $sum;

            case 'line_item_sum':
                $items = $lineItem['depends_on'] ?? [];
                $sum = 0;
                foreach ($items as $item) {
                    $sum += $results[$item] ?? 0;
                }
                return $sum;

            case 'subtraction':
                // Start with base item value
                $baseItem = $lineItem['base_item'] ?? '';
                $baseValue = $componentValues[$baseItem] ?? $results[$baseItem] ?? 0;

                // Subtract all specified items
                $subtractItems = $lineItem['subtract_items'] ?? [];
                $totalSubtraction = 0;
                foreach ($subtractItems as $item) {
                    $itemValue = $componentValues[$item] ?? $results[$item] ?? 0;
                    $totalSubtraction += $itemValue;
                }

                return $baseValue - $totalSubtraction;

            case 'fixed_amount':
                return $lineItem['formula'] ?? 0;

            default:
                return 0;
        }
    }

    /**
     * Get default line items structure
     */
    public static function getDefaultLineItems()
    {
        return [
            [
                'name' => 'Total Staff Cost',
                'formula_type' => 'component_sum',
                'formula' => null,
                'depends_on' => ['gross_payroll', 'total_deductions'],
                'order' => 1
            ],
            [
                'name' => 'Management Fee',
                'formula_type' => 'percentage',
                'formula' => 10,
                'depends_on' => 'total_staff_cost',
                'order' => 2
            ],
            [
                'name' => 'VAT on Management Fee',
                'formula_type' => 'percentage',
                'formula' => 7.5,
                'depends_on' => 'management_fee',
                'order' => 3
            ],
            [
                'name' => 'Invoice Total',
                'formula_type' => 'line_item_sum',
                'formula' => null,
                'depends_on' => ['Total Staff Cost', 'Management Fee', 'VAT on Management Fee'],
                'order' => 4
            ]
        ];
    }
}
