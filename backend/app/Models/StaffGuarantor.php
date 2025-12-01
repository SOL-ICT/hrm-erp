<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffGuarantor extends Model
{
    use HasFactory;

    protected $table = 'staff_guarantors';

    protected $fillable = [
        'staff_id',
        'name',
        'address',
        'date_of_birth',
        'phone_number',
        'email',
        'bank_details',
        'employer_details',
        'relationship_to_applicant',
        'guarantor_order'
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
