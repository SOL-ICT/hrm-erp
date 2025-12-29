<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalWorkflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_name',
        'workflow_code',
        'module_name',
        'approval_type',
        'description',
        'workflow_type',
        'total_levels',
        'activation_conditions',
        'is_active',
    ];

    protected $casts = [
        'activation_conditions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the workflow levels
     */
    public function levels(): HasMany
    {
        return $this->hasMany(ApprovalWorkflowLevel::class, 'workflow_id')->orderBy('level_number');
    }

    /**
     * Get approvals using this workflow
     */
    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class, 'workflow_id');
    }

    /**
     * Scope for active workflows
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for specific module
     */
    public function scopeForModule($query, string $moduleName)
    {
        return $query->where('module_name', $moduleName);
    }

    /**
     * Scope for specific approval type
     */
    public function scopeForType($query, string $approvalType)
    {
        return $query->where('approval_type', $approvalType);
    }
}
