<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fiscal_year',
        'budget_period',
        'allocated_amount',
        'utilized_amount',
        'available_amount',
        'is_active',
        'allocated_by',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
        'allocated_amount' => 'decimal:2',
        'utilized_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function allocator()
    {
        return $this->belongsTo(User::class, 'allocated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForYear($query, $year)
    {
        return $query->where('fiscal_year', $year);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Helper methods
     */
    public function utilizationPercentage()
    {
        if ($this->allocated_amount <= 0) {
            return 0;
        }
        return ($this->utilized_amount / $this->allocated_amount) * 100;
    }

    public function hasAvailableAmount($amount)
    {
        return $this->available_amount >= $amount;
    }
}
