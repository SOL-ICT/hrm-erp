<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Module extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    /**
     * Get all submodules for this module
     */
    public function submodules(): HasMany
    {
        return $this->hasMany(Submodule::class)->orderBy('sort_order');
    }

    /**
     * Get all permissions through submodules
     */
    public function permissions()
    {
        return $this->hasManyThrough(Permission::class, Submodule::class);
    }

    /**
     * Scope to get only active modules
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
