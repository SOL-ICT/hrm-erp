<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'role_id',
        'user_type',
        'staff_profile_id',
        'candidate_profile_id',
        'preferences',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'preferences' => 'array',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'preferences' => '{}',
        'is_active' => true,
    ];

    /**
     * Get the staff profile if user is staff/admin
     */
    public function staffProfile()
    {
        return $this->belongsTo(\App\Models\Staff::class, 'staff_profile_id')
            ->when($this->user_type === 'staff' || $this->user_type === 'admin');
    }

    /**
     * Alias for staffProfile (used in user management)
     */
    public function staff()
    {
        return $this->belongsTo(\App\Models\Staff::class, 'staff_profile_id');
    }

    /**
     * Get the candidate profile if user is candidate
     */
    public function candidateProfile()
    {
        return $this->belongsTo(\App\Models\Candidate::class, 'candidate_profile_id')
            ->when($this->user_type === 'candidate');
    }

    // Recruitment Boarding Enhancement Relationships
    /**
     * Get the recruitment hierarchy permissions for this user's role
     */
    public function recruitmentHierarchy()
    {
        return $this->hasOne(RecruitmentHierarchy::class, 'role_id', 'role_id');
    }

    /**
     * Get recruitment requests created by this user
     */
    public function createdRecruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'created_by');
    }

    /**
     * Get recruitment requests assigned to this user
     */
    public function assignedRecruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'assigned_to');
    }

    /**
     * Get recruitment requests delegated by this user
     */
    public function delegatedRecruitmentRequests()
    {
        return $this->hasMany(RecruitmentRequest::class, 'delegated_by');
    }

    /**
     * Get staff boarding approvals done by this user (supervisor level)
     */
    public function approvedStaff()
    {
        return $this->hasMany(Staff::class, 'approved_by');
    }

    /**
     * Get staff boarding approvals done by this user (Control Department)
     */
    public function controlApprovedStaff()
    {
        return $this->hasMany(Staff::class, 'control_approved_by');
    }

    /**
     * Get staff onboarded by this user
     */
    public function onboardedStaff()
    {
        return $this->hasMany(Staff::class, 'onboarded_by');
    }

    /**
     * Check if user has a specific role (only for staff/admin)
     */
    public function hasRole(string $role): bool
    {
        if (!in_array($this->user_type, ['staff', 'admin']) || !$this->staff_profile_id) {
            return false;
        }

        return DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $this->staff_profile_id)
            ->where(function ($q) use ($role) {
                $q->where('roles.name', $role)
                    ->orWhere('roles.slug', $role);
            })
            ->exists();
    }

    /**
     * Check if user has any admin role
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('super-admin') || $this->hasRole('admin');
    }

    /**
     * Check if user is SOL staff
     */
    public function isSOLStaff(): bool
    {
        if (!in_array($this->user_type, ['staff', 'admin']) || !$this->staff_profile_id) {
            return false;
        }

        return DB::table('staff')
            ->where('id', $this->staff_profile_id)
            ->where('client_id', 1) // SOL Nigeria client_id
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Get staff ID directly (for staff/admin users)
     */
    public function getStaffId(): ?int
    {
        if (in_array($this->user_type, ['staff', 'admin'])) {
            return $this->staff_profile_id;
        }

        return null;
    }

    /**
     * Get candidate ID directly (for candidate users)
     */
    public function getCandidateId(): ?int
    {
        if ($this->user_type === 'candidate') {
            return $this->candidate_profile_id;
        }

        return null;
    }

    /**
     * Get offer acceptance logs for actions performed by this user
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function offerActionsPerformed()
    {
        return $this->hasMany(StaffOfferAcceptanceLog::class, 'actioned_by');
    }
}
