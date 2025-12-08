<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NameChangeRequestController extends Controller
{
    // 1. List requests (for logged-in staff)
    public function index(Request $request)
    {
        $requests = DB::table('name_change_requests')
            ->where('staff_id', auth()->id())
            ->orderBy('submitted_at', 'desc')
            ->get();
        return response()->json($requests);
    }

    // 2. Store new request
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name' => 'required|string|max:100',
            'reason' => 'required|string',
            'proof_document' => 'required|file|mimes:pdf,jpg,png|max:2048',
        ]);

        $path = $request->file('proof_document')->store('name_changes', 'public');

        $id = DB::table('name_change_requests')->insertGetId([
            'staff_id' => auth()->id(),
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'reason' => $validated['reason'],
            'proof_document' => $path,
            'status' => 'Pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(
            DB::table('name_change_requests')->find($id),
            201
        );
    }

    // 3. Show request details
    public function show($id)
    {
        $request = DB::table('name_change_requests')->find($id);

        if (!$request) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        return response()->json($request);
    }

    // 4. Admin update (approve/reject)
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,Rejected',
            'rejection_reason' => 'nullable|string',
        ]);

        $updated = DB::table('name_change_requests')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'rejection_reason' => $validated['status'] === 'Rejected' ? $validated['rejection_reason'] : null,
                'updated_at' => now()
            ]);

        if (!$updated) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        // Create approval record
        DB::table('name_change_approvals')->insert([
            'request_id' => $id,
            'approved_by' => auth()->id(),
            'status' => $validated['status'],
            'comments' => $validated['rejection_reason'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(
            DB::table('name_change_requests')->find($id)
        );
    }
}
