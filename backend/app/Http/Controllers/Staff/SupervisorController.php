<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\LeaveEngine\StaffSupervisor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SupervisorController extends Controller
{
    /**
     * Get the authenticated staff's ID (staff_profile_id from users table)
     */
    private function getAuthenticatedStaffId()
    {
        $user = Auth::user();
        return $user->staff_profile_id ?? $user->id;
    }

    /**
     * Get the current active supervisor for the authenticated staff
     */
    public function show()
    {
        try {
            $staffId = $this->getAuthenticatedStaffId();

            $supervisor = StaffSupervisor::where('staff_id', $staffId)
                ->where('is_active', true)
                ->latest()
                ->first();

            if (!$supervisor) {
                return response()->json([
                    'message' => 'No supervisor information found',
                    'data' => null
                ], 200);
            }

            return response()->json([
                'message' => 'Supervisor information retrieved successfully',
                'data' => $supervisor
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve supervisor information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save or update supervisor information
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'supervisor_name' => 'required|string|max:255',
                'supervisor_email' => 'required|email|max:255',
                'supervisor_phone' => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staffId = $this->getAuthenticatedStaffId();

            // Deactivate all previous supervisors for this staff
            StaffSupervisor::where('staff_id', $staffId)
                ->update(['is_active' => false]);

            // Create new supervisor record
            $supervisor = StaffSupervisor::create([
                'staff_id' => $staffId,
                'supervisor_name' => $request->supervisor_name,
                'supervisor_email' => $request->supervisor_email,
                'supervisor_phone' => $request->supervisor_phone,
                'is_active' => true,
            ]);

            return response()->json([
                'message' => 'Supervisor information saved successfully',
                'data' => $supervisor
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save supervisor information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update existing supervisor information
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'supervisor_name' => 'required|string|max:255',
                'supervisor_email' => 'required|email|max:255',
                'supervisor_phone' => 'required|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $staffId = $this->getAuthenticatedStaffId();

            $supervisor = StaffSupervisor::where('id', $id)
                ->where('staff_id', $staffId)
                ->first();

            if (!$supervisor) {
                return response()->json([
                    'message' => 'Supervisor record not found',
                ], 404);
            }

            $supervisor->update([
                'supervisor_name' => $request->supervisor_name,
                'supervisor_email' => $request->supervisor_email,
                'supervisor_phone' => $request->supervisor_phone,
            ]);

            return response()->json([
                'message' => 'Supervisor information updated successfully',
                'data' => $supervisor
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update supervisor information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get history of all supervisors for the authenticated staff
     */
    public function history()
    {
        try {
            $staffId = $this->getAuthenticatedStaffId();

            $supervisors = StaffSupervisor::where('staff_id', $staffId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'message' => 'Supervisor history retrieved successfully',
                'data' => $supervisors
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve supervisor history',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
