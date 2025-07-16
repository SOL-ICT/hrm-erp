<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceLocation extends Model
{
    protected $table = 'service_locations';

    protected $fillable = [
        'location_code',
        'location_name',
        'client_id',
        'sol_office_id',
        'unique_id',
        'short_name',
        'city',
        'full_address',
        'contact_person_name',
        'contact_person_phone',
        'contact_person_email',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];
}
