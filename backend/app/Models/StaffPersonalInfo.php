<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffPersonalInfo extends Model
{
    use HasFactory;

    protected $table = 'staff_personal_info';

    protected $fillable = [
        'staff_id',
        'date_of_birth',
        'gender',
        'marital_status',
        'nationality',
        'state_of_origin',
        'lga_of_origin',
        'residential_address',
        'permanent_address',
        'next_of_kin_name',
        'next_of_kin_phone',
        'next_of_kin_relationship',
        'emergency_contact_name',
        'emergency_contact_phone',
        'blood_group',
        'genotype'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
