<?php

namespace App\Models\LeaveEngine;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffSupervisor extends Model
{
    use HasFactory;

    protected $table = 'staff_supervisors';

    protected $fillable = [
        'staff_id',
        'supervisor_name',
        'supervisor_email',
        'supervisor_phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the staff that owns this supervisor record
     */
    public function staff()
    {
        return $this->belongsTo(\App\Models\Staff::class, 'staff_id');
    }

    /**
     * Get the leave applications that used this supervisor
     */
    public function leaveApplications()
    {
        return $this->hasMany(LeaveApplication::class, 'supervisor_id');
    }

    /**
     * Scope to get only active supervisors
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Deactivate all other supervisors for this staff
     */
    public function deactivateOthers()
    {
        self::where('staff_id', $this->staff_id)
            ->where('id', '!=', $this->id)
            ->update(['is_active' => false]);
    }
}
