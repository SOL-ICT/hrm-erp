<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffQuery extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'query_date',
        'query_details',
        'response',
        'response_date',
        'status',
    ];

    protected $casts = [
        'query_date' => 'date',
        'response_date' => 'date',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}
