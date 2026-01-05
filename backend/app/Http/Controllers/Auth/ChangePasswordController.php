<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Models\Staff;

class ChangePasswordController extends Controller
{
    /**
     * Change password using Staff ID and current password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|string',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find staff by staff_id
        $staff = Staff::where('staff_id', $request->staff_id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Staff ID'
            ], 404);
        }

        // Find associated user account
        $user = User::where('staff_profile_id', $staff->id)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No user account found for this Staff ID'
            ], 404);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 401);
        }

        // Update to new password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully!'
        ]);
    }
}
