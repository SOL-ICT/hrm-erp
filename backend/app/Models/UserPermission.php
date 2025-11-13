<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPermission extends Model
{
    protected $fillable = [
        'user_id',
        'permission_id',
        'granted',
        'granted_by',
        'granted_at',
        'expires_at'
    ];

    protected $casts = [
        'granted' => 'boolean',
        'granted_at' => 'datetime',
        'expires_at' => 'datetime'
    ];

    /**
     * Get the user that owns this permission
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the permission
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }

    /**
     * Get the user who granted this permission
     */
    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Scope to get only granted permissions
     */
    public function scopeGranted($query)
    {
        return $query->where('granted', true);
    }

    /**
     * Scope to get only denied permissions
     */
    public function scopeDenied($query)
    {
        return $query->where('granted', false);
    }

    /**
     * Scope to get non-expired permissions
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }
}
