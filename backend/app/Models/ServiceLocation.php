<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    /**
     * Get the SOL office that this service location belongs to
     */
    public function solOffice(): BelongsTo
    {
        return $this->belongsTo(SOLOffice::class, 'sol_office_id');
    }

    /**
     * Get the client that this service location belongs to
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
