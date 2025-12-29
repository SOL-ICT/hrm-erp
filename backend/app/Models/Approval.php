<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'approval_type',
        'module_name',
        'requested_by',
        'requested_at',
        'status',
        'current_approver_id',
        'current_approval_level',
        'priority',
        'is_overdue',
        'due_date',
        'workflow_id',
        'total_approval_levels',
        'request_data',
        'notes',
        'completed_at',
        'completed_by',
        'metadata',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'due_date' => 'datetime',
        'completed_at' => 'datetime',
        'is_overdue' => 'boolean',
        'request_data' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the approvable model (polymorphic)
     */
    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who requested approval
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the current approver
     */
    public function currentApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_approver_id');
    }

    /**
     * Get the user who completed the approval
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Get the associated workflow
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    /**
     * Get approval history
     */
    public function history(): HasMany
    {
        return $this->hasMany(ApprovalHistory::class);
    }

    /**
     * Scope for pending approvals
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved requests
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for rejected requests
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope for overdue approvals
     */
    public function scopeOverdue($query)
    {
        return $query->where('is_overdue', true);
    }

    /**
     * Scope for specific approver
     */
    public function scopeForApprover($query, int $approverId)
    {
        return $query->where('current_approver_id', $approverId);
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleName)
    {
        return $query->where('module_name', $moduleName);
    }
}
