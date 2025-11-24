<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffSuspension;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SuspensionController extends Controller
{
    public function index(Request $request)
    {
        $query = StaffSuspension::with(['staff', 'client', 'issuedBy']);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $suspensions = $query->orderBy('suspension_start_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($suspensions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'suspension_start_date' => 'required|date',
            'suspension_end_date' => 'required|date|after:suspension_start_date',
            'suspension_days' => 'required|integer|min:1',
            'reason' => 'required|string',
            'status' => ['nullable', Rule::in(['pending', 'active', 'lifted', 'completed'])],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $suspension = StaffSuspension::create([
            'staff_id' => $request->staff_id,
            'client_id' => $request->client_id,
            'suspension_start_date' => $request->suspension_start_date,
            'suspension_end_date' => $request->suspension_end_date,
            'suspension_days' => $request->suspension_days,
            'reason' => $request->reason,
            'issued_by' => auth()->id(),
            'status' => $request->status ?? 'pending',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff suspension recorded successfully',
            'data' => $suspension->load(['staff', 'client', 'issuedBy'])
        ], 201);
    }

    public function show(string $id)
    {
        $suspension = StaffSuspension::with(['staff', 'client', 'issuedBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $suspension
        ]);
    }

    public function update(Request $request, string $id)
    {
        $suspension = StaffSuspension::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'suspension_end_date' => 'nullable|date',
            'suspension_days' => 'nullable|integer|min:1',
            'status' => ['nullable', Rule::in(['pending', 'active', 'lifted', 'completed'])],
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $suspension->update($request->only([
            'suspension_end_date',
            'suspension_days',
            'status',
            'notes'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Suspension record updated successfully',
            'data' => $suspension->load(['staff', 'client', 'issuedBy'])
        ]);
    }

    public function destroy(string $id)
    {
        try {
            $suspension = StaffSuspension::findOrFail($id);
            $suspension->delete();

            return response()->json([
                'success' => true,
                'message' => 'Suspension record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete suspension record',
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
