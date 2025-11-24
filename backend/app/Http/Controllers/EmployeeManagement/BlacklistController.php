<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\StaffBlacklist;
use Illuminate\Http\Request;

class BlacklistController extends Controller
{
    /**
     * Display a listing of blacklisted staff.
     */
    public function index(Request $request)
    {
        $query = StaffBlacklist::with(['staff', 'client', 'termination']);

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('from_date')) {
            $query->where('blacklist_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->where('blacklist_date', '<=', $request->to_date);
        }

        // Search by staff name in snapshot
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw("JSON_EXTRACT(staff_details_snapshot, '$.first_name') LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("JSON_EXTRACT(staff_details_snapshot, '$.last_name') LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("JSON_EXTRACT(staff_details_snapshot, '$.staff_id') LIKE ?", ["%{$search}%"]);
            });
        }

        $blacklist = $query->orderBy('blacklist_date', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($blacklist);
    }

    /**
     * Display the specified blacklist record.
     */
    public function show(string $id)
    {
        $blacklist = StaffBlacklist::with(['staff', 'client', 'termination'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $blacklist
        ]);
    }

    /**
     * Check if a staff is blacklisted by staff_id or name.
     */
    public function check(Request $request)
    {
        $query = StaffBlacklist::query();

        if ($request->filled('staff_id_value')) {
            $query->whereRaw("JSON_EXTRACT(staff_details_snapshot, '$.staff_id') = ?", [$request->staff_id_value]);
        }

        if ($request->filled('first_name') && $request->filled('last_name')) {
            $query->whereRaw("JSON_EXTRACT(staff_details_snapshot, '$.first_name') = ?", [$request->first_name])
                ->whereRaw("JSON_EXTRACT(staff_details_snapshot, '$.last_name') = ?", [$request->last_name]);
        }

        $blacklisted = $query->exists();

        return response()->json([
            'success' => true,
            'is_blacklisted' => $blacklisted,
            'data' => $blacklisted ? $query->first() : null
        ]);
    }

    /**
     * Note: Blacklist records are typically created automatically via TerminationController
     * when is_blacklisted=true. Manual creation is usually not needed.
     */
    public function store(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Blacklist records are created automatically during staff termination. Use TerminationController with is_blacklisted=true instead.'
        ], 400);
    }

    /**
     * Blacklist records should generally not be deleted (audit trail).
     * Consider soft deletes or status flags if needed.
     */
    public function destroy(string $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Blacklist records cannot be deleted for audit purposes. Contact system administrator if removal is absolutely necessary.'
        ], 403);
    }
}
