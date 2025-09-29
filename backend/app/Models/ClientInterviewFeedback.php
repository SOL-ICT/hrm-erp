<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// Add related model imports
use App\Models\ClientInterview;
use App\Models\Candidate;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\User;

class ClientInterviewFeedback extends Model
{
    use HasFactory;

    protected $table = 'client_interview_feedback';

    protected $fillable = [
        'client_interview_id',
        'candidate_id',
        'recruitment_request_id',
        'feedback_status',
        'comments',
        'created_by'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function clientInterview()
    {
        return $this->belongsTo(ClientInterview::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function recruitmentRequest()
    {
        return $this->belongsTo(RecruitmentRequest::class, 'recruitment_request_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeSuccessful($query)
    {
        return $query->where('feedback_status', 'successful');
    }

    public function scopeUnsuccessful($query)
    {
        return $query->where('feedback_status', 'unsuccessful');
    }

    public function scopeKeepInView($query)
    {
        return $query->where('feedback_status', 'keep_in_view');
    }

    // Accessors
    public function getIsSuccessfulAttribute()
    {
        return $this->feedback_status === 'successful';
    }

    public function getIsUnsuccessfulAttribute()
    {
        return $this->feedback_status === 'unsuccessful';
    }

    public function getIsKeepInViewAttribute()
    {
        return $this->feedback_status === 'keep_in_view';
    }

    public function getFormattedStatusAttribute()
    {
        return ucwords(str_replace('_', ' ', $this->feedback_status));
    }
}