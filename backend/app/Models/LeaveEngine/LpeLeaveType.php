<?php

namespace App\Models\LeaveEngine;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LpeLeaveType extends Model
{
    protected $table = 'lpe_leave_types';

    protected $fillable = [
        'name',
        'code',
        'description',
        'requires_documentation',
        'is_gender_specific',
        'is_proratable',
        'accrual_frequency',
        'is_active',
    ];

    protected $casts = [
        'requires_documentation' => 'boolean',
        'is_proratable' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Get all entitlements using this leave type.
     */
    public function entitlements(): HasMany
    {
        return $this->hasMany(LpeLeaveEntitlement::class, 'leave_type_id');
    }
}