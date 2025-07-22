<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatesLga extends Model
{
    protected $table = 'states_lgas';

    protected $fillable = [
        'state_name',
        'state_code',
        'lga_name',
        'lga_code',
        'zone',
        'is_capital',
        'is_active'
    ];

    protected $casts = [
        'is_capital' => 'boolean',
        'is_active' => 'boolean'
    ];
}
