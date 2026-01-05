<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class QueryController extends Controller
{
    public function index(Request $request)
    {
        $query = StaffQuery::with(['staff', 'client']);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $queries = $query->orderBy('query_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($queries);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:staff,id',
            'client_id' => 'required|exists:clients,id',
            'query_date' => 'required|date',
            'query_details' => 'required|string',
            'response' => 'nullable|string',
            'response_date' => 'nullable|date',
            'status' => ['nullable', Rule::in(['pending', 'responded', 'resolved', 'escalated'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $staffQuery = StaffQuery::create([
            'staff_id' => $request->staff_id,
            'client_id' => $request->client_id,
            'query_date' => $request->query_date,
            'query_details' => $request->query_details,
            'response' => $request->response,
            'response_date' => $request->response_date,
            'status' => $request->status ?? 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff query created successfully',
            'data' => $staffQuery->load(['staff', 'client'])
        ], 201);
    }

    public function show(string $id)
    {
        $query = StaffQuery::with(['staff', 'client'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $query
        ]);
    }

    public function update(Request $request, string $id)
    {
        $query = StaffQuery::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'response' => 'nullable|string',
            'response_date' => 'nullable|date',
            'status' => ['nullable', Rule::in(['pending', 'responded', 'resolved', 'escalated'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $query->update($request->only(['response', 'response_date', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Query updated successfully',
            'data' => $query->load(['staff', 'client'])
        ]);
    }

    public function destroy(string $id)
    {
        $query = StaffQuery::findOrFail($id);
        $query->delete();

        return response()->json([
            'success' => true,
            'message' => 'Query deleted successfully'
        ]);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query_ids' => 'required|array',
            'query_ids.*' => 'exists:staff_queries,id',
            'status' => ['required', Rule::in(['pending', 'responded', 'resolved', 'escalated'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updated = StaffQuery::whereIn('id', $request->query_ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => "Successfully updated {$updated} query status",
            'updated_count' => $updated
        ]);
    }
}
