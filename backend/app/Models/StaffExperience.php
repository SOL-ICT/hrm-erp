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
        'company_name',
        'position',
        'start_date',
        'end_date',
        'is_current',
        'job_description',
        'salary',
        'reason_for_leaving'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'salary' => 'decimal:2'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
