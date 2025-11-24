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
            'status' => ['nullable', Rule::in(['pending', 'acknowledged', 'resolved'])],
            'resolution_date' => 'nullable|date',
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
            'status' => $request->status ?? 'pending',
            'resolution_date' => $request->resolution_date,
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
            'status' => ['nullable', Rule::in(['pending', 'acknowledged', 'resolved'])],
            'resolution_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $warning->update($request->only(['status', 'resolution_date', 'notes']));

        return response()->json([
            'success' => true,
            'message' => 'Warning record updated successfully',
            'data' => $warning->load(['staff', 'client', 'issuedBy'])
        ]);
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
