<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// Add related model imports
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Candidate;
use App\Models\Client;
use App\Models\User;

class ClientInterview extends Model
{
    use HasFactory;

    protected $table = 'client_interviews';

    protected $fillable = [
        'recruitment_request_id',
        'candidate_id',
        'client_id',
        'interview_type',
        'interview_date',
        'interview_time',
        'contact_person',
        'contact_person_phone',
        'meeting_link',
        'location',
        'status',
        'notes',
        'created_by'
    ];

    protected $casts = [
        'interview_date' => 'date',
        'interview_time' => 'datetime:H:i',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Relationships
    public function recruitmentRequest()
    {
        return $this->belongsTo(RecruitmentRequest::class, 'recruitment_request_id');
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function feedback()
    {
        return $this->hasOne(ClientInterviewFeedback::class);
    }

    // Scopes
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePhysical($query)
    {
        return $query->where('interview_type', 'physical');
    }

    public function scopeOnline($query)
    {
        return $query->where('interview_type', 'online');
    }

    // Accessors
    public function getFormattedDateTimeAttribute()
    {
        return $this->interview_date->format('Y-m-d') . ' ' . $this->interview_time->format('H:i');
    }

    public function getIsPhysicalAttribute()
    {
        return $this->interview_type === 'physical';
    }

    public function getIsOnlineAttribute()
    {
        return $this->interview_type === 'online';
    }
}