<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalWorkflowLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'level_number',
        'level_name',
        'description',
        'approver_role_id',
        'approver_user_id',
        'approver_criteria',
        'requires_all_approvers',
        'minimum_approvers',
        'sla_hours',
        'escalation_enabled',
        'escalation_hours',
        'escalation_role_id',
        'skip_conditions',
    ];

    protected $casts = [
        'approver_criteria' => 'array',
        'skip_conditions' => 'array',
        'requires_all_approvers' => 'boolean',
        'escalation_enabled' => 'boolean',
    ];

    /**
     * Get the parent workflow
     */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'workflow_id');
    }

    /**
     * Get the approver role
     */
    public function approverRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'approver_role_id');
    }

    /**
     * Get the approver user
     */
    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    /**
     * Get the escalation role
     */
    public function escalationRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'escalation_role_id');
    }
}
