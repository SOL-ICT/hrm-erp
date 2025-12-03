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
            // Nigerian business entity types for client categories
            $categories = [
                'Business Name (Sole Proprietorship)',
                'Business Name (Partnership)',
                'Private Limited Company (Ltd)',
                'Public Limited Company (PLC)',
                'Company Limited by Guarantee (Ltd/Gte)',
                'Unlimited Company',
                'Limited Liability Partnership (LLP)',
                'Limited Partnership (LP)',
                'Incorporated Trustees (NGO / Association / Religious Body)',
                'Foreign Company (Branch / Subsidiary)',
                'Cooperative Society'
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
