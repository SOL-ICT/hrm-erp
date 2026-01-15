<?php

namespace App\Models\LeaveEngine;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Client;

class LpeStaffLevel extends Model
{
    protected $table = 'lpe_staff_levels';

    protected $fillable = [
        'client_id',
        'name',
        'description',
        'level_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'level_order' => 'integer',
    ];

    /**
     * Get the client that owns this staff level.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get all entitlements for this staff level.
     */
    public function entitlements(): HasMany
    {
        return $this->hasMany(LpeLeaveEntitlement::class, 'staff_level_id');
    }
}