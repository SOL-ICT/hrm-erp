<?php

namespace App\Http\Controllers\LeaveEngine;

use App\Http\Controllers\Controller;
use App\Models\JobStructure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LpeJobStructureController extends Controller
{
    /**
     * Display job structures for entitlements selection.
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobStructure::where('is_active', true);

        // Filter by client
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $jobStructures = $query->orderBy('client_id')
            ->orderBy('job_code')
            ->paginate($request->get('per_page', 100));

        return response()->json($jobStructures);
    }
}
