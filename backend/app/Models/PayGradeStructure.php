<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayGradeStructure extends Model
{

    protected $fillable = [
        'job_structure_id',
        'grade_name',
        'grade_code',
        'pay_structure_type',
        'emoluments',
        'total_compensation',
        'currency',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'emoluments' => 'array',
        'total_compensation' => 'decimal:2',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function jobStructure()
    {
        return $this->belongsTo(JobStructure::class);
    }

    public function payStructureType()
    {
        return $this->belongsTo(PayStructureType::class, 'pay_structure_type', 'type_code');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByPayStructureType($query, $type)
    {
        return $query->where('pay_structure_type', $type);
    }

    public function scopeByJobStructure($query, $jobStructureId)
    {
        return $query->where('job_structure_id', $jobStructureId);
    }

    // Accessors & Mutators
    public function getEmolumentsAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    public function setEmolumentsAttribute($value)
    {
        $this->attributes['emoluments'] = json_encode($value);
        // Auto-calculate total compensation
        $this->calculateTotalCompensation($value);
    }

    public function getFormattedTotalCompensationAttribute()
    {
        return number_format($this->total_compensation, 2);
    }

    public function getFormattedTotalCompensationNairaAttribute()
    {
        return '₦' . number_format($this->total_compensation, 2);
    }

    // Helper methods
    public function calculateTotalCompensation($emoluments = null)
    {
        $emoluments = $emoluments ?? $this->emoluments;

        if (!$emoluments || !is_array($emoluments)) {
            $this->attributes['total_compensation'] = 0;
            return 0;
        }

        $total = 0;
        foreach ($emoluments as $component => $amount) {
            // Only add positive amounts (allowances, salary)
            if (is_numeric($amount) && $amount > 0) {
                $emolumentComponent = EmolumentComponent::where('component_code', $component)->first();
                if ($emolumentComponent && in_array($emolumentComponent->category, ['basic', 'allowance', 'benefit'])) {
                    $total += $amount;
                }
            }
        }

        $this->attributes['total_compensation'] = $total;
        return $total;
    }

    public function getEmolumentBreakdown()
    {
        $breakdown = [];
        if (!$this->emoluments) {
            return $breakdown;
        }

        foreach ($this->emoluments as $componentCode => $amount) {
            $component = EmolumentComponent::where('component_code', $componentCode)->first();
            if ($component) {
                $breakdown[] = [
                    'code' => $componentCode,
                    'name' => $component->component_name,
                    'category' => $component->category,
                    'amount' => $amount,
                    'formatted_amount' => '₦' . number_format($amount, 2)
                ];
            }
        }

        return $breakdown;
    }
}
