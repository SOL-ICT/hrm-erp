<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffPromotion;
use App\Models\Staff;
use App\Models\PayGradeStructure;
use App\Services\EmployeeManagementBulkUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PromotionController extends Controller
{
    /**
     * Display a listing of promotions with filters.
     */
    public function index(Request $request)
    {
        $query = StaffPromotion::with([
            'staff',
            'client',
            'oldJobStructure',
            'oldPayGrade',
            'newJobStructure',
            'newPayGrade',
            'processedBy'
        ]);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('from_date')) {
            $query->where('effective_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('effective_date', '<=', $request->to_date);
        }

        $promotions = $query->orderBy('effective_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($promotions);
    }

    /**
     * Store a newly created promotion record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'old_job_structure_id' => 'required|exists:job_structures,id',
            'old_pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
            'new_job_structure_id' => 'required|exists:job_structures,id',
            'new_pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
            'effective_date' => 'required|date',
            'reason' => 'nullable|string',
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

            // Get emoluments from old and new pay grades
            $oldPayGrade = PayGradeStructure::findOrFail($request->old_pay_grade_structure_id);
            $newPayGrade = PayGradeStructure::findOrFail($request->new_pay_grade_structure_id);

            // Validate new grade belongs to client
            $newJobStructure = $newPayGrade->jobStructure;
            if ($newJobStructure->client_id != $request->client_id) {
                throw new \Exception('New pay grade does not belong to the specified client');
            }

            // Create promotion record with emolument snapshots
            $promotion = StaffPromotion::create([
                'staff_id' => $request->staff_id,
                'client_id' => $request->client_id,
                'old_job_structure_id' => $request->old_job_structure_id,
                'old_pay_grade_structure_id' => $request->old_pay_grade_structure_id,
                'new_job_structure_id' => $request->new_job_structure_id,
                'new_pay_grade_structure_id' => $request->new_pay_grade_structure_id,
                'effective_date' => $request->effective_date,
                'old_emoluments' => $oldPayGrade->emoluments,
                'new_emoluments' => $newPayGrade->emoluments,
                'reason' => $request->reason,
                'processed_by' => auth()->id(),
            ]);

            // Update staff record with new pay grade
            $staff->update([
                'pay_grade_structure_id' => $request->new_pay_grade_structure_id
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staff promotion recorded successfully',
                'data' => $promotion->load([
                    'staff',
                    'client',
                    'oldJobStructure',
                    'oldPayGrade',
                    'newJobStructure',
                    'newPayGrade',
                    'processedBy'
                ])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to record promotion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified promotion record.
     */
    public function show(string $id)
    {
        $promotion = StaffPromotion::with([
            'staff',
            'client',
            'oldJobStructure',
            'oldPayGrade',
            'newJobStructure',
            'newPayGrade',
            'processedBy'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $promotion
        ]);
    }

    /**
     * Update the specified promotion record.
     */
    public function update(Request $request, string $id)
    {
        $promotion = StaffPromotion::findOrFail($id);

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

        $promotion->update($request->only([
            'effective_date',
            'reason',
            'notes',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Promotion record updated successfully',
            'data' => $promotion->load([
                'staff',
                'client',
                'oldJobStructure',
                'oldPayGrade',
                'newJobStructure',
                'newPayGrade',
                'processedBy'
            ])
        ]);
    }

    /**
     * Remove the specified promotion record.
     */
    public function destroy(string $id)
    {
        try {
            $promotion = StaffPromotion::findOrFail($id);
            $promotion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Promotion record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete promotion record',
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
        $templatePath = $bulkService->generateTemplate('promotion');

        return response()->download($templatePath, 'promotion_bulk_upload_template.xlsx')->deleteFileAfterSend(true);
    }

    /**
     * Handle bulk upload of promotions via Excel.
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
            'client_id' => 'required|exists:clients,id'
        ]);

        $bulkService = new EmployeeManagementBulkUploadService();

        // Parse Excel file
        $parseResult = $bulkService->parseExcel($request->file('file'), 'promotion');

        if (!$parseResult['success']) {
            return response()->json($parseResult, 400);
        }

        // Match staff
        $matchResult = $bulkService->matchStaff($parseResult['data'], $request->client_id);

        // Process matched records
        if ($matchResult['matched_count'] > 0) {
            $processResult = $bulkService->processBulkPromotions(
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
