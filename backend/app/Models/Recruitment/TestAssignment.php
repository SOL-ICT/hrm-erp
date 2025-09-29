<?php

namespace App\Models\Recruitment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;
use App\Models\Candidate;

class TestAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'candidate_id',
        'recruitment_request_id',
        'status',
        'assigned_at',
        'started_at',
        'completed_at',
        'expires_at',
        'invitation_message',
        'email_sent',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
        'email_sent' => 'boolean',
    ];

    /**
     * Get the test for this assignment
     */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /**
     * Get the candidate for this assignment
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Get the recruitment request for this assignment
     */
    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    /**
     * Get the test result for this assignment
     */
    public function result(): HasOne
    {
        return $this->hasOne(TestResult::class);
    }

    /**
     * Check if the assignment is expired
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && Carbon::now()->isAfter($this->expires_at);
    }

    /**
     * Check if the assignment is active (can be taken)
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'pending' && !$this->is_expired;
    }

    /**
     * Check if the test is in progress
     */
    public function getIsInProgressAttribute(): bool
    {
        return $this->status === 'in_progress' && !$this->is_expired;
    }

    /**
     * Get time remaining (in minutes)
     */
    public function getTimeRemainingAttribute(): ?int
    {
        if (!$this->expires_at) return null;
        
        $now = Carbon::now();
        if ($now->isAfter($this->expires_at)) return 0;
        
        return $now->diffInMinutes($this->expires_at);
    }

    /**
     * Start the test
     */
    public function startTest(): bool
    {
        if ($this->status !== 'pending' || $this->is_expired) {
            return false;
        }

        $this->update([
            'status' => 'in_progress',
            'started_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addMinutes($this->test->time_limit),
        ]);

        return true;
    }

    /**
     * Complete the test
     */
    public function completeTest(): bool
    {
        if ($this->status !== 'in_progress') {
            return false;
        }

        $this->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        return true;
    }

    /**
     * Mark as expired
     */
    public function markAsExpired(): bool
    {
        $this->update([
            'status' => 'expired',
        ]);

        return true;
    }

    /**
     * Scope for pending assignments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for active assignments (pending and not expired)
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'pending')
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', Carbon::now());
                    });
    }

    /**
     * Scope for completed assignments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for expired assignments
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
                    ->orWhere(function ($q) {
                        $q->where('expires_at', '<=', Carbon::now())
                          ->whereIn('status', ['pending', 'in_progress']);
                    });
    }
}
