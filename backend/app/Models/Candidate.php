<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'gender',
        'state_lga_id',
        'registration_status'
    ];

    protected $casts = [
        'date_of_birth' => 'date'
    ];

    public function stateLga()
    {
        return $this->belongsTo(StatesLga::class, 'state_lga_id');
    }
}
