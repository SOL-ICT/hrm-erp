<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UtilityController extends Controller
{
    public function getIndustryCategories()
    {
        try {
            $categories = DB::table('job_categories')
                ->where('is_active', 1)
                ->orderBy('name')
                ->pluck('name');

            return response()->json([
                'success' => true,
                'data' => $categories->toArray()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getClientCategories()
    {
        try {
            // Standard business entity types for client categories
            $categories = [
                'Corporate',
                'SME',
                'Government',
                'NGO',
                'International',
                'Startup',
                'Enterprise',
                'Public Sector',
                'Private Sector',
                'Multinational'
            ];

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
