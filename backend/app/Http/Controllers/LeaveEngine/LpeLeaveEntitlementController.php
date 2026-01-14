<?php

namespace App\Http\Controllers\LeaveEngine;

use App\Http\Controllers\Controller;
use App\Models\LpeLeaveEntitlement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LpeLeaveEntitlementController extends Controller
{
    /**
     * Display a listing of leave entitlements.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LpeLeaveEntitlement::with(['client', 'jobStructure', 'leaveType']);

        // Filter by client (critical for dashboard)
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Filter by job structure
        if ($request->has('job_structure_id')) {
            $query->where('job_structure_id', $request->job_structure_id);
        }

        // Filter by leave type
        if ($request->has('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        // Filter active entitlements (effective dates)
        if ($request->boolean('active_only')) {
            $today = now()->toDateString();
            $query->where('effective_from', '<=', $today)
                ->where(function ($q) use ($today) {
                    $q->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', $today);
                });
        }

        $entitlements = $query->orderBy('client_id')
            ->orderBy('job_structure_id')
            ->orderBy('leave_type_id')
            ->paginate($request->get('per_page', 50));

        return response()->json($entitlements);
    }

    /**
     * Store a newly created entitlement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'job_structure_id' => 'required|exists:job_structures,id',
            'leave_type_id' => 'required|exists:lpe_leave_types,id',
            'entitled_days' => 'required|numeric|min:0|max:999.99',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'max_carryover_days' => 'nullable|numeric|min:0|max:999.99',
            'renewal_frequency' => 'nullable|in:ANNUAL,BIANNUAL,NONE',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'notes' => 'nullable|string',
        ]);

        // Check for overlapping entitlements
        $overlapping = LpeLeaveEntitlement::where('client_id', $validated['client_id'])
            ->where('job_structure_id', $validated['job_structure_id'])
            ->where('leave_type_id', $validated['leave_type_id'])
            ->where(function ($query) use ($validated) {
                $query->where(function ($q) use ($validated) {
                    // New range starts before existing ends
                    $q->where('effective_from', '<=', $validated['effective_from'])
                        ->where(function ($sq) use ($validated) {
                            $sq->whereNull('effective_to')
                                ->orWhere('effective_to', '>=', $validated['effective_from']);
                        });
                })->orWhere(function ($q) use ($validated) {
                    // New range ends after existing starts
                    if (isset($validated['effective_to'])) {
                        $q->where('effective_from', '<=', $validated['effective_to'])
                            ->where(function ($sq) use ($validated) {
                                $sq->whereNull('effective_to')
                                    ->orWhere('effective_to', '>=', $validated['effective_to']);
                            });
                    }
                });
            })
            ->exists();

        if ($overlapping) {
            return response()->json([
                'message' => 'An overlapping entitlement already exists for this combination',
            ], 422);
        }

        $entitlement = LpeLeaveEntitlement::create($validated);

        return response()->json([
            'message' => 'Leave entitlement created successfully',
            'data' => $entitlement->load(['client', 'jobStructure', 'leaveType']),
        ], 201);
    }

    /**
     * Display the specified entitlement.
     */
    public function show(string $id): JsonResponse
    {
        $entitlement = LpeLeaveEntitlement::with(['client', 'jobStructure', 'leaveType'])
            ->findOrFail($id);

        return response()->json([
            'data' => $entitlement,
        ]);
    }

    /**
     * Update the specified entitlement.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $entitlement = LpeLeaveEntitlement::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'job_structure_id' => 'sometimes|exists:job_structures,id',
            'leave_type_id' => 'sometimes|exists:lpe_leave_types,id',
            'entitled_days' => 'sometimes|numeric|min:0|max:999.99',
            'max_consecutive_days' => 'nullable|integer|min:1',
            'max_carryover_days' => 'nullable|numeric|min:0|max:999.99',
            'renewal_frequency' => 'nullable|in:ANNUAL,BIANNUAL,NONE',
            'effective_from' => 'sometimes|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'notes' => 'nullable|string',
        ]);

        $entitlement->update($validated);

        return response()->json([
            'message' => 'Leave entitlement updated successfully',
            'data' => $entitlement->load(['client', 'jobStructure', 'leaveType']),
        ]);
    }

    /**
     * Remove the specified entitlement.
     */
    public function destroy(string $id): JsonResponse
    {
        $entitlement = LpeLeaveEntitlement::findOrFail($id);
        $entitlement->delete();

        return response()->json([
            'message' => 'Leave entitlement deleted successfully',
        ]);
    }
}