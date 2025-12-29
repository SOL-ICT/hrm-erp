<?php

namespace App\Models\Recruitment;

use App\Models\Candidate;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\ServiceLocation;
use App\Models\SOLOffice;
use App\Models\User;
use App\Models\RecruitmentApplication;
use App\Models\InterviewInvitation;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\Recruitment\TestAssignment;
use App\Models\Approval;
use Carbon\Carbon;

class RecruitmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'status',
        'client_id',
        'job_structure_id',
        'gender_requirement',
        'religion_requirement',
        'age_limit_min',
        'age_limit_max',
        'experience_requirement',
        'qualifications',
        'service_location_id',
        'lga',
        'zone',
        'sol_office_id',
        'number_of_vacancies',
        'compensation',
        'sol_service_type',
        'recruitment_period_start',
        'recruitment_period_end',
        'description',
        'special_requirements',
        'priority_level',
        'created_by',
        'updated_by',
        'approved_by',
        'approved_at',
        'closed_at',
        'closed_reason'
    ];

    protected $casts = [
        'qualifications' => 'array',
        'recruitment_period_start' => 'date',
        'recruitment_period_end' => 'date',
        'approved_at' => 'datetime',
        'closed_at' => 'datetime',
        'compensation' => 'decimal:2',
    ];

    // ========================================
    // RELATIONSHIPS
    // ========================================

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class);
    }

    public function serviceLocation(): BelongsTo
    {
        return $this->belongsTo(ServiceLocation::class);
    }

    public function solOffice(): BelongsTo
    {
        return $this->belongsTo(SOLOffice::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user this request is assigned to
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who delegated this request
     */
    public function delegatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_by');
    }

    /**
     * Get the recruitment applications for this request
     */
    public function recruitmentApplications(): HasMany
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    /**
     * Get the interview invitations for this request
     */
    public function interviewInvitations(): HasMany
    {
        return $this->hasMany(InterviewInvitation::class);
    }

    /**
     * Get the job applications for this request (legacy table)
     */
    public function jobApplications(): HasMany
    {
        return $this->hasMany(\App\Models\Candidate\CandidateJobApplication::class);
    }

    /**
     * Get the candidate job applications for this request (modern table)
     */
    public function candidateJobApplications(): HasMany
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    /**
     * Get the test assignments for this recruitment request
     */
    public function testAssignments(): HasMany
    {
        return $this->hasMany(TestAssignment::class);
    }

    /**
     * Get the approval record for this recruitment request (polymorphic)
     */
    public function approval(): MorphOne
    {
        return $this->morphOne(Approval::class, 'approvable');
    }

    // ========================================
    // SCOPES
    // ========================================

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeByYear($query, $year)
    {
        return $query->whereYear('created_at', $year);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority_level', $priority);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'active')
            ->where('recruitment_period_end', '<', now());
    }

    public function scopeDueSoon($query, $days = 7)
    {
        return $query->where('status', 'active')
            ->whereBetween('recruitment_period_end', [
                now(),
                now()->addDays($days)
            ]);
    }

    // ========================================
    // ACCESSORS & MUTATORS
    // ========================================

    public function getComputedStatusAttribute()
    {
        if ($this->status === 'active') {
            if ($this->recruitment_period_end < now()) {
                return 'Overdue';
            }
            if ($this->recruitment_period_end < now()->addDays(7)) {
                return 'Due Soon';
            }
        }
        return ucfirst($this->status);
    }

    public function getDaysRemainingAttribute()
    {
        if ($this->status !== 'active' || !$this->recruitment_period_end) {
            return null;
        }

        return now()->diffInDays($this->recruitment_period_end, false);
    }

    public function getCompensationFormattedAttribute()
    {
        if (!$this->compensation) {
            return 'Not specified';
        }

        return '₦' . number_format((float)$this->compensation);
    }

    public function getQualificationsSummaryAttribute()
    {
        if (!$this->qualifications || !is_array($this->qualifications)) {
            return 'Not specified';
        }

        return collect($this->qualifications)
            ->pluck('name')
            ->implode(', ');
    }

    // ========================================
    // STATIC METHODS
    // ========================================

    public static function generateTicketId()
    {
        $year = now()->year;
        $lastTicket = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        if (!$lastTicket) {
            $number = 1;
        } else {
            // Extract number from last ticket (e.g., TCK_2025_0001 -> 1)
            $lastNumber = (int) substr($lastTicket->ticket_id, -4);
            $number = $lastNumber + 1;
        }

        return sprintf('TCK_%d_%04d', $year, $number);
    }

    public static function getDashboardStats($clientId = null, $year = null)
    {
        $baseQuery = static::query();

        if ($clientId) {
            $baseQuery->where('client_id', $clientId);
        }

        if ($year) {
            $baseQuery->whereYear('created_at', $year);
        }

        return [
            'total' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->where('status', 'active')->count(),
            'closed' => (clone $baseQuery)->where('status', 'closed')->count(),
            'cancelled' => (clone $baseQuery)->where('status', 'cancelled')->count(),
            'on_hold' => (clone $baseQuery)->where('status', 'on_hold')->count(),
            'overdue' => (clone $baseQuery)->where('status', 'active')
                ->where('recruitment_period_end', '<', now())
                ->count(),
            'due_soon' => (clone $baseQuery)->where('status', 'active')
                ->whereBetween('recruitment_period_end', [
                    now(),
                    now()->addDays(7)
                ])
                ->count(),
            'total_vacancies' => (clone $baseQuery)->sum('number_of_vacancies'),
            'open_vacancies' => (clone $baseQuery)->where('status', 'active')->sum('number_of_vacancies'),
        ];
    }

    public static function getClientGroupedRequests($year = null)
    {
        $query = static::with(['client', 'jobStructure'])
            ->orderBy('created_at', 'desc');

        if ($year) {
            $query->whereYear('created_at', $year);
        }

        return $query->get()->groupBy('client.organisation_name');
    }

    // ========================================
    // INSTANCE METHODS
    // ========================================

    public function canBeUpdated(): bool
    {
        return in_array($this->status, ['active', 'on_hold']);
    }

    public function canBeClosed(): bool
    {
        return $this->status === 'active';
    }

    public function canBeReopened(): bool
    {
        return in_array($this->status, ['closed', 'cancelled']);
    }

    public function close($reason = null, $userId = null): bool
    {
        if (!$this->canBeClosed()) {
            return false;
        }

        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closed_reason' => $reason,
            'updated_by' => $userId
        ]);

        return true;
    }

    public function reopen($userId = null): bool
    {
        if (!$this->canBeReopened()) {
            return false;
        }

        $this->update([
            'status' => 'active',
            'closed_at' => null,
            'closed_reason' => null,
            'updated_by' => $userId
        ]);

        return true;
    }

    public function approve($userId = null): bool
    {
        $this->update([
            'approved_by' => $userId,
            'approved_at' => now(),
            'updated_by' => $userId
        ]);

        return true;
    }
}
