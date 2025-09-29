<?php

namespace App\Models;

use App\Models\Candidate\CandidateJobApplication;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rules\Can;

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
        'registration_status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /**
     * Automatically include these computed attributes in arrays/JSON.
     */
    protected $appends = [
        'full_current_address',
        'full_permanent_address',
        'age',
    ];

    public function stateLga()
    {
        return $this->belongsTo(StatesLga::class, 'state_lga_id');
    }

    /**
     * Get the candidate profile information
     */
    public function profile()
    {
        return $this->hasOne('App\Models\CandidateProfile', 'candidate_id');
    }

    /**
     * Get the recruitment applications for this candidate
     */
    public function recruitmentApplications()
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    /**
     * Get the job applications for this candidate
     */
    public function jobApplications()
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    /**
     * Get the interview invitations for this candidate
     */
    public function interviewInvitations()
    {
        return $this->hasMany(InterviewInvitation::class);
    }

    /**
     * Get the boarding requests for this candidate
     */
    public function boardingRequests()
    {
        return $this->hasMany(BoardingRequest::class);
    }

    /**
     * Calculate age from date of birth
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return $this->date_of_birth->age;
    }

    /**
     * Concatenate current address components into one string.
     */
    public function getFullCurrentAddressAttribute(): string
    {
        /** @var Collection $parts */
        $parts = collect([
            $this->state_of_residence_current,
            $this->local_government_residence_current,
            $this->address_current,
            $this->address_line_2_current,
        ]);

        return $parts
            ->filter()       // drop empty/null
            ->implode(', '); // join with commas
    }

    /**
     * Concatenate permanent address components into one string.
     */
    public function getFullPermanentAddressAttribute(): string
    {
        $parts = collect([
            $this->state_of_residence_permanent,
            $this->local_government_residence_permanent,
            $this->address_permanent,
            $this->address_line_2_permanent,
        ]);

        return $parts
            ->filter()
            ->implode(', ');
    }
}
