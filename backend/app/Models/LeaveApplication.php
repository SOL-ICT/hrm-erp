<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveApplication extends Model
{
    protected $table = 'leave_applications';

    protected $fillable = [
        'staff_id',
        'client_id',
        'leave_type_id',
        'job_structure_id',
        'start_date',
        'end_date',
        'days',
        'reason',
        'status',
        'approver_id',
        'comments',
        'applied_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'applied_at' => 'datetime',
    ];

    /**
     * Get the staff member who applied for leave
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    /**
     * Get the client this leave belongs to
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
     * Get the job structure for this leave
     */
    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class);
    }

    /**
     * Get the approver (staff who approved)
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'approver_id');
    }

    /**
     * Scope: Get pending applications
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get approved applications
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: Get rejected applications
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope: Get applications for a specific staff
     */
    public function scopeForStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    /**
     * Scope: Get applications for a specific client
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope: Get applications within date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate]);
    }
}
