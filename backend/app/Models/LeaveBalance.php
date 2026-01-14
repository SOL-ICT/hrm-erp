<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    protected $table = 'leave_balances';

    protected $fillable = [
        'staff_id',
        'client_id',
        'leave_type_id',
        'year',
        'entitled_days',
        'used_days',
        'carryover_days',
        'available_balance',
        'renewal_frequency',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'entitled_days' => 'decimal:2',
        'used_days' => 'decimal:2',
        'carryover_days' => 'decimal:2',
        'available_balance' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    /**
     * Get the staff member
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * Get the client
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the leave type
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveEngine\LpeLeaveType::class, 'leave_type_id');
    }

    /**
     * Calculate available balance
     */
    public function calculateAvailableBalance()
    {
        $this->available_balance = $this->entitled_days + $this->carryover_days - $this->used_days;
        return $this->available_balance;
    }

    /**
     * Add used days and update balance
     */
    public function addUsedDays($days)
    {
        $this->used_days += $days;
        $this->calculateAvailableBalance();
        return $this;
    }

    /**
     * Scope: Get balance for a specific staff
     */
    public function scopeForStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    /**
     * Scope: Get balance for a specific leave type
     */
    public function scopeForLeaveType($query, $leaveTypeId)
    {
        return $query->where('leave_type_id', $leaveTypeId);
    }

    /**
     * Scope: Get balance for current year
     */
    public function scopeCurrentYear($query)
    {
        return $query->where('year', now()->year);
    }

    /**
     * Scope: Get balance for specific year
     */
    public function scopeForYear($query, $year)
    {
        return $query->where('year', $year);
    }

    /**
     * Scope: Get balance for a specific client
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope: Get active balances (within effective dates)
     */
    public function scopeActive($query)
    {
        $today = now()->toDateString();
        return $query->where('effective_from', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $today);
            });
    }
}
