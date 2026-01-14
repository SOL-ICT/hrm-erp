<?php

namespace App\Http\Controllers\LeaveEngine;

use App\Http\Controllers\Controller;
use App\Models\LpeStaffLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LpeStaffLevelController extends Controller
{
    /**
     * Display a listing of staff levels.
     */
    public function index(Request $request): JsonResponse
    {
        $query = LpeStaffLevel::with('client');

        // Filter by client if provided
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Filter by active status if provided
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $levels = $query->orderBy('level_order')
            ->orderBy('name')
            ->paginate($request->get('per_page', 20));

        return response()->json($levels);
    }

    /**
     * Store a newly created staff level.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('lpe_staff_levels')->where(function ($query) use ($request) {
                    return $query->where('client_id', $request->client_id);
                }),
            ],
            'description' => 'nullable|string',
            'level_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $level = LpeStaffLevel::create($validated);

        return response()->json([
            'message' => 'Staff level created successfully',
            'data' => $level->load('client'),
        ], 201);
    }

    /**
     * Display the specified staff level.
     */
    public function show(string $id): JsonResponse
    {
        $level = LpeStaffLevel::with(['client', 'entitlements.leaveType'])
            ->findOrFail($id);

        return response()->json([
            'data' => $level,
        ]);
    }

    /**
     * Update the specified staff level.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $level = LpeStaffLevel::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'sometimes|exists:clients,id',
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('lpe_staff_levels')->where(function ($query) use ($request, $level) {
                    return $query->where('client_id', $request->get('client_id', $level->client_id));
                })->ignore($level->id),
            ],
            'description' => 'nullable|string',
            'level_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $level->update($validated);

        return response()->json([
            'message' => 'Staff level updated successfully',
            'data' => $level->load('client'),
        ]);
    }

    /**
     * Remove the specified staff level.
     */
    public function destroy(string $id): JsonResponse
    {
        $level = LpeStaffLevel::findOrFail($id);
        
        // Check if level has entitlements
        if ($level->entitlements()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete staff level with existing entitlements',
            ], 422);
        }

        $level->delete();

        return response()->json([
            'message' => 'Staff level deleted successfully',
        ]);
    }
}