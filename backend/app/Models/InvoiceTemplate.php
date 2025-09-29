<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InvoiceTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'pay_grade_structure_id',
        'template_name',
        'description',
        'custom_components',
        'statutory_components',
        'calculation_rules',
        'use_credit_to_bank_model',
        'service_fee_percentage',
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
        'custom_components' => 'array',
        'statutory_components' => 'array',
        'calculation_rules' => 'array',
        'use_credit_to_bank_model' => 'boolean',
        'prorate_salary' => 'boolean',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'service_fee_percentage' => 'decimal:2',
        'minimum_attendance_factor' => 'decimal:2',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the client that owns this template
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the pay grade structure this template is for
     */
    public function payGradeStructure(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class);
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
     * Scope to filter by client and grade
     */
    public function scopeForClientAndGrade($query, $clientId, $gradeId)
    {
        return $query->where('client_id', $clientId)
            ->where('pay_grade_structure_id', $gradeId);
    }

    /**
     * Get template configuration as a structured array
     */
    public function getConfigurationAttribute()
    {
        return [
            'custom_components' => $this->custom_components ?? [],
            'statutory_components' => $this->statutory_components ?? [],
            'calculation_rules' => $this->calculation_rules ?? [],
            'credit_to_bank' => [
                'enabled' => $this->use_credit_to_bank_model,
                'service_fee_percentage' => $this->service_fee_percentage,
            ],
            'attendance' => [
                'calculation_method' => $this->attendance_calculation_method,
                'prorate_salary' => $this->prorate_salary,
                'minimum_factor' => $this->minimum_attendance_factor,
            ],
        ];
    }

    /**
     * Update the last used timestamp
     */
    public function markAsUsed()
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Set this template as the default for its client-grade combination
     */
    public function setAsDefault()
    {
        // First, unset any existing default for this client-grade combination
        static::where('client_id', $this->client_id)
            ->where('pay_grade_structure_id', $this->pay_grade_structure_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Then set this template as default
        $this->update(['is_default' => true]);
    }
}
