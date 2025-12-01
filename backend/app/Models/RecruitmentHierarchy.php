<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * RecruitmentHierarchy Model
 * 
 * Stores role-based permissions for recruitment and boarding operations.
 * Allows Super Admin to configure which roles can perform specific actions.
 * 
 * @property int $id
 * @property int $role_id
 * @property bool $can_create_request
 * @property bool $can_approve_request
 * @property bool $can_assign_ticket
 * @property bool $can_board_without_approval
 * @property bool $can_approve_boarding
 * @property int $hierarchy_level
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read \App\Models\Role $role
 */
class RecruitmentHierarchy extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'recruitment_hierarchy';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_id',
        'can_create_request',
        'can_approve_request',
        'can_assign_ticket',
        'can_board_without_approval',
        'can_approve_boarding',
        'hierarchy_level',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'can_create_request' => 'boolean',
        'can_approve_request' => 'boolean',
        'can_assign_ticket' => 'boolean',
        'can_board_without_approval' => 'boolean',
        'can_approve_boarding' => 'boolean',
        'hierarchy_level' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the role that owns this hierarchy configuration
     *
     * @return BelongsTo
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Scope: Get roles that can create requests
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCanCreateRequests($query)
    {
        return $query->where('can_create_request', true);
    }

    /**
     * Scope: Get roles that can approve boarding
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeCanApproveBoarding($query)
    {
        return $query->where('can_approve_boarding', true);
    }

    /**
     * Scope: Get roles by hierarchy level
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $level
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('hierarchy_level', $level);
    }

    /**
     * Scope: Get roles with higher authority (lower level number)
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $level
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeHigherAuthority($query, int $level)
    {
        return $query->where('hierarchy_level', '<', $level);
    }

    /**
     * Scope: Get roles with lower authority (higher level number)
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $level
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLowerAuthority($query, int $level)
    {
        return $query->where('hierarchy_level', '>', $level);
    }
}
