<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateProfile extends Model
{
    protected $table = 'candidate_profiles';

    protected $fillable = [
        'candidate_id',
        'state_of_residence_permanent',
        'local_government_residence_permanent',
        'address_permanent',
        'address_line_2_permanent',
        'state_of_residence_current',
        'local_government_residence_current',
        'address_current',
        'address_line_2_current',
        'state_lga_id',
        'current_address_state_lga_id',
        'phone_2',
        'email_2',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relationship',
        'emergency_contact_email',
        'emergency_contact_address',
        'next_of_kin_name',
        'next_of_kin_phone',
        'next_of_kin_relationship',
        'next_of_kin_email',
        'next_of_kin_address',
    ];

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }
}
