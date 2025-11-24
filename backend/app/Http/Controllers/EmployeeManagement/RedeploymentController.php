<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffRedeployment;
use App\Models\Staff;
use App\Models\PayGradeStructure;
use App\Services\EmployeeManagementBulkUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RedeploymentController extends Controller
{
    /**
     * Display a listing of redeployments with filters.
     */
    public function index(Request $request)
    {
        $query = StaffRedeployment::with([
            'staff',
            'client',
            'oldClient',
            'newClient',
            'oldServiceLocation',
            'newServiceLocation',
            'processedBy'
        ]);

        if ($request->filled('client_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('old_client_id', $request->client_id)
                    ->orWhere('new_client_id', $request->client_id);
            });
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('redeployment_type')) {
            $query->where('redeployment_type', $request->redeployment_type);
        }

        if ($request->filled('from_date')) {
            $query->where('effective_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('effective_date', '<=', $request->to_date);
        }

        $redeployments = $query->orderBy('effective_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($redeployments);
    }

    /**
     * Store a newly created redeployment record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'redeployment_type' => ['required', Rule::in(['department', 'service_location', 'client'])],
            'old_department' => 'nullable|string',
            'new_department' => 'nullable|string',
            'old_service_location_id' => 'nullable|exists:service_locations,id',
            'new_service_location_id' => 'nullable|exists:service_locations,id',
            'old_client_id' => 'nullable|exists:clients,id',
            'new_client_id' => 'nullable|exists:clients,id',
            'new_pay_grade_structure_id' => 'nullable|exists:pay_grade_structures,id',
            'effective_date' => 'required|date',
            'reason' => 'required|string',
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

            $staff = Staff::findOrFail($request->staff_id);

            // Validate cross-client redeployment
            if ($request->redeployment_type === 'client' && $request->new_pay_grade_structure_id) {
                $newPayGrade = PayGradeStructure::with('jobStructure')->findOrFail($request->new_pay_grade_structure_id);

                if ($newPayGrade->jobStructure->client_id != $request->new_client_id) {
                    throw new \Exception('New pay grade does not belong to the new client\'s job structure');
                }
            }

            // Create redeployment record with audit trail
            $redeployment = StaffRedeployment::create([
                'staff_id' => $request->staff_id,
                'client_id' => $request->client_id, // Current client at time of redeployment
                'redeployment_type' => $request->redeployment_type,
                'old_department' => $request->old_department ?? $staff->department,
                'new_department' => $request->new_department,
                'old_service_location_id' => $request->old_service_location_id ?? $staff->service_location_id,
                'new_service_location_id' => $request->new_service_location_id,
                'old_client_id' => $request->old_client_id ?? $staff->client_id,
                'new_client_id' => $request->new_client_id,
                'effective_date' => $request->effective_date,
                'reason' => $request->reason,
                'processed_by' => auth()->id(),
                'notes' => $request->notes,
            ]);

            // Update staff record based on redeployment type
            $updates = [];

            if ($request->redeployment_type === 'department' && $request->new_department) {
                $updates['department'] = $request->new_department;
            }

            if ($request->redeployment_type === 'service_location' && $request->new_service_location_id) {
                $updates['service_location_id'] = $request->new_service_location_id;
            }

            if ($request->redeployment_type === 'client' && $request->new_client_id) {
                // Cross-client redeployment: update ALL new client details
                $updates['client_id'] = $request->new_client_id;
                $updates['department'] = $request->new_department;
                $updates['service_location_id'] = $request->new_service_location_id;

                if ($request->new_pay_grade_structure_id) {
                    $updates['pay_grade_structure_id'] = $request->new_pay_grade_structure_id;
                }
            }

            $staff->update($updates);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staff redeployment recorded successfully',
                'data' => $redeployment->load([
                    'staff',
                    'client',
                    'oldClient',
                    'newClient',
                    'oldServiceLocation',
                    'newServiceLocation',
                    'processedBy'
                ])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record redeployment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified redeployment record.
     */
    public function show(string $id)
    {
        $redeployment = StaffRedeployment::with([
            'staff',
            'client',
            'oldClient',
            'newClient',
            'oldServiceLocation',
            'newServiceLocation',
            'processedBy'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $redeployment
        ]);
    }

    /**
     * Update the specified redeployment record.
     */
    public function update(Request $request, string $id)
    {
        $redeployment = StaffRedeployment::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'effective_date' => 'nullable|date',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $redeployment->update($request->only([
            'effective_date',
            'reason',
            'notes',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Redeployment record updated successfully',
            'data' => $redeployment->load([
                'staff',
                'client',
                'oldClient',
                'newClient',
                'oldServiceLocation',
                'newServiceLocation',
                'processedBy'
            ])
        ]);
    }

    /**
     * Remove the specified redeployment record.
     */
    public function destroy(string $id)
    {
        try {
            $redeployment = StaffRedeployment::findOrFail($id);
            $redeployment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Redeployment record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete redeployment record',
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
        $templatePath = $bulkService->generateTemplate('redeployment');

        return response()->download($templatePath, 'redeployment_bulk_upload_template.xlsx')->deleteFileAfterSend(true);
    }

    /**
     * Handle bulk upload of redeployments via Excel.
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
            'client_id' => 'required|exists:clients,id'
        ]);

        $bulkService = new EmployeeManagementBulkUploadService();

        // Parse Excel file
        $parseResult = $bulkService->parseExcel($request->file('file'), 'redeployment');

        if (!$parseResult['success']) {
            return response()->json($parseResult, 400);
        }

        // Match staff
        $matchResult = $bulkService->matchStaff($parseResult['data'], $request->client_id);

        // Process matched records
        if ($matchResult['matched_count'] > 0) {
            $processResult = $bulkService->processBulkRedeployments(
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
