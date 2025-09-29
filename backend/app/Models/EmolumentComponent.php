<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmolumentComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'component_code',
        'component_name',
        'status',
        'type',
        'class',
        'client_account',
        'ledger_account_code',
        'ledger_account_name',
        'category',
        'is_taxable',
        'calculation_method',
        'description',
        'display_order',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'is_taxable' => 'boolean',
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('component_name');
    }

    public function scopeBasic($query)
    {
        return $query->where('category', 'basic');
    }

    public function scopeAllowances($query)
    {
        return $query->where('category', 'allowance');
    }

    public function scopeDeductions($query)
    {
        return $query->where('category', 'deduction');
    }

    public function scopeBenefits($query)
    {
        return $query->where('category', 'benefit');
    }

    // Helper methods
    public function getDisplayNameAttribute()
    {
        return $this->component_name . ' (' . $this->component_code . ')';
    }

    public static function getByCategory()
    {
        return self::active()
            ->ordered()
            ->get()
            ->groupBy('category');
    }

    public static function getForDropdown()
    {
        return self::active()
            ->ordered()
            ->pluck('component_name', 'component_code');
    }
}
