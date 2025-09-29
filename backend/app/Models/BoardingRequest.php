<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Candidate;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\OfferLetterTemplate;
use App\Models\User;

class BoardingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'client_id', 
        'recruitment_request_id',
        'job_structure_id',
        'pay_grade_structure_id',
        'offer_letter_template_id',
        'status',
        'proposed_start_date',
        'candidate_filled_fields',
        'rejection_reason',
        'offer_sent_at',
        'offer_responded_at',
        'onboarded_at',
        'created_by'
    ];

    protected $casts = [
        'candidate_filled_fields' => 'array',
        'proposed_start_date' => 'date',
        'offer_sent_at' => 'datetime',
        'offer_responded_at' => 'datetime',
        'onboarded_at' => 'datetime'
    ];

    // Relationships
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class);
    }

    public function payGradeStructure(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class);
    }

    public function offerLetterTemplate(): BelongsTo
    {
        return $this->belongsTo(OfferLetterTemplate::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function offerResponses(): HasMany
    {
        return $this->hasMany(OfferResponse::class);
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(BoardingTimeline::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeByTicket($query, $ticketId)
    {
        return $query->where('recruitment_request_id', $ticketId);
    }

    // Helper methods
    public function getSalary()
    {
        return $this->payGradeStructure->total_compensation;
    }

    public function isOfferSent()
    {
        return $this->status === 'offer_sent';
    }

    public function isOfferAccepted()
    {
        return $this->status === 'offer_accepted';
    }

    public function canBeBoarded()
    {
        return $this->status === 'offer_accepted';
    }
}
