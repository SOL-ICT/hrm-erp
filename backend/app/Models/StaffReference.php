<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffReference extends Model
{
    use HasFactory;

    protected $table = 'staff_references';

    protected $fillable = [
        'staff_id',
        'name',
        'phone',
        'email',
        'company',
        'position',
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
