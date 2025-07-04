<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    /**
     * Get all service requests
     */
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 15,
                'total' => 0
            ],
            'message' => 'Service Request Master - Coming Soon'
        ]);
    }

    /**
     * Store new service request type
     */
    public function store(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Service Request creation - Coming Soon'
        ], 501);
    }

    /**
     * Show specific service request
     */
    public function show($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Service Request details - Coming Soon'
        ], 501);
    }

    /**
     * Update service request
     */
    public function update(Request $request, $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Service Request update - Coming Soon'
        ], 501);
    }

    /**
     * Delete service request
     */
    public function destroy($id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Service Request deletion - Coming Soon'
        ], 501);
    }

    /**
     * Get requests by category
     */
    public function getByCategory($category)
    {
        return response()->json([
            'success' => true,
            'data' => [],
            'message' => 'Service requests by category - Coming Soon'
        ]);
    }
}
