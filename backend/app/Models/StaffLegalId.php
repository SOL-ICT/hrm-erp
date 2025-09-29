<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffLegalId extends Model
{
    use HasFactory;

    protected $table = 'staff_legal_ids';

    protected $fillable = [
        'staff_id',
        'nin',
        'drivers_license',
        'international_passport',
        'voters_card',
        'other_id_type',
        'other_id_number'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
