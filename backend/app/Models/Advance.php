<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advance extends Model
{
    use HasFactory;

    protected $fillable = [
        'advance_code',
        'user_id',
        'office',
        'amount',
        'budget_line',
        'purpose',
        'justification',
        'status',
        'approved_by',
        'approved_at',
        'approval_comments',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'disbursed_by',
        'disbursed_at',
        'disbursement_reference',
        'retirement_due_date',
        'retired_at',
        'is_overdue',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'retirement_due_date' => 'date',
        'retired_at' => 'datetime',
        'is_overdue' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter()
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function disburser()
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }

    public function retirement()
    {
        return $this->hasOne(Retirement::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(AdvanceStatusLog::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeDisbursed($query)
    {
        return $query->where('status', 'disbursed');
    }

    public function scopeRetired($query)
    {
        return $query->where('status', 'retired');
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_overdue', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByBudgetLine($query, $budgetLine)
    {
        return $query->where('budget_line', $budgetLine);
    }

    /**
     * Helper methods
     */
    public function isRetirementOverdue()
    {
        if (!$this->retirement_due_date || $this->status === 'retired') {
            return false;
        }
        return now()->isAfter($this->retirement_due_date);
    }
}
