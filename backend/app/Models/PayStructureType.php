<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayStructureType extends Model
{
    use HasFactory;

    protected $fillable = [
        'type_code',
        'type_name',
        'contract_type',
        'contract_nature',
        'primary_component',
        'secondary_component',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function payGrades()
    {
        return $this->hasMany(PayGradeStructure::class, 'pay_structure_type', 'type_code');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByContractType($query, $type)
    {
        return $query->where('contract_type', $type);
    }

    public function scopeByContractNature($query, $nature)
    {
        return $query->where('contract_nature', $nature);
    }

    public function scopeEmployment($query)
    {
        return $query->where('contract_type', 'employment');
    }

    public function scopeService($query)
    {
        return $query->where('contract_type', 'service');
    }

    public function scopeAtWill($query)
    {
        return $query->where('contract_nature', 'at_will');
    }

    public function scopeTenured($query)
    {
        return $query->where('contract_nature', 'tenured');
    }

    // Helper methods
    public function getDisplayNameAttribute()
    {
        return $this->type_code . ' - ' . $this->type_name;
    }

    public function getUsageCount()
    {
        return $this->payGrades()->count();
    }

    public static function getGroupedTypes()
    {
        return self::active()
            ->orderBy('type_code')
            ->get()
            ->groupBy(function ($item) {
                return $item->contract_type . '_' . $item->contract_nature;
            });
    }
}
