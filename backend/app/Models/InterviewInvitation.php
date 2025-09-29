<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewInvitation extends Model
{
    protected $fillable = [
        'recruitment_request_id',
        'candidate_id',
        'job_application_id',
        'invitation_type',
        'message',
        'interview_date',
        'interview_time',
        'location',
        'interview_type',
        'status',
        'sent_at',
        'responded_at',
        'candidate_response',
        'sent_by'
    ];

    protected $casts = [
        'interview_date' => 'datetime',
        'sent_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * Get the recruitment request that owns the invitation
     */
    public function recruitment_request(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Recruitment\RecruitmentRequest::class, 'recruitment_request_id');
    }

    /**
     * Get the recruitment request that owns the invitation (camelCase alias)
     */
    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Recruitment\RecruitmentRequest::class, 'recruitment_request_id');
    }

    /**
     * Get the candidate that received the invitation
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Get the job application if exists
     */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * Get the user who sent the invitation
     */
    public function sentBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
