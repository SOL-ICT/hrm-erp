<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class OptimizedAdminController extends Controller
{
    /**
     * Get cached dashboard statistics with Redis
     */
    public function getDashboardStats()
    {
        return Cache::remember('admin.dashboard.stats', 300, function () { // 5 minutes cache
            return [
                // Optimized queries with specific selects
                'total_clients' => DB::table('clients')->count(),
                'active_clients' => DB::table('clients')->where('status', 'active')->count(),
                'total_staff' => DB::table('staff')->count(),
                'active_staff' => DB::table('staff')->where('status', 'active')->count(),

                // Combined queries to reduce database hits
                'job_stats' => DB::table('job_opportunities')
                    ->selectRaw('
                        COUNT(*) as total_jobs,
                        SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active_jobs,
                        SUM(CASE WHEN application_deadline <= DATE_ADD(NOW(), INTERVAL 7 DAY) AND status = "active" THEN 1 ELSE 0 END) as closing_soon
                    ')
                    ->first(),

                'application_stats' => DB::table('job_applications')
                    ->selectRaw('
                        COUNT(*) as total_applications,
                        SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN DATE(applied_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                        SUM(CASE WHEN status = "hired" AND YEAR(updated_at) = YEAR(NOW()) AND MONTH(updated_at) = MONTH(NOW()) THEN 1 ELSE 0 END) as hired_this_month
                    ')
                    ->first(),
            ];
        });
    }

    /**
     * Get paginated data with optimized queries
     */
    public function getOptimizedClients(Request $request)
    {
        $perPage = min($request->get('per_page', 15), 50); // Limit max per page

        return DB::table('clients')
            ->select([
                'id',
                'name',
                'code',
                'status',
                'created_at',
                DB::raw('(SELECT COUNT(*) FROM staff WHERE staff.client_id = clients.id AND staff.status = "active") as staff_count'),
                DB::raw('(SELECT COUNT(*) FROM service_locations WHERE service_locations.client_id = clients.id) as locations_count')
            ])
            ->when($request->search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('code', 'LIKE', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('name')
            ->paginate($perPage);
    }
}
