<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TemplateComponent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'calculation_template_id',
        'name',
        'display_name',
        'type',
        'value_type',
        'fixed_amount',
        'percentage',
        'formula',
        'is_taxable',
        'is_active',
        'sort_order',
        'metadata'
    ];

    protected $casts = [
        'fixed_amount' => 'decimal:2',
        'percentage' => 'decimal:4',
        'is_taxable' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'metadata' => 'array'
    ];

    /**
     * Get the calculation template that owns this component
     */
    public function calculationTemplate()
    {
        return $this->belongsTo(CalculationTemplate::class);
    }

    /**
     * Get the calculated value for this component
     */
    public function getCalculatedValue(array $variables = []): float
    {
        switch ($this->value_type) {
            case 'fixed':
                return (float) $this->fixed_amount;

            case 'percentage':
                $baseAmount = $variables['basic_salary'] ?? 0;
                return $baseAmount * ($this->percentage / 100);

            case 'formula':
                if (empty($this->formula)) {
                    return 0;
                }

                $calculator = app(\App\Services\SafeFormulaCalculator::class);
                return $calculator->evaluate($this->formula, $variables);

            default:
                return 0;
        }
    }

    /**
     * Check if this component affects gross pay
     */
    public function affectsGrossPay(): bool
    {
        return in_array($this->type, ['basic_salary', 'allowance', 'bonus', 'overtime']);
    }

    /**
     * Check if this component is a deduction
     */
    public function isDeduction(): bool
    {
        return in_array($this->type, ['deduction', 'tax', 'contribution']);
    }

    /**
     * Get formatted display value
     */
    public function getDisplayValue(): string
    {
        switch ($this->value_type) {
            case 'fixed':
                return number_format($this->fixed_amount, 2);

            case 'percentage':
                return $this->percentage . '%';

            case 'formula':
                return $this->formula ?? 'No formula';

            default:
                return 'Not configured';
        }
    }

    /**
     * Scope to get only active components
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get components by type
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get taxable components
     */
    public function scopeTaxable($query)
    {
        return $query->where('is_taxable', true);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
