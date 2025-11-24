<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayrollRun;
use App\Services\PayrollCalculationService;
use App\Exports\PayrollRunExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;
use Exception;

/**
 * Payroll Run Controller
 * 
 * Handles payroll execution workflow:
 * 1. Create run (draft)
 * 2. Calculate payroll for all employees
 * 3. Approve run
 * 4. Export to Excel
 * 5. Cancel/Delete if needed
 */
class PayrollRunController extends Controller
{
    protected PayrollCalculationService $calculationService;

    public function __construct(
        PayrollCalculationService $calculationService
    ) {
        $this->calculationService = $calculationService;
    }

    /**
     * GET /api/payroll/runs
     * List all payroll runs with filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->query('per_page', 15);
            $clientId = $request->query('client_id');
            $status = $request->query('status');
            $month = $request->query('month');
            $year = $request->query('year');

            // Build query
            $query = PayrollRun::with(['client']);

            // Apply filters
            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            if ($status) {
                $query->where('status', $status);
            }

            if ($month) {
                $query->where('month', $month);
            }

            if ($year) {
                $query->where('year', $year);
            }

            // Order by latest first
            $query->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->orderBy('created_at', 'desc');

            // Paginate
            $runs = $query->paginate($perPage);

            // Transform data
            $transformedData = collect($runs->items())->map(function ($run) {
                return [
                    'id' => $run->id,
                    'run_name' => $this->generateRunName($run->month, $run->year),
                    'month' => $run->month,
                    'year' => $run->year,
                    'period' => Carbon::create($run->year, $run->month)->format('F Y'),
                    'status' => $run->status,
                    'employee_count' => $run->total_staff_count,
                    'total_gross' => (float) $run->total_gross_pay,
                    'total_deductions' => (float) $run->total_deductions,
                    'total_net' => (float) $run->total_net_pay,
                    'client_id' => $run->client_id,
                    'client_name' => $run->client ? $run->client->client_name : null,
                    'created_by' => $run->createdBy ? $run->createdBy->first_name . ' ' . $run->createdBy->last_name : 'System',
                    'approved_by' => $run->approvedBy ? $run->approvedBy->first_name . ' ' . $run->approvedBy->last_name : null,
                    'created_at' => $run->created_at ? $run->created_at->format('Y-m-d H:i:s') : null,
                    'calculated_at' => $run->calculation_date ? $run->calculation_date->format('Y-m-d H:i:s') : null,
                    'approved_at' => $run->approved_at ? $run->approved_at->format('Y-m-d H:i:s') : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Payroll runs retrieved successfully',
                'data' => $transformedData,
                'pagination' => [
                    'current_page' => $runs->currentPage(),
                    'last_page' => $runs->lastPage(),
                    'per_page' => $runs->perPage(),
                    'total' => $runs->total(),
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payroll runs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/payroll/runs
     * Create new payroll run
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2020|max:2100',
                'run_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Check for duplicate
            $existing = PayrollRun::where('client_id', $data['client_id'])
                ->where('month', $data['month'])
                ->where('year', $data['year'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'A payroll run already exists for this client and period',
                    'error' => 'Duplicate payroll run for ' . Carbon::create($data['year'], $data['month'])->format('F Y')
                ], 409);
            }

            // Create payroll run
            $run = PayrollRun::create([
                'client_id' => $data['client_id'],
                'month' => $data['month'],
                'year' => $data['year'],
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payroll run created successfully',
                'data' => [
                    'id' => $run->id,
                    'run_name' => $this->generateRunName($run->month, $run->year),
                    'month' => $run->month,
                    'year' => $run->year,
                    'period' => Carbon::create($run->year, $run->month)->format('F Y'),
                    'status' => $run->status,
                    'client_id' => $run->client_id,
                ]
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payroll run',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/payroll/runs/{id}
     * Get payroll run details with employee breakdown
     */
    public function show($id): JsonResponse
    {
        try {
            \Log::info('PayrollRun show() called', ['id' => $id]);

            $run = PayrollRun::with([
                'client',
                'createdBy:id,name',
                'approvedBy:id,name',
                'payrollItems'
            ])->find($id);

            \Log::info('PayrollRun loaded', ['found' => !is_null($run)]);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            \Log::info('Starting employee mapping', ['items_count' => $run->payrollItems->count()]);

            // Transform employee data
            $employees = $run->payrollItems->map(function ($item) {
                return [
                    'id' => $item->id,
                    'staff_id' => $item->staff_id,
                    'staff_name' => $item->staff_name ?? 'N/A',
                    'staff_code' => $item->staff_code ?? 'N/A',
                    'employee_number' => $item->staff_code ?? 'N/A',
                    'bank_name' => $item->bank_name,
                    'account_number' => $item->account_number,
                    'days_present' => $item->days_present,
                    'days_absent' => $item->days_absent,
                    'days_worked' => $item->total_days,
                    'proration' => (float) $item->proration_factor,
                    'annual_gross_salary' => (float) $item->annual_gross_salary,
                    'monthly_gross' => (float) $item->monthly_gross,
                    'monthly_reimbursables' => (float) $item->monthly_reimbursables,
                    'taxable_income' => (float) $item->taxable_income,
                    'paye_tax' => (float) $item->paye_tax,
                    'pension_deduction' => (float) $item->pension_deduction,
                    'leave_allowance_deduction' => (float) $item->leave_allowance_deduction,
                    'thirteenth_month_deduction' => (float) $item->thirteenth_month_deduction,
                    'other_deductions' => (float) $item->other_deductions,
                    'total_deductions' => (float) $item->total_deductions,
                    'net_pay' => (float) $item->net_pay,
                    'credit_to_bank' => (float) $item->credit_to_bank,
                    'emoluments_breakdown' => $item->emoluments_snapshot ?? [], // Already cast to array in model
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $run->id,
                    'run_name' => $this->generateRunName($run->month, $run->year),
                    'month' => $run->month,
                    'year' => $run->year,
                    'period' => date('F Y', mktime(0, 0, 0, $run->month, 1, $run->year)),
                    'status' => $run->status,
                    'total_staff_count' => $run->total_staff_count,
                    'employee_count' => $run->total_staff_count,
                    'total_gross_pay' => (float) $run->total_gross_pay,
                    'total_gross' => (float) $run->total_gross_pay,
                    'total_deductions' => (float) $run->total_deductions,
                    'total_net_pay' => (float) $run->total_net_pay,
                    'total_net' => (float) $run->total_net_pay,
                    'client_id' => $run->client_id,
                    'client_name' => $run->client ? $run->client->organisation_name : null,
                    'created_by' => $run->createdBy ? $run->createdBy->name : 'System',
                    'approved_by' => $run->approvedBy ? $run->approvedBy->name : null,
                    'created_at' => $run->created_at ? $run->created_at->format('Y-m-d H:i:s') : null,
                    'calculated_at' => $run->calculation_date ? $run->calculation_date->format('Y-m-d H:i:s') : null,
                    'approved_at' => $run->approved_at ? $run->approved_at->format('Y-m-d H:i:s') : null,
                    'payroll_items' => $employees,
                ]
            ]);
        } catch (Exception $e) {
            \Log::error('PayrollRun show() exception', [
                'id' => $id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payroll run details',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * POST /api/payroll/runs/{id}/calculate
     * Calculate payroll for all employees
     */
    public function calculate($id): JsonResponse
    {
        try {
            $run = PayrollRun::find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status
            if ($run->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only calculate payroll runs in draft status',
                    'error' => 'Current status: ' . $run->status
                ], 409);
            }

            // Auto-link attendance if not already linked
            if (!$run->attendance_upload_id) {
                // Find the most recent validated attendance for this client and month
                $attendanceUpload = \App\Models\AttendanceUpload::where('client_id', $run->client_id)
                    ->where('is_for_payroll', true)
                    ->where('ready_for_processing', true)
                    ->whereYear('payroll_month', $run->year)
                    ->whereMonth('payroll_month', $run->month)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if (!$attendanceUpload) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No validated attendance found for this month',
                        'error' => 'Please upload and validate attendance for ' . date('F Y', mktime(0, 0, 0, $run->month, 1, $run->year))
                    ], 400);
                }

                // Auto-link the attendance
                $run->update(['attendance_upload_id' => $attendanceUpload->id]);
            } else {
                // Verify attendance upload is ready
                $attendanceUpload = \App\Models\AttendanceUpload::find($run->attendance_upload_id);
                if (!$attendanceUpload || !$attendanceUpload->ready_for_processing) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Linked attendance data not ready for processing',
                        'error' => 'Please complete attendance validation before calculating payroll'
                    ], 400);
                }
            }

            // Perform calculation using PayrollCalculationService
            \Log::info('CONTROLLER: About to call calculatePayrollRun', ['run_id' => $run->id]);
            $result = $this->calculationService->calculatePayrollRun($run->id);
            \Log::info('CONTROLLER: Returned from calculatePayrollRun', ['result_success' => $result['success'] ?? 'unknown']);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll calculation failed',
                    'error' => $result['message'] ?? 'Unknown error'
                ], 500);
            }

            // Reload run to get updated data
            $run->refresh();

            // Pass through detailed data from service
            $responseData = [
                'id' => $run->id,
                'status' => $run->status,
                'employee_count' => $run->total_staff_count,
                'total_gross' => (float) $run->total_gross_pay,
                'total_deductions' => (float) $run->total_deductions,
                'total_net' => (float) $run->total_net_pay,
                'calculated_at' => $run->calculation_date ? $run->calculation_date->format('Y-m-d H:i:s') : null,
            ];

            // Include detailed processing results if available
            if (isset($result['data'])) {
                $responseData['processed_count'] = $result['data']['processed_count'] ?? 0;
                $responseData['skipped_count'] = $result['data']['skipped_count'] ?? 0;
                $responseData['failed_count'] = $result['data']['failed_count'] ?? 0;
                $responseData['skipped_staff'] = $result['data']['skipped_staff'] ?? [];
                $responseData['failed_staff'] = $result['data']['failed_staff'] ?? [];
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'] ?? 'Payroll calculated successfully',
                'warnings' => $result['warnings'] ?? [],
                'data' => $responseData
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate payroll',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/payroll/runs/{id}/link-attendance
     * Link attendance upload to payroll run
     */
    public function linkAttendance($id, Request $request): JsonResponse
    {
        try {
            $run = PayrollRun::find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status - can only link attendance to draft runs
            if ($run->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only link attendance to draft payroll runs',
                    'error' => 'Current status: ' . $run->status
                ], 409);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'attendance_upload_id' => 'required|exists:attendance_uploads,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $attendanceUploadId = $request->input('attendance_upload_id');

            // Verify attendance upload belongs to same client
            $attendanceUpload = \App\Models\AttendanceUpload::find($attendanceUploadId);

            if ($attendanceUpload->client_id !== $run->client_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance upload does not belong to the same client'
                ], 400);
            }

            // Verify attendance upload is for payroll
            if (!$attendanceUpload->is_for_payroll) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected attendance is not marked for payroll'
                ], 400);
            }

            // Verify attendance is ready for processing
            if (!$attendanceUpload->ready_for_processing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance data not ready - please complete validation first'
                ], 400);
            }

            // Link attendance to payroll run
            $run->update([
                'attendance_upload_id' => $attendanceUploadId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Attendance linked to payroll run successfully',
                'data' => [
                    'id' => $run->id,
                    'attendance_upload_id' => $run->attendance_upload_id,
                    'attendance_month' => $attendanceUpload->payroll_month,
                    'staff_count' => $attendanceUpload->successfully_matched,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to link attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/payroll/runs/{id}/approve
     * Approve calculated payroll
     */
    public function approve($id): JsonResponse
    {
        try {
            $run = PayrollRun::find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status
            if ($run->status !== 'calculated') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only approve payroll runs in calculated status',
                    'error' => 'Current status: ' . $run->status
                ], 409);
            }

            // Update to approved
            $run->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payroll run approved successfully',
                'data' => [
                    'id' => $run->id,
                    'status' => $run->status,
                    'approved_at' => $run->approved_at->format('Y-m-d H:i:s'),
                    'approved_by' => $run->approvedBy ? $run->approvedBy->first_name . ' ' . $run->approvedBy->last_name : 'System',
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve payroll run',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/payroll/runs/{id}/export
     * Export payroll to Excel file
     */
    public function export($id)
    {
        try {
            $run = PayrollRun::with(['client', 'payrollItems'])->find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status (can export calculated or approved runs)
            if (!in_array($run->status, ['calculated', 'approved', 'exported'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only export calculated or approved payroll runs',
                    'error' => 'Current status: ' . $run->status
                ], 409);
            }

            // Generate filename
            $clientName = str_replace(' ', '_', $run->client->organisation_name ?? 'Unknown');
            $period = Carbon::create($run->year, $run->month)->format('Y_m');
            $filename = "Payroll_{$clientName}_{$period}.xlsx";

            // Update run status
            if ($run->status !== 'exported') {
                $run->update([
                    'status' => 'exported',
                    'exported_at' => now(),
                ]);
            }

            // Return Excel download using Laravel Excel
            return Excel::download(new PayrollRunExport($run), $filename);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export payroll',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/payroll/runs/{id}/cancel
     * Cancel payroll run
     */
    public function cancel($id): JsonResponse
    {
        try {
            $run = PayrollRun::find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status (can cancel draft or calculated runs)
            if (!in_array($run->status, ['draft', 'calculated'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only cancel payroll runs in draft or calculated status',
                    'error' => 'Current status: ' . $run->status . ' (Cannot cancel approved, exported, or paid runs)'
                ], 409);
            }

            // Update to cancelled
            $run->update([
                'status' => 'cancelled',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payroll run cancelled successfully',
                'data' => [
                    'id' => $run->id,
                    'status' => $run->status,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel payroll run',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/payroll/runs/{id}
     * Delete payroll run
     */
    public function destroy($id): JsonResponse
    {
        try {
            $run = PayrollRun::find($id);

            if (!$run) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payroll run not found'
                ], 404);
            }

            // Validate status (can only delete draft or cancelled runs)
            if (!in_array($run->status, ['draft', 'cancelled'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only delete payroll runs in draft or cancelled status',
                    'error' => 'Current status: ' . $run->status . ' (Cannot delete calculated, approved, or exported runs)'
                ], 403);
            }

            // Delete associated payroll items first
            $run->payrollItems()->delete();

            // Delete the run
            $run->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payroll run deleted successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete payroll run',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Generate run name from month/year
     */
    private function generateRunName(int $month, int $year): string
    {
        return Carbon::create($year, $month)->format('F Y') . ' Payroll';
    }

    /**
     * GET /api/payroll/attendance-template/{clientId}
     * Download attendance template with all active staff pre-filled
     * User only needs to fill in Days Present column
     */
    public function downloadAttendanceTemplate(int $clientId)
    {
        try {
            $client = \App\Models\Client::findOrFail($clientId);

            // Get all active staff for this client
            $staff = \App\Models\Staff::where('client_id', $clientId)
                ->where('status', 'active')
                ->orderBy('employee_code')
                ->get();

            if ($staff->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => "No active staff found for client: {$client->organisation_name}"
                ], 404);
            }

            // Create CSV content
            $csvData = "Employee ID,Employee Name,Days Present\n";

            foreach ($staff as $employee) {
                $csvData .= "{$employee->employee_code},{$employee->full_name},\n";
            }

            // Generate filename
            $filename = 'payroll_attendance_template_' . $client->organisation_name . '_' . date('Y-m-d') . '.csv';
            $filename = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $filename); // Sanitize filename

            // Return as downloadable CSV
            return response($csvData, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate attendance template',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
