<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Permission extends Model
{
    protected $fillable = [
        'submodule_id',
        'name',
        'slug',
        'description'
    ];

    /**
     * Get the submodule that owns this permission
     */
    public function submodule(): BelongsTo
    {
        return $this->belongsTo(Submodule::class);
    }

    /**
     * Get the roles that have this permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }

    /**
     * Get users who have this permission directly
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions')
            ->withPivot(['granted', 'granted_by', 'granted_at', 'expires_at']);
    }

    /**
     * Get direct user permissions for this permission
     */
    public function userPermissions(): HasMany
    {
        return $this->hasMany(UserPermission::class);
    }

    /**
     * Get the module through submodule
     */
    public function module()
    {
        return $this->hasOneThrough(Module::class, Submodule::class, 'id', 'id', 'submodule_id', 'module_id');
    }
}
