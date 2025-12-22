<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Requisition Status Log Model
 * 
 * Tracks all status changes for requisitions.
 * Provides complete audit trail of requisition lifecycle.
 */
class RequisitionStatusLog extends Model
{
    use HasFactory;

    protected $table = 'requisition_status_log';

    public $timestamps = false; // Only created_at is used

    protected $fillable = [
        'requisition_id',
        'changed_by',
        'old_status',
        'new_status',
        'comments',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    /**
     * Get the requisition this log belongs to
     */
    public function requisition()
    {
        return $this->belongsTo(StaffRequisition::class, 'requisition_id');
    }

    /**
     * Get the user who made the change
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Query Scopes
     */

    /**
     * Scope to get logs for a specific requisition
     */
    public function scopeForRequisition($query, $requisitionId)
    {
        return $query->where('requisition_id', $requisitionId);
    }

    /**
     * Scope to order by date (newest first)
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Helper Methods
     */

    /**
     * Get formatted change description
     */
    public function getChangeDescriptionAttribute()
    {
        if ($this->old_status) {
            return "Status changed from {$this->old_status} to {$this->new_status}";
        }
        return "Status set to {$this->new_status}";
    }

    /**
     * Get user name who made the change
     */
    public function getChangedByNameAttribute()
    {
        return $this->user?->name ?? 'System';
    }

    /**
     * Boot method to auto-set created_at
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($log) {
            if (!$log->created_at) {
                $log->created_at = now();
            }
        });
    }
}
