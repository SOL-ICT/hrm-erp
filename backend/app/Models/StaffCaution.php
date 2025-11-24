<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffCaution extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'issued_date',
        'reason',
        'issued_by',
        'status',
        'resolution_date',
        'notes',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'resolution_date' => 'date',
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
