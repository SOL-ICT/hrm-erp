<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Tax Bracket Model
 * 
 * Represents Nigerian progressive tax brackets
 * 6-tier system with effective date tracking
 */
class TaxBracket extends Model
{
    protected $table = 'tax_brackets';

    protected $fillable = [
        'tier_number',
        'income_from',
        'income_to',
        'tax_rate',
        'description',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'income_from' => 'decimal:2',
        'income_to' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    /**
     * Scope: Get active brackets for a specific year
     */
    public function scopeActiveForYear($query, $year)
    {
        return $query->where('effective_from', '<=', "{$year}-12-31")
            ->where(function ($q) use ($year) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', "{$year}-01-01");
            })
            ->orderBy('tier_number');
    }
}
