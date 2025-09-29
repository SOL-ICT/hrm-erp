<?php

namespace App\Models\Boarding;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class BoardingTimeline extends Model
{
    use HasFactory;

    protected $table = 'boarding_timeline';

    protected $fillable = [
        'boarding_request_id',
        'action',
        'description',
        'details',
        'performed_by',
        'performed_at'
    ];

    protected $casts = [
        'details' => 'array',
        'performed_at' => 'datetime'
    ];

    protected $dates = [
        'performed_at'
    ];

    // Relationships
    public function boardingRequest(): BelongsTo
    {
        return $this->belongsTo(BoardingRequest::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // Scopes
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('performed_at', 'desc');
    }

    // Helper methods
    public function getActionDisplayAttribute(): string
    {
        return match($this->action) {
            'request_created' => 'Boarding Request Created',
            'offer_prepared' => 'Offer Prepared',
            'offer_sent' => 'Offer Sent to Candidate',
            'offer_viewed' => 'Offer Viewed by Candidate',
            'offer_accepted' => 'Offer Accepted',
            'offer_rejected' => 'Offer Rejected',
            'offer_negotiated' => 'Offer Under Negotiation',
            'documents_submitted' => 'Documents Submitted',
            'onboarding_started' => 'Onboarding Process Started',
            'onboarding_completed' => 'Successfully Onboarded',
            'status_changed' => 'Status Updated',
            default => ucwords(str_replace('_', ' ', $this->action))
        };
    }

    public function getActionIconAttribute(): string
    {
        return match($this->action) {
            'request_created' => '🆕',
            'offer_prepared' => '📝',
            'offer_sent' => '📤',
            'offer_viewed' => '👀',
            'offer_accepted' => '✅',
            'offer_rejected' => '❌',
            'offer_negotiated' => '🔄',
            'documents_submitted' => '📎',
            'onboarding_started' => '🚀',
            'onboarding_completed' => '🎉',
            'status_changed' => '🔄',
            default => '📌'
        };
    }

    public function getActionColorAttribute(): string
    {
        return match($this->action) {
            'request_created', 'offer_prepared' => 'blue',
            'offer_sent', 'offer_viewed' => 'yellow',
            'offer_accepted', 'onboarding_completed' => 'green',
            'offer_rejected' => 'red',
            'offer_negotiated', 'status_changed' => 'purple',
            'documents_submitted', 'onboarding_started' => 'indigo',
            default => 'gray'
        };
    }
}
