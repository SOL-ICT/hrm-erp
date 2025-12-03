<?php

namespace App\Services;

use App\Models\User;
use App\Models\Staff;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserRoleService
{
    /**
     * Get SOL staff users (client_id = 1) with their current roles
     */
    public function getSOLStaffUsers($filters = [])
    {
        $query = User::select([
            'users.id',
            'users.name',
            'users.email',
            'users.username',
            'users.user_type',
            'users.is_active',
            'users.created_at',
            'users.updated_at',
            'staff.id as staff_id',
            'staff.employee_code',
            'staff.staff_id as staff_code',
            'staff.first_name',
            'staff.last_name',
            'staff.status as staff_status',
            'staff.client_id'
        ])
        ->join('staff', 'users.staff_profile_id', '=', 'staff.id')
        ->where('staff.client_id', 1) // SOL Nigeria only
        ->whereIn('users.user_type', ['staff', 'admin']);

        // Get current role from staff_roles (latest assigned)
        $query->addSelect([
            'current_role_id' => DB::table('staff_roles')
                ->select('role_id')
                ->whereColumn('staff_id', 'staff.id')
                ->orderBy('assigned_at', 'desc')
                ->limit(1),
            'role_assigned_at' => DB::table('staff_roles')
                ->select('assigned_at')
                ->whereColumn('staff_id', 'staff.id')
                ->orderBy('assigned_at', 'desc')
                ->limit(1)
        ]);

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%")
                  ->orWhere('users.username', 'like', "%{$search}%")
                  ->orWhere('staff.first_name', 'like', "%{$search}%")
                  ->orWhere('staff.last_name', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['role_id'])) {
            $query->whereIn('staff.id', function($q) use ($filters) {
                $q->select('staff_id')
                  ->from('staff_roles as sr')
                  ->where('role_id', $filters['role_id'])
                  ->whereRaw('sr.id = (SELECT MAX(id) FROM staff_roles WHERE staff_id = sr.staff_id)');
            });
        }

        if (!empty($filters['status'])) {
            if ($filters['status'] === 'active') {
                $query->where('users.is_active', 1);
            } else {
                $query->where('users.is_active', 0);
            }
        }

        $perPage = $filters['per_page'] ?? 15;
        $users = $query->orderBy('users.created_at', 'desc')->paginate($perPage);

        // Attach role details to each user
        foreach ($users as $user) {
            if ($user->current_role_id) {
                $user->current_role = Role::find($user->current_role_id);
            } else {
                $user->current_role = null;
            }
        }

        return $users;
    }

    /**
     * Get all available roles
     */
    public function getAvailableRoles()
    {
        return Role::where('is_active', 1)
                   ->orderBy('name')
                   ->get(['id', 'name', 'slug', 'description']);
    }

    /**
     * Change user role (creates new staff_roles record)
     */
    public function changeUserRole($userId, $roleId, $reason = null, $changedBy)
    {
        // Validate user exists and is SOL staff
        $user = User::with('staff')->find($userId);
        if (!$user || !$user->staff || $user->staff->client_id != 1) {
            throw new \Exception('User not found or not a SOL staff member');
        }

        // Check user can't change their own role
        if ($userId == $changedBy) {
            throw new \Exception('You cannot change your own role');
        }

        // Validate role exists
        $role = Role::find($roleId);
        if (!$role) {
            throw new \Exception('Invalid role selected');
        }

        $staffId = $user->staff->id;

        // Get current role
        $currentRole = DB::table('staff_roles')
            ->where('staff_id', $staffId)
            ->orderBy('assigned_at', 'desc')
            ->first();

        // Check if trying to assign same role
        if ($currentRole && $currentRole->role_id == $roleId) {
            throw new \Exception('User already has this role');
        }

        // Insert new role assignment (preserves history)
        $staffRoleId = DB::table('staff_roles')->insertGetId([
            'staff_id' => $staffId,
            'role_id' => $roleId,
            'assigned_at' => now(),
            'assigned_by' => $changedBy,
            'reason' => $reason,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Also update users.role for backward compatibility
        $user->role = $role->slug;
        $user->save();

        return [
            'user' => $user->fresh(['staff']),
            'old_role' => $currentRole ? Role::find($currentRole->role_id) : null,
            'new_role' => $role,
            'reason' => $reason,
            'staff_role_id' => $staffRoleId
        ];
    }

    /**
     * Get role change history
     */
    public function getRoleChangeHistory($userId = null, $perPage = 20)
    {
        $query = DB::table('staff_roles as sr')
            ->join('staff as s', 'sr.staff_id', '=', 's.id')
            ->join('users as u', 's.id', '=', 'u.staff_profile_id')
            ->join('roles as r', 'sr.role_id', '=', 'r.id')
            ->leftJoin('users as changer', 'sr.assigned_by', '=', 'changer.id')
            ->where('s.client_id', 1) // SOL only
            ->select([
                'sr.id',
                'sr.assigned_at',
                'sr.reason',
                'u.id as user_id',
                'u.name as user_name',
                'u.email as user_email',
                's.id as staff_id',
                'r.id as role_id',
                'r.name as role_name',
                'r.slug as role_slug',
                'changer.id as changed_by_id',
                'changer.name as changed_by_name'
            ]);

        if ($userId) {
            $query->where('u.id', $userId);
        }

        $history = $query->orderBy('sr.assigned_at', 'desc')
                         ->paginate($perPage);

        // Format history with old_role (previous assignment)
        $items = $history->items();
        foreach ($items as $index => $item) {
            // Get previous role for this staff member
            $previousRole = DB::table('staff_roles as sr')
                ->join('roles as r', 'sr.role_id', '=', 'r.id')
                ->where('sr.staff_id', $item->staff_id)
                ->where('sr.assigned_at', '<', $item->assigned_at)
                ->orderBy('sr.assigned_at', 'desc')
                ->first(['r.id as role_id', 'r.name as role_name', 'r.slug as role_slug']);

            // Add flattened old_role fields
            if ($previousRole) {
                $item->old_role_id = $previousRole->role_id;
                $item->old_role_name = $previousRole->role_name;
                $item->old_role_slug = $previousRole->role_slug;
            } else {
                $item->old_role_id = null;
                $item->old_role_name = null;
                $item->old_role_slug = null;
            }

            // Add flattened new_role fields
            $item->new_role_id = $item->role_id;
            $item->new_role_name = $item->role_name;
            $item->new_role_slug = $item->role_slug;
        }

        return $history;
    }

    /**
     * Reset user password
     */
    public function resetPassword($userId, $sendEmail = true)
    {
        $user = User::with('staff')->find($userId);
        if (!$user || !$user->staff || $user->staff->client_id != 1) {
            throw new \Exception('User not found or not a SOL staff member');
        }

        // Generate random password
        $newPassword = Str::random(12);
        $user->password = Hash::make($newPassword);
        $user->save();

        // TODO: Send email with new password
        // Mail::to($user->email)->send(new PasswordResetMail($newPassword));

        return [
            'user' => $user,
            'password' => $newPassword, // In production, don't return this
            'email_sent' => $sendEmail
        ];
    }
}
