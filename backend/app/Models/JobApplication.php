<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Recruitment\RecruitmentRequest;

class JobApplication extends Model
{
    protected $fillable = [
        'recruitment_request_id',
        'candidate_id', 
        'cover_letter',
        'expected_salary',
        'available_start_date',
        'status',
        'notes',
        'reviewed_by',
        'reviewed_at',
        'application_source',
        'applied_at'
    ];

    protected $casts = [
        'expected_salary' => 'decimal:2',
        'available_start_date' => 'date',
        'reviewed_at' => 'datetime',
        'applied_at' => 'datetime'
    ];

    /**
     * Get the recruitment request this application is for
     */
    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    /**
     * Get the candidate who submitted this application
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Get the user who reviewed this application
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
