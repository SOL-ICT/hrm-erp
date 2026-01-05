<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffTermination;
use App\Models\StaffBlacklist;
use App\Models\Staff;
use App\Services\EmployeeManagementBulkUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class TerminationController extends Controller
{
    /**
     * Display a listing of terminations with filters.
     */
    public function index(Request $request)
    {
        $query = StaffTermination::with(['staff', 'client', 'processedBy']);

        // Filter by client
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Filter by termination type
        if ($request->filled('termination_type')) {
            $query->where('termination_type', $request->termination_type);
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->where('termination_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('termination_date', '<=', $request->to_date);
        }

        // Filter by blacklist status
        if ($request->filled('is_blacklisted')) {
            $query->where('is_blacklisted', $request->is_blacklisted);
        }

        $terminations = $query->orderBy('termination_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($terminations);
    }

    /**
     * Store a newly created termination record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'termination_type' => ['required', Rule::in(['terminated', 'death', 'resignation'])],
            'termination_date' => 'required|date',
            'notice_period_days' => 'nullable|integer|min:0|max:30',
            'transaction_date' => 'required|date',
            'actual_relieving_date' => 'required|date',
            'reason' => 'required|string',
            'exit_penalty' => ['nullable', Rule::in(['yes', 'no'])],
            'ppe_return' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
            'exit_interview' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
            'is_blacklisted' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create termination record
            $termination = StaffTermination::create([
                'staff_id' => $request->staff_id,
                'client_id' => $request->client_id,
                'termination_type' => $request->termination_type,
                'termination_date' => $request->termination_date,
                'notice_period_days' => $request->notice_period_days,
                'transaction_date' => $request->transaction_date,
                'actual_relieving_date' => $request->actual_relieving_date,
                'reason' => $request->reason,
                'exit_penalty' => $request->exit_penalty ?? 'no',
                'ppe_return' => $request->ppe_return ?? 'n/a',
                'exit_interview' => $request->exit_interview ?? 'n/a',
                'is_blacklisted' => $request->is_blacklisted ?? false,
                'processed_by' => auth()->id(),
            ]);

            // Update staff status to terminated
            $staff = Staff::findOrFail($request->staff_id);
            $staff->update(['status' => 'terminated']);

            // If blacklisted, create blacklist record with snapshot
            if ($request->is_blacklisted) {
                StaffBlacklist::create([
                    'staff_id' => $request->staff_id,
                    'client_id' => $request->client_id,
                    'termination_id' => $termination->id,
                    'blacklist_date' => $request->termination_date,
                    'reason' => $request->reason,
                    'staff_details_snapshot' => [
                        'staff_id' => $staff->staff_id,
                        'first_name' => $staff->first_name,
                        'last_name' => $staff->last_name,
                        'department' => $staff->department,
                        'job_title' => $staff->job_title,
                        'client_id' => $staff->client_id,
                        'termination_type' => $request->termination_type,
                    ],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staff termination recorded successfully',
                'data' => $termination->load(['staff', 'client', 'processedBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record termination',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified termination record.
     */
    public function show(string $id)
    {
        $termination = StaffTermination::with(['staff', 'client', 'processedBy'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $termination
        ]);
    }

    /**
     * Update the specified termination record.
     */
    public function update(Request $request, string $id)
    {
        $termination = StaffTermination::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'termination_date' => 'nullable|date',
            'notice_period_days' => 'nullable|integer|min:0|max:30',
            'transaction_date' => 'nullable|date',
            'actual_relieving_date' => 'nullable|date',
            'reason' => 'nullable|string',
            'exit_penalty' => ['nullable', Rule::in(['yes', 'no'])],
            'ppe_return' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
            'exit_interview' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $termination->update($request->only([
            'termination_date',
            'notice_period_days',
            'transaction_date',
            'actual_relieving_date',
            'reason',
            'exit_penalty',
            'ppe_return',
            'exit_interview',
            'notes',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Termination record updated successfully',
            'data' => $termination->load(['staff', 'client', 'processedBy'])
        ]);
    }

    /**
     * Remove the specified termination record.
     */
    public function destroy(string $id)
    {
        try {
            $termination = StaffTermination::findOrFail($id);

            // Note: Consider soft deletes or preventing deletion if related records exist
            $termination->delete();

            return response()->json([
                'success' => true,
                'message' => 'Termination record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete termination record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Excel template for bulk upload.
     */
    public function downloadTemplate()
    {
        $bulkService = new EmployeeManagementBulkUploadService();
        $templatePath = $bulkService->generateTemplate('termination');

        return response()->download($templatePath, 'termination_bulk_upload_template.xlsx')->deleteFileAfterSend(true);
    }

    /**
     * Handle bulk upload of terminations via Excel.
     */
    /**
     * Bulk upload terminations from Excel file.
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
            'client_id' => 'required|exists:clients,id'
        ]);

        $bulkService = new EmployeeManagementBulkUploadService();

        // Parse Excel file
        $parseResult = $bulkService->parseExcel($request->file('file'), 'termination');

        if (!$parseResult['success']) {
            return response()->json($parseResult, 400);
        }

        // Match staff
        $matchResult = $bulkService->matchStaff($parseResult['data'], $request->client_id);

        // Process matched records
        if ($matchResult['matched_count'] > 0) {
            $processResult = $bulkService->processBulkTerminations(
                $matchResult['matched'],
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => "Bulk upload completed",
                'total_rows' => $parseResult['total_rows'],
                'matched_count' => $matchResult['matched_count'],
                'created_count' => $processResult['created_count'],
                'unmatched_count' => $matchResult['unmatched_count'],
                'error_count' => $processResult['error_count'],
                'unmatched_rows' => $matchResult['unmatched'],
                'errors' => $processResult['errors']
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No matched staff found',
            'unmatched_rows' => $matchResult['unmatched']
        ], 422);
    }
}
