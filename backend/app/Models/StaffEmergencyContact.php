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
        'contact_type',
        'name',
        'relationship',
        'phone_number',
        'email',
        'address',
        'gender',
        'date_of_birth',
        'is_primary',
        'contact_order'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'date_of_birth' => 'date'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
