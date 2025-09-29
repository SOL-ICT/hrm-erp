<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class JobStructure extends Model
{


    protected $fillable = [
        'client_id',
        'job_code',
        'job_title',
        'description',
        'contract_type',
        'contract_nature',
        'pay_structures',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'pay_structures' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function payGrades()
    {
        return $this->hasMany(PayGradeStructure::class);
    }

    public function activePayGrades()
    {
        return $this->hasMany(PayGradeStructure::class)->where('is_active', true);
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

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeByContractType($query, $type)
    {
        return $query->where('contract_type', $type);
    }

    public function scopeByContractNature($query, $nature)
    {
        return $query->where('contract_nature', $nature);
    }

    // Accessors & Mutators
    public function getPayStructuresAttribute($value)
    {
        return $value ? json_decode($value, true) : [];
    }

    public function setPayStructuresAttribute($value)
    {
        $this->attributes['pay_structures'] = json_encode($value);
    }

    // Helper methods
    public function getPayStructureTypesDetails()
    {
        if (!$this->pay_structures) {
            return [];
        }

        return PayStructureType::whereIn('type_code', $this->pay_structures)
            ->orderBy('type_code')
            ->get();
    }

    public function getTotalGradesCount()
    {
        return $this->payGrades()->count();
    }

    public function getActiveGradesCount()
    {
        return $this->activePayGrades()->count();
    }

    public function getAverageCompensation()
    {
        return $this->activePayGrades()->avg('total_compensation') ?? 0;
    }
}
