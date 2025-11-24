<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffRedeployment extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'redeployment_type',
        'old_department',
        'new_department',
        'old_designation',
        'new_designation',
        'old_service_location_id',
        'new_service_location_id',
        'old_client_id',
        'new_client_id',
        'effective_date',
        'reason',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'effective_date' => 'date',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function oldClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'old_client_id');
    }

    public function newClient(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'new_client_id');
    }

    public function oldServiceLocation(): BelongsTo
    {
        return $this->belongsTo(ServiceLocation::class, 'old_service_location_id');
    }

    public function newServiceLocation(): BelongsTo
    {
        return $this->belongsTo(ServiceLocation::class, 'new_service_location_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
