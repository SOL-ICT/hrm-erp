<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffExperience extends Model
{
    use HasFactory;

    protected $table = 'staff_experience';

    protected $fillable = [
        'staff_id',
        'employer_name',
        'designation',
        'start_date',
        'end_date',
        'job_description',
        'reason_for_leaving',
        'last_salary',
        'experience_order'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'last_salary' => 'decimal:2'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
