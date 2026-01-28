<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecruitmentRequestLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'recruitment_request_id',
        'service_location_id',
    ];

    /**
     * Get the recruitment request
     */
    public function recruitmentRequest()
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    /**
     * Get the service location
     */
    public function serviceLocation()
    {
        return $this->belongsTo(ServiceLocation::class);
    }
}
