<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffWarning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class WarningController extends Controller
{
    public function index(Request $request)
    {
        $query = StaffWarning::with(['staff', 'client', 'issuedBy']);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('warning_level')) {
            $query->where('warning_level', $request->warning_level);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $warnings = $query->orderBy('issued_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($warnings);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'warning_level' => ['required', Rule::in(['first', 'second', 'final'])],
            'issued_date' => 'required|date',
            'reason' => 'required|string',
            'status' => ['nullable', Rule::in(['active', 'resolved', 'escalated'])],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $warning = StaffWarning::create([
            'staff_id' => $request->staff_id,
            'client_id' => $request->client_id,
            'warning_level' => $request->warning_level,
            'issued_date' => $request->issued_date,
            'reason' => $request->reason,
            'issued_by' => auth()->id(),
            'status' => $request->status ?? 'active',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff warning recorded successfully',
            'data' => $warning->load(['staff', 'client', 'issuedBy'])
        ], 201);
    }

    public function show(string $id)
    {
        $warning = StaffWarning::with(['staff', 'client', 'issuedBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $warning
        ]);
    }

    public function update(Request $request, string $id)
    {
        $warning = StaffWarning::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => ['nullable', Rule::in(['active', 'resolved', 'escalated'])],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // If escalating to termination, create termination record
        if ($request->status === 'escalated' && $warning->status !== 'escalated') {
            $this->createTerminationFromWarning($warning);
        }

        $warning->update($request->only(['status', 'notes']));

        return response()->json([
            'success' => true,
            'message' => $request->status === 'escalated' 
                ? 'Warning escalated and termination record created successfully'
                : 'Warning record updated successfully',
            'data' => $warning->load(['staff', 'client', 'issuedBy'])
        ]);
    }

    protected function createTerminationFromWarning($warning)
    {
        $staff = \App\Models\Staff::with(['client'])->findOrFail($warning->staff_id);
        
        // Create termination record
        $termination = \App\Models\StaffTermination::create([
            'staff_id' => $warning->staff_id,
            'client_id' => $warning->client_id,
            'termination_type' => 'terminated',
            'termination_date' => now()->toDateString(),
            'transaction_date' => now()->toDateString(),
            'actual_relieving_date' => now()->toDateString(),
            'reason' => "Escalated from {$warning->warning_level} warning: " . $warning->reason,
            'exit_penalty' => 'no',
            'ppe_return' => 'n/a',
            'exit_interview' => 'n/a',
            'is_blacklisted' => 1,
            'processed_by' => auth()->id(),
        ]);

        // Create blacklist record
        \App\Models\StaffBlacklist::create([
            'staff_id' => $warning->staff_id,
            'client_id' => $warning->client_id,
            'termination_id' => $termination->id,
            'blacklist_date' => now()->toDateString(),
            'reason' => "Escalated from {$warning->warning_level} warning: " . $warning->reason,
            'staff_details_snapshot' => json_encode([
                'staff_id' => $staff->staff_id,
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'email' => $staff->email,
                'phone' => $staff->phone,
                'client_name' => $staff->client->organisation_name ?? null,
            ]),
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warning_ids' => 'required|array',
            'warning_ids.*' => 'exists:staff_warnings,id',
            'status' => ['required', Rule::in(['active', 'resolved', 'escalated'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // If escalating, create termination records for each warning
            if ($request->status === 'escalated') {
                $warnings = \App\Models\StaffWarning::whereIn('id', $request->warning_ids)
                    ->where('status', '!=', 'escalated')
                    ->get();

                foreach ($warnings as $warning) {
                    $this->createTerminationFromWarning($warning);
                }
            }

            $updated = \App\Models\StaffWarning::whereIn('id', $request->warning_ids)
                ->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => $request->status === 'escalated'
                    ? "{$updated} warning(s) escalated and termination records created"
                    : "{$updated} warning(s) updated successfully",
                'updated_count' => $updated
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update warnings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $warning = StaffWarning::findOrFail($id);
            $warning->delete();

            return response()->json([
                'success' => true,
                'message' => 'Warning record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete warning record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function downloadTemplate()
    {
        return response()->json([
            'success' => false,
            'message' => 'Template download not yet implemented'
        ], 501);
    }

    public function bulkUpload(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Bulk upload not yet implemented'
        ], 501);
    }
}
