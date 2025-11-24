<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffBlacklist extends Model
{
    protected $table = 'staff_blacklist';

    protected $fillable = [
        'staff_id',
        'client_id',
        'termination_id',
        'blacklist_date',
        'reason',
        'staff_details_snapshot',
    ];

    protected $casts = [
        'blacklist_date' => 'date',
        'staff_details_snapshot' => 'array',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function termination(): BelongsTo
    {
        return $this->belongsTo(StaffTermination::class, 'termination_id');
    }
}
