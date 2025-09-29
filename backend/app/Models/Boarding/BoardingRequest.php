<?php

namespace App\Models\Boarding;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Auth;
use App\Models\Candidate;
use App\Models\Client;
use App\Models\RecruitmentRequest;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\User;

class BoardingRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'client_id',
        'recruitment_request_id',
        'job_structure_id',
        'pay_grade_id',
        'boarding_type',
        'status',
        'proposed_start_date',
        'offered_salary',
        'offer_letter_content',
        'terms_conditions',
        'rejection_reason',
        'offer_sent_at',
        'offer_responded_at',
        'onboarded_at',
        'created_by'
    ];

    protected $casts = [
        'proposed_start_date' => 'date',
        'offered_salary' => 'decimal:2',
        'offer_sent_at' => 'datetime',
        'offer_responded_at' => 'datetime',
        'onboarded_at' => 'datetime'
    ];

    protected $dates = [
        'proposed_start_date',
        'offer_sent_at',
        'offer_responded_at',
        'onboarded_at'
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

    public function payGrade(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class, 'pay_grade_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffProfile::class);
    }

    public function offerAcceptances(): HasMany
    {
        return $this->hasMany(OfferAcceptance::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(BoardingDocument::class);
    }

    public function timeline(): HasMany
    {
        return $this->hasMany(BoardingTimeline::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOfferSent($query)
    {
        return $query->where('status', 'offer_sent');
    }

    public function scopeOfferAccepted($query)
    {
        return $query->where('status', 'offer_accepted');
    }

    public function scopeOnboarded($query)
    {
        return $query->where('status', 'onboarded');
    }

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeRecommended($query)
    {
        return $query->where('boarding_type', 'recommended');
    }

    public function scopeDirectPlacement($query)
    {
        return $query->where('boarding_type', 'direct_placement');
    }

    // Helper methods
    public function canSendOffer(): bool
    {
        return $this->status === 'pending';
    }

    public function canAcceptOffer(): bool
    {
        return $this->status === 'offer_sent';
    }

    public function canOnboard(): bool
    {
        return $this->status === 'offer_accepted';
    }

    public function isOnboarded(): bool
    {
        return $this->status === 'onboarded';
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'offer_sent' => 'blue', 
            'offer_accepted' => 'green',
            'offer_rejected' => 'red',
            'onboarded' => 'purple',
            'cancelled' => 'gray',
            default => 'gray'
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending Review',
            'offer_sent' => 'Offer Sent',
            'offer_accepted' => 'Offer Accepted',
            'offer_rejected' => 'Offer Rejected',
            'onboarded' => 'Successfully Onboarded',
            'cancelled' => 'Cancelled',
            default => 'Unknown'
        };
    }

    // Log timeline events
    public function logTimeline(string $action, string $description, ?array $details = null, ?int $performedBy = null): void
    {
        $this->timeline()->create([
            'action' => $action,
            'description' => $description,
            'details' => $details,
            'performed_by' => $performedBy ?? Auth::id(),
            'performed_at' => now()
        ]);
    }
}
