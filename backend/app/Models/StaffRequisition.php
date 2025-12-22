<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Staff Requisition Model
 * 
 * Represents a staff requisition request for items from the store.
 * Tracks approval status, collection status, and related information.
 */
class StaffRequisition extends Model
{
    use HasFactory;

    protected $table = 'staff_requisitions';

    protected $fillable = [
        'requisition_code',
        'user_id',
        'department',
        'branch',
        'request_date',
        'status',
        'collection_status',
        'approved_by',
        'approval_date',
        'rejection_reason',
        'collection_date',
        'collected_by',
        'notes',
    ];

    protected $casts = [
        'request_date' => 'date',
        'approval_date' => 'datetime',
        'collection_date' => 'datetime',
    ];

    /**
     * Relationships
     */

    /**
     * Get the user who created the requisition
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who approved the requisition
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who marked items as collected
     */
    public function collector()
    {
        return $this->belongsTo(User::class, 'collected_by');
    }

    /**
     * Get requisition items
     */
    public function items()
    {
        return $this->hasMany(StaffRequisitionItem::class, 'requisition_id');
    }

    /**
     * Get status change logs
     */
    public function statusLogs()
    {
        return $this->hasMany(RequisitionStatusLog::class, 'requisition_id');
    }

    /**
     * Query Scopes
     */

    /**
     * Scope to get pending requisitions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get approved requisitions
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get rejected requisitions
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope to get requisitions for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get requisitions ready for collection
     */
    public function scopeReadyForCollection($query)
    {
        return $query->where('status', 'approved')
                     ->where('collection_status', 'ready');
    }

    /**
     * Scope to get collected requisitions
     */
    public function scopeCollected($query)
    {
        return $query->where('collection_status', 'collected');
    }

    /**
     * Scope to filter by department
     */
    public function scopeByDepartment($query, $department)
    {
        return $query->where('department', $department);
    }

    /**
     * Scope to filter by branch
     */
    public function scopeByBranch($query, $branch)
    {
        return $query->where('branch', $branch);
    }

    /**
     * Scope to filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('request_date', [$startDate, $endDate]);
    }

    /**
     * Helper Methods
     */

    /**
     * Check if requisition can be approved
     */
    public function canBeApproved()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if requisition can be rejected
     */
    public function canBeRejected()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if requisition can be cancelled
     */
    public function canBeCancelled()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if items can be marked as ready
     */
    public function canBeMarkedReady()
    {
        return $this->status === 'approved' && $this->collection_status === 'pending';
    }

    /**
     * Check if items can be collected
     */
    public function canBeCollected()
    {
        return $this->status === 'approved' && $this->collection_status === 'ready';
    }

    /**
     * Get total items count
     */
    public function getTotalItemsAttribute()
    {
        return $this->items()->count();
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'pending' => 'amber',
            'approved' => 'green',
            'rejected' => 'red',
            'cancelled' => 'gray',
            default => 'blue'
        };
    }

    /**
     * Get collection status badge color
     */
    public function getCollectionStatusColorAttribute()
    {
        return match($this->collection_status) {
            'pending' => 'amber',
            'ready' => 'blue',
            'collected' => 'green',
            'cancelled' => 'gray',
            default => 'gray'
        };
    }

    /**
     * Boot method to register model events
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate requisition code when creating
        static::creating(function ($requisition) {
            if (!$requisition->requisition_code) {
                $requisition->requisition_code = static::generateRequisitionCode();
            }
        });
    }

    /**
     * Generate unique requisition code
     */
    public static function generateRequisitionCode()
    {
        $year = now()->year;
        $lastRequisition = static::where('requisition_code', 'like', "SRQ-{$year}-%")
                                  ->orderBy('id', 'desc')
                                  ->first();

        if ($lastRequisition) {
            $lastNumber = (int) substr($lastRequisition->requisition_code, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf("SRQ-%d-%03d", $year, $newNumber);
    }
}
