<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\Staff;

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
        'closed_reason',
        'reopen_reason',
        'reopened_at',
        'reopened_by',
        'closure_reason',
        'closure_comments',
        'staff_accepted_offer',
        'closed_by',
        // Delegation & Boarding Enhancement fields
        'assigned_to',
        'requires_approval',
        'delegated_by',
        'delegated_at',
        'delegation_notes',
    ];

    protected $casts = [
        'qualifications' => 'array',
        'recruitment_period_start' => 'date',
        'recruitment_period_end' => 'date',
        'compensation' => 'decimal:2',
        'approved_at' => 'datetime',
        'closed_at' => 'datetime',
        'delegated_at' => 'datetime',
        'requires_approval' => 'boolean',
        'staff_accepted_offer' => 'integer',
        'number_of_vacancies' => 'integer'
    ];

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
        return $this->belongsTo(SolOffice::class);
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

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    // Delegation & Boarding Enhancement Relationships
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function delegatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delegated_by');
    }

    public function staffBoarded(): HasMany
    {
        return $this->hasMany(Staff::class, 'recruitment_request_id');
    }

    public function pendingApprovals(): HasMany
    {
        return $this->staffBoarded()->where('boarding_approval_status', 'pending');
    }

    public function pendingControlApprovals(): HasMany
    {
        return $this->staffBoarded()->where('boarding_approval_status', 'pending_control_approval');
    }

    public function approvedStaff(): HasMany
    {
        return $this->staffBoarded()->where('boarding_approval_status', 'control_approved');
    }

    public function activeStaff(): HasMany
    {
        return $this->staffBoarded()->where('status', 'active');
    }

    public function jobApplications(): HasMany
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    public function candidateJobApplications(): HasMany
    {
        return $this->hasMany(CandidateJobApplication::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority_level', 'urgent');
    }

    // Accessors
    public function getTitleAttribute()
    {
        return $this->description ? substr($this->description, 0, 100) . '...' : 'Recruitment Request #' . $this->ticket_id;
    }

    public function getJobCodeAttribute()
    {
        return $this->ticket_id;
    }
}
