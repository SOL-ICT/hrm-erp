<?php

namespace App\Models\LeaveEngine;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Client;
use App\Models\JobStructure;

class LpeLeaveEntitlement extends Model
{
    protected $table = 'lpe_leave_entitlements';

    protected $fillable = [
        'client_id',
        'job_structure_id',
        'leave_type_id',
        'entitled_days',
        'max_consecutive_days',
        'max_carryover_days',
        'renewal_frequency',
        'effective_from',
        'effective_to',
        'notes',
    ];

    protected $casts = [
        'entitled_days' => 'decimal:2',
        'max_consecutive_days' => 'integer',
        'max_carryover_days' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    /**
     * Get the client that owns this entitlement.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the job structure for this entitlement.
     */
    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class, 'job_structure_id');
    }

    /**
     * Get the leave type for this entitlement.
     */
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LpeLeaveType::class, 'leave_type_id');
    }

    /**
     * Accessor for backwards compatibility
     */
    public function getStaffLevelAttribute()
    {
        return $this->jobStructure;
    }
}