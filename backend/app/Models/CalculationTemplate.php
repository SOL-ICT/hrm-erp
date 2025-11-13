<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CalculationTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'pay_grade_code',
        'description',
        'version',
        'salary_components',
        'allowance_components',
        'deduction_components',
        'statutory_components',
        'calculation_rules',
        'annual_division_factor',
        'attendance_calculation_method',
        'prorate_salary',
        'minimum_attendance_factor',
        'is_active',
        'is_default',
        'created_by',
        'updated_by',
        'last_used_at',
    ];

    protected $casts = [
        'salary_components' => 'array',
        'allowance_components' => 'array',
        'deduction_components' => 'array',
        'statutory_components' => 'array',
        'calculation_rules' => 'array',
        'annual_division_factor' => 'decimal:2',
        'prorate_salary' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'minimum_attendance_factor' => 'decimal:2',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the invoice snapshots that use this calculation template
     */
    public function invoiceSnapshots(): HasMany
    {
        return $this->hasMany(InvoiceSnapshot::class);
    }

    /**
     * Scope to get active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get default templates
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope to filter by pay grade code
     */
    public function scopeForPayGrade($query, $payGradeCode)
    {
        return $query->where('pay_grade_code', $payGradeCode);
    }

    /**
     * Get all formulas from all components as a flat array
     */
    public function getFormulasAttribute(): array
    {
        $formulas = [];

        // Collect formulas from all component types, but skip basic_salary as it's input
        foreach ($this->salary_components ?? [] as $key => $component) {
            if (isset($component['formula']) && $key !== 'basic_salary') {
                $formulas[$key] = $component['formula'];
            }
        }

        foreach ($this->allowance_components ?? [] as $key => $component) {
            if (isset($component['formula'])) {
                $formulas[$key] = $component['formula'];
            }
        }

        foreach ($this->deduction_components ?? [] as $key => $component) {
            if (isset($component['formula'])) {
                $formulas[$key] = $component['formula'];
            }
        }

        foreach ($this->statutory_components ?? [] as $key => $component) {
            if (isset($component['formula'])) {
                $formulas[$key] = $component['formula'];
            }
        }

        return $formulas;
    }

    /**
     * Get all components as a structured array
     */
    public function getAllComponents(): array
    {
        return [
            'salary' => $this->salary_components ?? [],
            'allowances' => $this->allowance_components ?? [],
            'deductions' => $this->deduction_components ?? [],
            'statutory' => $this->statutory_components ?? [],
        ];
    }

    /**
     * Get calculation configuration
     */
    public function getCalculationConfiguration(): array
    {
        return [
            'rules' => $this->calculation_rules ?? [],
            'annual_division_factor' => $this->annual_division_factor ?? 12.00,
            'attendance' => [
                'method' => $this->attendance_calculation_method,
                'prorate_salary' => $this->prorate_salary,
                'minimum_factor' => $this->minimum_attendance_factor,
            ],
        ];
    }

    /**
     * Convert annual amount to monthly
     */
    public function getMonthlyAmount(float $annualAmount): float
    {
        return $annualAmount / ($this->annual_division_factor ?? 12);
    }

    /**
     * Set this template as the default for its pay grade
     */
    public function setAsDefault(): void
    {
        // First, unset any existing default for this pay grade
        static::where('pay_grade_code', $this->pay_grade_code)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Then set this template as default
        $this->update(['is_default' => true]);
    }

    /**
     * Mark template as used
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Create a new version of this template
     */
    public function createNewVersion(array $changes = []): self
    {
        $newVersion = $this->replicate(['last_used_at']);

        // Increment version
        $currentVersion = (float) $this->version;
        $newVersion->version = number_format($currentVersion + 0.1, 1);

        // Apply changes
        $newVersion->fill($changes);

        // Set as default and deactivate old version
        $newVersion->is_default = true;
        $this->update(['is_default' => false, 'is_active' => false]);

        $newVersion->save();

        return $newVersion;
    }
}
