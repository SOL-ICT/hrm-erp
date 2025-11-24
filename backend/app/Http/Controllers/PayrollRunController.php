<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\PayrollItem;
use App\Models\AttendanceRecord;
use App\Models\Staff;
use App\Models\PayGradeStructure;
use App\Services\PayrollCalculationEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

/**
 * Payroll Run Controller
 * 
 * Manages monthly payroll execution workflow
 * Workflow: draft → calculated → approved → exported
 */
class PayrollRunController extends Controller
{
    protected $calculationEngine;

    public function __construct(PayrollCalculationEngine $calculationEngine)
    {
        $this->calculationEngine = $calculationEngine;
    }

    /**
     * List all payroll runs (with filters)
     * GET /api/payroll-runs
     */
    public function index(Request $request)
    {
        $query = PayrollRun::with(['client', 'createdBy', 'approvedBy']);

        // Filter by client
        if ($request->has('client_id')) {
            $query->forClient($request->client_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->byStatus($request->status);
        }

        // Filter by period
        if ($request->has('month') && $request->has('year')) {
            $query->forPeriod($request->month, $request->year);
        }

        $payrollRuns = $query->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(20);

        return response()->json($payrollRuns);
    }

    /**
     * Create a new payroll run (draft)
     * POST /api/payroll-runs
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2100',
            'attendance_upload_id' => 'nullable|exists:attendance_uploads,id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check for duplicate payroll run
        $existing = PayrollRun::forClient($request->client_id)
            ->forPeriod($request->month, $request->year)
            ->whereNotIn('status', ['cancelled'])
            ->first();

        if ($existing) {
            return response()->json([
                'error' => 'Payroll run already exists for this client and period',
                'existing_payroll_run' => $existing,
            ], 409);
        }

        DB::beginTransaction();
        try {
            $payrollRun = PayrollRun::create([
                'client_id' => $request->client_id,
                'month' => $request->month,
                'year' => $request->year,
                'attendance_upload_id' => $request->attendance_upload_id,
                'status' => 'draft',
                'notes' => $request->notes,
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payroll run created successfully',
                'payroll_run' => $payrollRun->load(['client', 'createdBy']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create payroll run: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get single payroll run with items
     * GET /api/payroll-runs/{id}
     */
    public function show($id)
    {
        $payrollRun = PayrollRun::with([
            'client',
            'attendanceUpload',
            'payrollItems' => function ($query) {
                $query->orderBy('staff_name');
            },
            'payrollItems.staff',
            'createdBy',
            'approvedBy',
        ])->findOrFail($id);

        return response()->json($payrollRun);
    }

    /**
     * Calculate payroll for all staff
     * POST /api/payroll-runs/{id}/calculate
     */
    public function calculate($id)
    {
        $payrollRun = PayrollRun::findOrFail($id);

        if (!$payrollRun->canCalculate()) {
            return response()->json([
                'error' => 'Payroll run cannot be calculated in current status: ' . $payrollRun->status,
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Get all attendance records ready for calculation
            $attendanceRecords = AttendanceRecord::where('attendance_upload_id', $payrollRun->attendance_upload_id)
                ->where('ready_for_calculation', true)
                ->with(['staff', 'payGradeStructure'])
                ->get();

            if ($attendanceRecords->isEmpty()) {
                return response()->json([
                    'error' => 'No attendance records found for calculation',
                ], 400);
            }

            $calculatedItems = [];
            $errors = [];

            foreach ($attendanceRecords as $attendanceRecord) {
                try {
                    // Get staff and pay grade
                    $staff = $attendanceRecord->staff;
                    $payGrade = $attendanceRecord->payGradeStructure;

                    if (!$staff || !$payGrade) {
                        $errors[] = "Missing staff or pay grade for attendance record #{$attendanceRecord->id}";
                        continue;
                    }

                    // Calculate payroll
                    $calculation = $this->calculationEngine->calculateMonthlyPayroll(
                        $staff,
                        $payGrade,
                        $attendanceRecord,
                        $payrollRun->year
                    );

                    // Validate calculation
                    $validation = $this->calculationEngine->validateCalculation($calculation);

                    if (!$validation['valid']) {
                        $errors[] = "Calculation errors for {$staff->first_name} {$staff->last_name}: " . implode(', ', $validation['errors']);
                        continue;
                    }

                    // Create payroll item
                    $payrollItem = PayrollItem::create([
                        'payroll_run_id' => $payrollRun->id,
                        'client_id' => $payrollRun->client_id,
                        ...$calculation,
                    ]);

                    $calculatedItems[] = $payrollItem;
                } catch (\Exception $e) {
                    $errors[] = "Error calculating for attendance #{$attendanceRecord->id}: " . $e->getMessage();
                }
            }

            if (empty($calculatedItems)) {
                DB::rollBack();
                return response()->json([
                    'error' => 'No payroll items could be calculated',
                    'errors' => $errors,
                ], 400);
            }

            // Recalculate totals
            $payrollRun->recalculateTotals();
            $payrollRun->markAsCalculated();

            DB::commit();

            return response()->json([
                'message' => 'Payroll calculated successfully',
                'payroll_run' => $payrollRun->fresh()->load(['payrollItems']),
                'calculated_count' => count($calculatedItems),
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Calculation failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Approve payroll run
     * POST /api/payroll-runs/{id}/approve
     */
    public function approve($id)
    {
        $payrollRun = PayrollRun::findOrFail($id);

        if (!$payrollRun->canApprove()) {
            return response()->json([
                'error' => 'Payroll run cannot be approved in current status: ' . $payrollRun->status,
            ], 400);
        }

        DB::beginTransaction();
        try {
            $payrollRun->markAsApproved(auth()->id());
            DB::commit();

            return response()->json([
                'message' => 'Payroll run approved successfully',
                'payroll_run' => $payrollRun->fresh()->load(['approvedBy']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export payroll to Excel
     * GET /api/payroll-runs/{id}/export
     */
    public function export($id)
    {
        $payrollRun = PayrollRun::with(['client', 'payrollItems' => function ($query) {
            $query->orderBy('staff_name');
        }])->findOrFail($id);

        if (!$payrollRun->canExport()) {
            return response()->json([
                'error' => 'Payroll run cannot be exported in current status: ' . $payrollRun->status,
            ], 400);
        }

        // TODO: Implement Excel export using Laravel Excel
        // For now, return JSON data

        $exportData = [
            'payroll_run' => [
                'client' => $payrollRun->client->organisation_name ?? 'N/A',
                'month' => $payrollRun->month,
                'year' => $payrollRun->year,
                'total_staff' => $payrollRun->total_staff_count,
                'total_gross' => $payrollRun->total_gross_pay,
                'total_deductions' => $payrollRun->total_deductions,
                'total_net_pay' => $payrollRun->total_net_pay,
                'total_credit_to_bank' => $payrollRun->total_credit_to_bank,
            ],
            'items' => $payrollRun->payrollItems->map(function ($item) {
                return [
                    'staff_name' => $item->staff_name,
                    'staff_code' => $item->staff_code,
                    'bank_name' => $item->bank_name,
                    'account_number' => $item->account_number,
                    'days_present' => $item->days_present,
                    'days_absent' => $item->days_absent,
                    'monthly_gross' => $item->monthly_gross,
                    'paye_tax' => $item->paye_tax,
                    'pension' => $item->pension_deduction,
                    'total_deductions' => $item->total_deductions,
                    'net_pay' => $item->net_pay,
                    'monthly_reimbursables' => $item->monthly_reimbursables,
                    'credit_to_bank' => $item->credit_to_bank,
                    'emoluments' => $item->emoluments_snapshot,
                ];
            }),
        ];

        return response()->json($exportData);
    }

    /**
     * Cancel payroll run
     * POST /api/payroll-runs/{id}/cancel
     */
    public function cancel($id)
    {
        $payrollRun = PayrollRun::findOrFail($id);

        if ($payrollRun->status === 'exported') {
            return response()->json([
                'error' => 'Cannot cancel exported payroll run',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Delete all payroll items
            $payrollRun->payrollItems()->delete();

            // Mark as cancelled
            $payrollRun->cancel();

            DB::commit();

            return response()->json([
                'message' => 'Payroll run cancelled successfully',
                'payroll_run' => $payrollRun->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Cancellation failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete payroll run
     * DELETE /api/payroll-runs/{id}
     */
    public function destroy($id)
    {
        $payrollRun = PayrollRun::findOrFail($id);

        if ($payrollRun->status === 'approved' || $payrollRun->status === 'exported') {
            return response()->json([
                'error' => 'Cannot delete approved or exported payroll run',
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Delete all payroll items (cascade)
            $payrollRun->payrollItems()->delete();
            $payrollRun->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payroll run deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Deletion failed: ' . $e->getMessage()], 500);
        }
    }
}
