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
        'middle_name',
        'marital_status',
        'nationality',
        'state_of_origin',
        'local_government_of_origin',
        'current_address',
        'permanent_address',
        'nearby_landmark',
        'mobile_phone',
        'personal_email',
        'blood_group',
        'state_of_residence',
        'lga_of_residence',
        'country'
    ];

    protected $casts = [
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
