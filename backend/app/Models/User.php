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
        'user_type',
        'profile_id',
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
        return $this->belongsTo(\App\Models\Staff::class, 'profile_id')
            ->when($this->user_type === 'staff' || $this->user_type === 'admin');
    }

    /**
     * Get the candidate profile if user is candidate
     */
    public function candidateProfile()
    {
        return $this->belongsTo(\App\Models\Candidate::class, 'profile_id')
            ->when($this->user_type === 'candidate');
    }

    /**
     * Check if user has a specific role (only for staff/admin)
     */
    public function hasRole(string $role): bool
    {
        if (!in_array($this->user_type, ['staff', 'admin']) || !$this->profile_id) {
            return false;
        }

        return DB::table('staff_roles')
            ->join('roles', 'staff_roles.role_id', '=', 'roles.id')
            ->where('staff_roles.staff_id', $this->profile_id)
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
        if (!in_array($this->user_type, ['staff', 'admin']) || !$this->profile_id) {
            return false;
        }

        return DB::table('staff')
            ->where('id', $this->profile_id)
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
            return $this->profile_id;
        }

        return null;
    }

    /**
     * Get candidate ID directly (for candidate users)
     */
    public function getCandidateId(): ?int
    {
        if ($this->user_type === 'candidate') {
            return $this->profile_id;
        }

        return null;
    }
}
