<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StaffProfileController extends Controller
{
    public function index()
    {
        // Debug authentication across all guards
        Log::info('StaffProfileController::index - Auth Debug:', [
            'sanctum_user' => Auth::guard('sanctum')->user(),
            'web_user' => Auth::guard('web')->user(),
            'default_user' => Auth::user(),
            'all_guards' => [
                'sanctum' => Auth::guard('sanctum')->check(),
                'web' => Auth::guard('web')->check(),
                'default' => Auth::check(),
            ],
            'session_id' => request()->session()->getId(),
            'has_session' => request()->hasSession(),
        ]);

        try {
            // Fetch all staff profiles from the view
            $staffProfiles = DB::table('staff_profiles')->get();
            
            // Log the query result
            Log::info('StaffProfileController::index - Query result:', [
                'count' => $staffProfiles->count(),
                'data' => $staffProfiles->toArray()
            ]);

            return response()->json($staffProfiles);
        } catch (\Exception $e) {
            // Log any database errors
            Log::error('StaffProfileController::index - Database error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error fetching staff profiles'], 500);
        }
    }

    public function show($id)
    {
        // Log the authenticated user and staff_id
        Log::info('StaffProfileController::show - Authenticated user:', [
            'user' => Auth::user(),
            'staff_id' => $id
        ]);

        try {
            // Fetch single staff profile by staff_id
            $staffProfile = DB::table('staff_profiles')->where('staff_id', $id)->first();

            if (!$staffProfile) {
                Log::warning('StaffProfileController::show - Profile not found:', ['staff_id' => $id]);
                return response()->json(['message' => 'Staff profile not found'], 404);
            }

            // Log the query result
            Log::info('StaffProfileController::show - Query result:', ['data' => $staffProfile]);

            return response()->json($staffProfile);
        } catch (\Exception $e) {
            // Log any database errors
            Log::error('StaffProfileController::show - Database error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error fetching staff profile'], 500);
        }
    }

    public function me(Request $request)
{
    $user = $request->user();

    \Log::info('StaffProfileController::me - Authenticated user:', [
        'user_id' => $user?->id,
    ]);

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    try {
        // Match staff_profiles.staff_id to users.id
        $staffProfile = \DB::table('staff_profiles')
            ->where('staff_id', $user->id)
            ->first();

        if (!$staffProfile) {
            \Log::warning('StaffProfileController::me - Profile not found for user_id', [
                'user_id' => $user->id,
            ]);
            return response()->json(['message' => 'Staff profile not found'], 404);
        }

        \Log::info('StaffProfileController::me - Found profile:', ['data' => $staffProfile]);

        return response()->json($staffProfile);

    } catch (\Exception $e) {
        \Log::error('StaffProfileController::me - Database error:', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json(['message' => 'Error fetching staff profile'], 500);
    }
}

}