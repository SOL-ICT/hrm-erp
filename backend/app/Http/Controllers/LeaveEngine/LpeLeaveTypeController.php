<?php

namespace App\Http\Controllers\LeaveEngine;

use App\Http\Controllers\Controller;
use App\Models\LpeLeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LpeLeaveTypeController extends Controller
{
    /**
     * Display a listing of leave types.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LpeLeaveType::query();

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name if provided
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $types = $query->orderBy('name')
            ->paginate($request->get('per_page', 20));

        return response()->json($types);
    }

    /**
     * Store a newly created leave type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:lpe_leave_types,name',
            'code' => 'nullable|string|max:50|unique:lpe_leave_types,code',
            'description' => 'nullable|string',
            'requires_documentation' => 'nullable|boolean',
            'is_gender_specific' => 'nullable|in:NONE,MALE_ONLY,FEMALE_ONLY',
            'is_proratable' => 'nullable|boolean',
            'accrual_frequency' => 'nullable|in:MONTHLY,QUARTERLY,ANNUALLY,ONE_TIME',
            'is_active' => 'nullable|boolean',
        ]);

        $type = LpeLeaveType::create($validated);

        return response()->json([
            'message' => 'Leave type created successfully',
            'data' => $type,
        ], 201);
    }

    /**
     * Display the specified leave type.
     */
    public function show(string $id): JsonResponse
    {
        $type = LpeLeaveType::with(['entitlements' => function ($query) {
            $query->with(['client', 'staffLevel'])->limit(10);
        }])->findOrFail($id);

        return response()->json([
            'data' => $type,
        ]);
    }

    /**
     * Update the specified leave type.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $type = LpeLeaveType::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('lpe_leave_types')->ignore($type->id),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('lpe_leave_types')->ignore($type->id),
            ],
            'description' => 'nullable|string',
            'requires_documentation' => 'nullable|boolean',
            'is_gender_specific' => 'nullable|in:NONE,MALE_ONLY,FEMALE_ONLY',
            'is_proratable' => 'nullable|boolean',
            'accrual_frequency' => 'nullable|in:MONTHLY,QUARTERLY,ANNUALLY,ONE_TIME',
            'is_active' => 'nullable|boolean',
        ]);

        $type->update($validated);

        return response()->json([
            'message' => 'Leave type updated successfully',
            'data' => $type,
        ]);
    }

    /**
     * Remove the specified leave type.
     */
    public function destroy(string $id): JsonResponse
    {
        $type = LpeLeaveType::findOrFail($id);

        // Check if type has entitlements
        if ($type->entitlements()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete leave type with existing entitlements',
            ], 422);
        }

        $type->delete();

        return response()->json([
            'message' => 'Leave type deleted successfully',
        ]);
    }
}