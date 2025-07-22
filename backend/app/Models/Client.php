<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name',
        'company_code',
        'industry_category',
        'client_category',
        'email',
        'phone',
        'address',
        'contact_person_name',
        'status'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    public function serviceLocations()
    {
        return $this->hasMany(ServiceLocation::class);
    }
}
