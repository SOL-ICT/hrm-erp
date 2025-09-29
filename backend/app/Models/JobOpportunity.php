<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOpportunity extends Model
{
    protected $table = 'job_opportunities';

    protected $fillable = [
        'title',
        'description',
        'requirements',
        'benefits',
        'location',
        'employment_type',
        'salary_min',
        'salary_max',
        'currency',
        'department',
        'experience_level',
        'education_level',
        'skills_required',
        'application_deadline',
        'status',
        'posted_by',
        'published_at',
        'filled_at',
        'notes'
    ];

    protected $casts = [
        'skills_required' => 'array',
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'published_at' => 'datetime',
        'filled_at' => 'datetime'
    ];

    /**
     * Get all applications for this job opportunity
     */
    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    /**
     * Get the user who posted this job opportunity
     */
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
