<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;



class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_active'
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean'
    ];

    /**
     * Staff relationship - roles are assigned to staff, not all users
     */
    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Models\Staff::class,
            'staff_roles',
            'role_id',
            'staff_id'
        )->withTimestamps();
    }

    /**
     * Role permissions relationship
     */
    public function rolePermissions()
    {
        return $this->belongsToMany(
            \App\Models\Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        )->withTimestamps();
    }

    /**
     * Check if role has specific permission
     */
    public function hasPermission(string $permission): bool
    {
        if (in_array('*', $this->permissions ?? [])) {
            return true; // Super admin has all permissions
        }

        return in_array($permission, $this->permissions ?? []);
    }

    /**
     * Scope for active roles
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
