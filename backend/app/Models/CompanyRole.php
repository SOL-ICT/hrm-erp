<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyRole extends Model
{
    protected $table = 'roles';  // Use the existing roles table

    protected $fillable = [
        'name',        // Use existing column name
        'slug',        // Use existing column name  
        'description',
        'permissions',
        'is_active'
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean'
    ];

    /**
     * Get the permissions for this role
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        )->withTimestamps();
    }

    /**
     * Get staff assigned to this role
     */
    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(
            Staff::class,
            'staff_roles',
            'role_id',
            'staff_id'
        )->withTimestamps();
    }

    /**
     * Scope for active roles
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for specific department
     */
    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Check if role has specific permission
     */
    public function hasPermission($moduleSlug, $submoduleSlug = null, $permissionType = 'read')
    {
        $query = $this->permissions()
            ->whereHas('submodule.module', function ($q) use ($moduleSlug) {
                $q->where('slug', $moduleSlug);
            });

        if ($submoduleSlug) {
            $query->whereHas('submodule', function ($q) use ($submoduleSlug) {
                $q->where('slug', $submoduleSlug);
            });
        }

        $query->where('slug', 'like', "%{$permissionType}%");

        return $query->exists();
    }

    /**
     * Get all permissions grouped by module
     */
    public function getPermissionsByModule()
    {
        return $this->permissions()
            ->with(['submodule.module'])
            ->get()
            ->groupBy('submodule.module.slug');
    }
}
