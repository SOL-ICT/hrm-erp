<?php

namespace App\Models\Boarding;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Candidate;

class OfferAcceptance extends Model
{
    use HasFactory;

    protected $fillable = [
        'boarding_request_id',
        'candidate_id',
        'response_type',
        'candidate_message',
        'negotiation_points',
        'counter_offer_salary',
        'preferred_start_date',
        'additional_terms',
        'responded_at'
    ];

    protected $casts = [
        'negotiation_points' => 'array',
        'counter_offer_salary' => 'decimal:2',
        'preferred_start_date' => 'date',
        'responded_at' => 'datetime'
    ];

    protected $dates = [
        'preferred_start_date',
        'responded_at'
    ];

    // Relationships
    public function boardingRequest(): BelongsTo
    {
        return $this->belongsTo(BoardingRequest::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    // Scopes
    public function scopeAccepted($query)
    {
        return $query->where('response_type', 'accepted');
    }

    public function scopeRejected($query)
    {
        return $query->where('response_type', 'rejected');
    }

    public function scopeNegotiating($query)
    {
        return $query->where('response_type', 'negotiating');
    }

    // Helper methods
    public function isAccepted(): bool
    {
        return $this->response_type === 'accepted';
    }

    public function isRejected(): bool
    {
        return $this->response_type === 'rejected';
    }

    public function isNegotiating(): bool
    {
        return $this->response_type === 'negotiating';
    }

    public function getResponseColorAttribute(): string
    {
        return match($this->response_type) {
            'accepted' => 'green',
            'rejected' => 'red',
            'negotiating' => 'blue',
            'expired' => 'gray',
            default => 'gray'
        };
    }
}
