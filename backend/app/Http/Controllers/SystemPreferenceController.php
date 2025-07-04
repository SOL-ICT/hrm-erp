<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SystemPreferenceController extends Controller
{
    /**
     * Get all system preferences
     */
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'system_name' => 'SOL Nigeria HRM System',
                'company_logo' => '/assets/images/sol-logo.png',
                'primary_color' => '#0066CC',
                'secondary_color' => '#DC3545',
                'theme' => 'dark'
            ],
            'message' => 'System Preferences - Basic settings available'
        ]);
    }

    /**
     * Store new preference
     */
    public function store(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'System Preference creation - Coming Soon'
        ], 501);
    }

    /**
     * Show specific preference
     */
    public function show($key)
    {
        return response()->json([
            'success' => false,
            'message' => 'System Preference details - Coming Soon'
        ], 501);
    }

    /**
     * Update preference
     */
    public function update(Request $request, $key)
    {
        return response()->json([
            'success' => false,
            'message' => 'System Preference update - Coming Soon'
        ], 501);
    }

    /**
     * Delete preference
     */
    public function destroy($key)
    {
        return response()->json([
            'success' => false,
            'message' => 'System Preference deletion - Coming Soon'
        ], 501);
    }

    /**
     * Get preferences by category
     */
    public function getByCategory($category)
    {
        return response()->json([
            'success' => true,
            'data' => [],
            'message' => 'Preferences by category - Coming Soon'
        ]);
    }

    /**
     * Bulk update preferences
     */
    public function bulkUpdate(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Bulk preference update - Coming Soon'
        ], 501);
    }
}
