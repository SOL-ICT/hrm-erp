<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobInterview extends Model
{
    protected $fillable = [
        'job_application_id',
        'interview_type',
        'interview_date',
        'location',
        'interviewer_id',
        'status',
        'notes',
        'rating',
        'feedback'
    ];

    protected $casts = [
        'interview_date' => 'datetime',
        'rating' => 'integer'
    ];

    /**
     * Get the job application for this interview
     */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * Get the interviewer
     */
    public function interviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'interviewer_id');
    }
}
