<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalHistory extends Model
{
    use HasFactory;

    protected $table = 'approval_history';

    // Immutable - no updated_at timestamp
    const UPDATED_AT = null;

    protected $fillable = [
        'approval_id',
        'action',
        'action_by',
        'action_at',
        'from_status',
        'to_status',
        'approval_level',
        'comments',
        'rejection_reason',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'action_at' => 'datetime',
    ];

    /**
     * Get the associated approval
     */
    public function approval(): BelongsTo
    {
        return $this->belongsTo(Approval::class);
    }

    /**
     * Get the user who performed the action
     */
    public function actionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'action_by');
    }
}
