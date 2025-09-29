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
        'phone',
        'email',
        'address',
        'occupation',
        'relationship'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
