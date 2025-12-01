<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffEducation extends Model
{
    use HasFactory;

    protected $table = 'staff_education';

    protected $fillable = [
        'staff_id',
        'institution_name',
        'certificate_type',
        'specialization',
        'start_year',
        'end_year',
        'graduation_year',
        'score_class',
        'year_obtained',
        'education_order'
    ];

    protected $casts = [
        'start_year' => 'integer',
        'end_year' => 'integer',
        'graduation_year' => 'integer',
        'year_obtained' => 'integer'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
