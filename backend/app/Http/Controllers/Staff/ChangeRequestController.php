<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChangeRequestController extends Controller
{
    /**
     * Display a summary of the staff profile and a button to view history.
     */
    public function showProfile(Request $request)
    {
        // For demonstration, let's assume the user ID is retrieved from the authenticated user.
        // In a real application, you'd use something like $user = Auth::user();
        $userId = $request->user()->id;

        // Fetch staff profile data
        $staffProfile = DB::table('staff')->where('id', $userId)->first();

        // Fetch application history
        $applicationHistory = DB::table('change_request_history')
                                ->where('staff_id', $userId)
                                ->orderBy('action_date', 'desc')
                                ->get();

        return response()->json([
            'staffProfile' => $staffProfile,
            'applicationHistory' => $applicationHistory
        ]);
    }

    /**
     * Handle the submission of a new change request.
     */
    // ChangeRequestController.php (inside store function)
        public function store(Request $request)
        {
            // No need to validate the whole array at once, process fields dynamically
            // and check if they are present

            $userId = $request->user()->id;
            $proofDocuments = [];
            $newValues = [];
            $fieldsToChange = [];

            // Dynamically get all keys from the request that are not 'userId'
            // This handles varying numbers of fields.
            foreach ($request->all() as $key => $value) {
                // Check if the key is a change field and not a file
                if ($key !== 'userId' && !str_ends_with($key, '_proof')) {
                    $fieldId = $key;
                    $fieldsToChange[] = $fieldId;
                    $newValues[$fieldId] = $value;

                    // Check if a corresponding proof file exists
                    if ($request->hasFile($fieldId . '_proof')) {
                        $file = $request->file($fieldId . '_proof');
                        // Store the file and get the path (e.g., in S3)
                        $path = $file->store('proof_documents', 'public');
                        // Store the URL/key in the array
                        $proofDocuments[$fieldId] = Storage::url($path);
                    }
                }
            }

            // Now use the prepared arrays for the database insertion
            DB::beginTransaction();
            try {
                // Insert into change_requests table
                $changeRequestId = DB::table('change_requests')->insertGetId([
                    'staff_id' => $userId,
                    'fields_to_change' => json_encode($fieldsToChange),
                    'new_values' => json_encode($newValues),
                    'proof_documents' => json_encode($proofDocuments),
                    'submitted_at' => now(),
                ]);

                // Insert into change_request_history for each field
                foreach ($fieldsToChange as $fieldId) {
                    // Get old value for history logging
                    $oldValue = DB::table('staff')->where('id', $userId)->value($fieldId);

                    DB::table('change_request_history')->insert([
                        'change_request_id' => $changeRequestId,
                        'staff_id' => $userId,
                        'field_changed' => $fieldId,
                        'old_value' => $oldValue,
                        'new_value' => $newValues[$fieldId],
                        'action_status' => 'submitted',
                        'action_date' => now(),
                    ]);
                }

                DB::commit();
                return response()->json(['message' => 'Change request submitted successfully.'], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['message' => 'An error occurred.', 'error' => $e->getMessage()], 500);
            }
        }

    /**
     * Get the history of all change requests for the user.
     */
    public function getHistory(Request $request)
    {
        $userId = $request->user()->id;

        $history = DB::table('change_request_history')
                     ->where('staff_id', $userId)
                     ->orderBy('action_date', 'desc')
                     ->get();

        return response()->json($history);
    }

    /**
     * Update the status of a change request (admin-only).
     */
    public function update(Request $request, $id)
    {
        // This would require authentication and authorization for admin users
        $validatedData = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Update the change_requests table
            DB::table('change_requests')
                ->where('id', $id)
                ->update([
                    'status' => $validatedData['status'],
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                    'rejection_reason' => $validatedData['notes'],
                ]);

            // Get the details of the request
            $requestData = DB::table('change_requests')->where('id', $id)->first();
            $fieldsToChange = json_decode($requestData->fields_to_change, true);
            $newValues = json_decode($requestData->new_values, true);

            // Log action in history for each changed field
            foreach ($fieldsToChange as $fieldId) {
                DB::table('change_request_history')->insert([
                    'change_request_id' => $id,
                    'staff_id' => $requestData->staff_id,
                    'field_changed' => $fieldId,
                    'old_value' => DB::table('staff')->where('id', $requestData->staff_id)->value($fieldId),
                    'new_value' => $newValues[$fieldId],
                    'action_status' => $validatedData['status'],
                    'action_date' => now(),
                    'notes' => $validatedData['notes']
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Request updated successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'An error occurred.', 'error' => $e->getMessage()], 500);
        }
    }
}