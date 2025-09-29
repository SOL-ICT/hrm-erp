<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EmolumentComponent;
// Add other models as needed

class DashboardCacheController extends Controller
{
    /**
     * Clear all dashboard caches
     */
    public function clearAllCaches()
    {
        try {
            $clearedCaches = [];
            
            // List of cache keys to clear
            $cacheKeys = [
                'emolument_component_statistics',
                'dashboard_overview_stats',
                'client_statistics',
                'recruitment_statistics',
                'user_statistics',
                // Add more cache keys as you implement them
            ];
            
            foreach ($cacheKeys as $key) {
                if (Cache::forget($key)) {
                    $clearedCaches[] = $key;
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Caches cleared successfully',
                'cleared_caches' => $clearedCaches
            ]);
        } catch (\Exception $e) {
            Log::error('Error clearing caches: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error clearing caches',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get dashboard overview statistics with caching
     */
    public function getDashboardStats()
    {
        try {
            $stats = Cache::remember('dashboard_overview_stats', 300, function () {
                return [
                    'emolument_components' => EmolumentComponent::count(),
                    'active_components' => EmolumentComponent::where('is_active', 1)->count(),
                    // Add more dashboard statistics here
                    'cache_updated_at' => now()->toISOString()
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Dashboard statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Warm up critical caches
     */
    public function warmupCaches()
    {
        try {
            $warmedCaches = [];
            
            // Warm up emolument component statistics
            $emolumentStats = Cache::remember('emolument_component_statistics', 300, function () {
                return [
                    'total' => EmolumentComponent::count(),
                    'active' => EmolumentComponent::where('is_active', 1)->count(),
                    'benefit_status' => EmolumentComponent::where('status', 'benefit')->count(),
                    'regular_status' => EmolumentComponent::where('status', 'regular')->count(),
                    'cash_items' => EmolumentComponent::where('class', 'cash_item')->count(),
                    'non_cash_items' => EmolumentComponent::where('class', 'non_cash_item')->count(),
                ];
            });
            
            if ($emolumentStats) {
                $warmedCaches[] = 'emolument_component_statistics';
            }
            
            // Warm up dashboard overview
            $dashboardStats = Cache::remember('dashboard_overview_stats', 300, function () {
                return [
                    'emolument_components' => EmolumentComponent::count(),
                    'active_components' => EmolumentComponent::where('is_active', 1)->count(),
                    'cache_updated_at' => now()->toISOString()
                ];
            });
            
            if ($dashboardStats) {
                $warmedCaches[] = 'dashboard_overview_stats';
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Caches warmed up successfully',
                'warmed_caches' => $warmedCaches
            ]);
        } catch (\Exception $e) {
            Log::error('Error warming up caches: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error warming up caches',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
