<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use App\Models\User;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link to user's email using Staff ID
     */
    public function sendResetLinkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide your Staff ID',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find staff by staff_id
        $staff = \App\Models\Staff::where('staff_id', $request->staff_id)->first();

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'No staff record found with this Staff ID'
            ], 404);
        }

        // Find associated user account
        $user = User::where('staff_profile_id', $staff->id)->first();

        if (!$user || !$user->email) {
            return response()->json([
                'success' => false,
                'message' => 'No user account found for this Staff ID. Please contact HR.'
            ], 404);
        }

        // Send password reset link using the user's email
        $status = Password::sendResetLink(
            ['email' => $user->email]
        );

        if ($status === Password::RESET_LINK_SENT) {
            // Mask email for privacy (show first 2 chars and domain)
            $emailParts = explode('@', $user->email);
            $maskedEmail = substr($emailParts[0], 0, 2) . '***@' . $emailParts[1];

            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent successfully!',
                'masked_email' => $maskedEmail,
                'staff_name' => $staff->first_name . ' ' . $staff->last_name
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to send password reset link. Please try again.'
        ], 500);
    }

    /**
     * Verify reset token
     */
    public function verifyToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if token exists and is valid
        $tokenExists = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->where('created_at', '>', now()->subHours(1)) // Token valid for 1 hour
            ->exists();

        if ($tokenExists) {
            return response()->json([
                'success' => true,
                'message' => 'Token is valid'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired reset token'
        ], 400);
    }

    /**
     * Reset password
     */
    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password has been reset successfully. You can now login with your new password.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $status === Password::INVALID_TOKEN 
                ? 'Invalid or expired reset token' 
                : 'Unable to reset password. Please try again.'
        ], 400);
    }
}
