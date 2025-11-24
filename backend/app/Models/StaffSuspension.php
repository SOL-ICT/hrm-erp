<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffSuspension extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'suspension_start_date',
        'suspension_end_date',
        'suspension_days',
        'reason',
        'issued_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'suspension_start_date' => 'date',
        'suspension_end_date' => 'date',
        'suspension_days' => 'integer',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
