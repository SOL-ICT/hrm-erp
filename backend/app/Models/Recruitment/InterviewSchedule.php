<?php

namespace App\Models\Recruitment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;
use App\Models\Candidate;
use App\Models\User;

class InterviewSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'recruitment_request_id',
        'interview_type',
        'interview_mode',
        'scheduled_at',
        'duration_minutes',
        'meeting_link',
        'location',
        'instructions',
        'status',
        'interviewer_notes',
        'outcome',
        'rating',
        'feedback',
        'scheduled_by',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'feedback' => 'array',
        'rating' => 'decimal:2',
    ];

    /**
     * Get the candidate for this interview
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Get the recruitment request for this interview
     */
    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    /**
     * Get the user who scheduled this interview
     */
    public function scheduler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    /**
     * Check if the interview is upcoming
     */
    public function getIsUpcomingAttribute(): bool
    {
        return $this->status === 'scheduled' && Carbon::now()->isBefore($this->scheduled_at);
    }

    /**
     * Check if the interview is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'scheduled' && Carbon::now()->isAfter($this->scheduled_at->addMinutes($this->duration_minutes));
    }

    /**
     * Check if the interview is today
     */
    public function getIsTodayAttribute(): bool
    {
        return Carbon::now()->isSameDay($this->scheduled_at);
    }

    /**
     * Get time until interview
     */
    public function getTimeUntilAttribute(): ?string
    {
        if ($this->status !== 'scheduled') return null;
        
        $now = Carbon::now();
        $scheduledTime = $this->scheduled_at;
        
        if ($now->isAfter($scheduledTime)) return 'Overdue';
        
        $diff = $now->diff($scheduledTime);
        
        if ($diff->days > 0) {
            return $diff->days === 1 ? 'Tomorrow' : "In {$diff->days} days";
        }
        
        if ($diff->h > 0) {
            return "In {$diff->h} hours";
        }
        
        return "In {$diff->i} minutes";
    }

    /**
     * Get formatted scheduled time
     */
    public function getFormattedScheduledTimeAttribute(): string
    {
        return $this->scheduled_at->format('M j, Y \a\t g:i A');
    }

    /**
     * Get interview type label
     */
    public function getInterviewTypeLabelAttribute(): string
    {
        return match($this->interview_type) {
            'initial' => 'Initial Interview',
            'technical' => 'Technical Interview',
            'client_meeting' => 'Client Meeting',
            'final' => 'Final Interview',
            default => ucfirst($this->interview_type),
        };
    }

    /**
     * Get interview mode label
     */
    public function getInterviewModeLabelAttribute(): string
    {
        return match($this->interview_mode) {
            'video' => 'Video Call',
            'phone' => 'Phone Call',
            'in_person' => 'In Person',
            default => ucfirst($this->interview_mode),
        };
    }

    /**
     * Get status color for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'scheduled' => 'blue',
            'in_progress' => 'yellow',
            'completed' => 'green',
            'cancelled' => 'red',
            'rescheduled' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Mark interview as started
     */
    public function markAsStarted(): bool
    {
        if ($this->status !== 'scheduled') return false;
        
        $this->update(['status' => 'in_progress']);
        return true;
    }

    /**
     * Complete the interview
     */
    public function complete(array $data): bool
    {
        if (!in_array($this->status, ['scheduled', 'in_progress'])) return false;
        
        $this->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
            'outcome' => $data['outcome'] ?? null,
            'rating' => $data['rating'] ?? null,
            'interviewer_notes' => $data['interviewer_notes'] ?? null,
            'feedback' => $data['feedback'] ?? null,
        ]);
        
        return true;
    }

    /**
     * Cancel the interview
     */
    public function cancel(): bool
    {
        if ($this->status === 'completed') return false;
        
        $this->update(['status' => 'cancelled']);
        return true;
    }

    /**
     * Reschedule the interview
     */
    public function reschedule(Carbon $newTime): bool
    {
        if ($this->status === 'completed') return false;
        
        $this->update([
            'status' => 'scheduled',
            'scheduled_at' => $newTime,
        ]);
        
        return true;
    }

    /**
     * Scope for scheduled interviews
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    /**
     * Scope for upcoming interviews
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'scheduled')
                    ->where('scheduled_at', '>', Carbon::now());
    }

    /**
     * Scope for today's interviews
     */
    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_at', Carbon::today());
    }

    /**
     * Scope for completed interviews
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for specific interview type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('interview_type', $type);
    }
}
