<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffTermination extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'termination_type',
        'termination_date',
        'notice_period_days',
        'transaction_date',
        'actual_relieving_date',
        'reason',
        'exit_penalty',
        'ppe_return',
        'exit_interview',
        'is_blacklisted',
        'processed_by',
    ];

    protected $casts = [
        'termination_date' => 'date',
        'transaction_date' => 'date',
        'actual_relieving_date' => 'date',
        'notice_period_days' => 'integer',
        'is_blacklisted' => 'boolean',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
