<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientStaffType extends Model
{
    use HasFactory;

    protected $table = 'client_staff_types';

    protected $fillable = [
        'client_id',
        'type_code',
        'title',
        'description',
        'salary_structure',
        'benefits',
        'deductions',
        'grade_level',
        'is_active'
    ];

    protected $casts = [
        'salary_structure' => 'array',
        'benefits' => 'array',
        'deductions' => 'array',
        'grade_level' => 'integer',
        'is_active' => 'boolean'
    ];

    /**
     * Relationship with Client
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relationship with Staff (many-to-many through staff_types)
     */
    public function staff()
    {
        return $this->belongsToMany(Staff::class, 'staff_types', 'client_staff_type_id', 'staff_id');
    }
}
