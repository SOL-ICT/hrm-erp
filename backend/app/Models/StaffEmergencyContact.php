<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffEmergencyContact extends Model
{
    use HasFactory;

    protected $table = 'staff_emergency_contacts';

    protected $fillable = [
        'staff_id',
        'name',
        'phone',
        'relationship',
        'address',
        'is_primary'
    ];

    protected $casts = [
        'is_primary' => 'boolean'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
