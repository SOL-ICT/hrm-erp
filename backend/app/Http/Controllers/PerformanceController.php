<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PerformanceController extends Controller
{
    /**
     * Run comprehensive performance diagnostics
     */
    public function diagnostics(Request $request)
    {
        $results = [];
        $totalStartTime = microtime(true);

        try {
            // Test 1: Database Connection
            $dbStart = microtime(true);
            try {
                DB::connection()->getPdo();
                $results['database_connection'] = [
                    'status' => 'success',
                    'time_ms' => round((microtime(true) - $dbStart) * 1000, 2),
                    'message' => 'Database connected successfully'
                ];
            } catch (\Exception $e) {
                $results['database_connection'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $dbStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Test 2: Simple Query
            $simpleStart = microtime(true);
            try {
                $userCount = DB::table('users')->count();
                $results['simple_query'] = [
                    'status' => 'success',
                    'time_ms' => round((microtime(true) - $simpleStart) * 1000, 2),
                    'data' => ['user_count' => $userCount],
                    'message' => "Found {$userCount} users"
                ];
            } catch (\Exception $e) {
                $results['simple_query'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $simpleStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Test 3: States/LGAs Loading (Geographic Data)
            $statesStart = microtime(true);
            try {
                $statesCount = DB::table('states_lgas')->distinct('state_name')->count();
                $lgasCount = DB::table('states_lgas')->count();
                $zonesCount = DB::table('states_lgas')->distinct('zone')->count();
                
                $sampleData = DB::table('states_lgas')
                    ->select('id', 'state_name', 'state_code', 'zone', 'lga_name', 'lga_code', 'is_capital')
                    ->where('is_active', 1)
                    ->orderBy('state_name')
                    ->orderBy('lga_name')
                    ->limit(10)
                    ->get();

                $results['states_lgas_load'] = [
                    'status' => 'success',
                    'time_ms' => round((microtime(true) - $statesStart) * 1000, 2),
                    'data' => [
                        'states_count' => $statesCount,
                        'lgas_count' => $lgasCount,
                        'zones_count' => $zonesCount,
                        'sample_records' => $sampleData->count(),
                        'sample_data' => $sampleData->take(3) // Just first 3 for example
                    ],
                    'message' => "Found {$statesCount} states, {$lgasCount} LGAs, {$zonesCount} zones"
                ];
            } catch (\Exception $e) {
                $results['states_lgas_load'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $statesStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Test 4: Complex Recruitment Query
            $complexStart = microtime(true);
            try {
                $requests = DB::table('recruitment_requests')
                    ->join('clients', 'recruitment_requests.client_id', '=', 'clients.id')
                    ->join('job_structures', 'recruitment_requests.job_structure_id', '=', 'job_structures.id')
                    ->select('recruitment_requests.*', 'clients.organisation_name', 'job_structures.job_title')
                    ->limit(10)
                    ->get();

                $results['complex_query'] = [
                    'status' => 'success',
                    'time_ms' => round((microtime(true) - $complexStart) * 1000, 2),
                    'data' => ['records_found' => $requests->count()],
                    'message' => "Found {$requests->count()} recruitment requests with joins"
                ];
            } catch (\Exception $e) {
                $results['complex_query'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $complexStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Test 5: Dashboard Stats
            $dashboardStart = microtime(true);
            try {
                $stats = DB::table('recruitment_requests')
                    ->selectRaw('
                        COUNT(*) as total,
                        SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN status = "closed" THEN 1 ELSE 0 END) as closed,
                        SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled
                    ')
                    ->first();

                $results['dashboard_stats'] = [
                    'status' => 'success',
                    'time_ms' => round((microtime(true) - $dashboardStart) * 1000, 2),
                    'data' => (array) $stats,
                    'message' => "Dashboard statistics calculated"
                ];
            } catch (\Exception $e) {
                $results['dashboard_stats'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $dashboardStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Test 6: Cache Performance
            $cacheStart = microtime(true);
            try {
                $cacheKey = 'performance_test_' . time();
                $testData = ['test' => true, 'timestamp' => now()];
                
                Cache::put($cacheKey, $testData, 60);
                $retrieved = Cache::get($cacheKey);
                Cache::forget($cacheKey);

                $results['cache_performance'] = [
                    'status' => $retrieved ? 'success' : 'error',
                    'time_ms' => round((microtime(true) - $cacheStart) * 1000, 2),
                    'data' => ['cache_working' => !is_null($retrieved)],
                    'message' => $retrieved ? 'Cache read/write successful' : 'Cache failed'
                ];
            } catch (\Exception $e) {
                $results['cache_performance'] = [
                    'status' => 'error',
                    'time_ms' => round((microtime(true) - $cacheStart) * 1000, 2),
                    'message' => $e->getMessage()
                ];
            }

            // Calculate total time and performance rating
            $totalTime = round((microtime(true) - $totalStartTime) * 1000, 2);
            
            $performanceRating = 'excellent';
            if ($totalTime > 2000) {
                $performanceRating = 'critical';
            } elseif ($totalTime > 1000) {
                $performanceRating = 'poor';
            } elseif ($totalTime > 500) {
                $performanceRating = 'acceptable';
            } elseif ($totalTime > 200) {
                $performanceRating = 'good';
            }

            $results['summary'] = [
                'total_time_ms' => $totalTime,
                'performance_rating' => $performanceRating,
                'tests_passed' => collect($results)->where('status', 'success')->count(),
                'tests_total' => count($results),
                'recommendations' => $this->getRecommendations($totalTime, $results)
            ];

            return response()->json([
                'success' => true,
                'data' => $results,
                'timestamp' => now()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'timestamp' => now()
            ], 500);
        }
    }

    /**
     * Get performance recommendations based on test results
     */
    private function getRecommendations($totalTime, $results)
    {
        $recommendations = [];

        if ($totalTime > 1000) {
            $recommendations[] = 'Consider adding database indexes for frequently queried tables';
            $recommendations[] = 'Enable query result caching with Redis';
            $recommendations[] = 'Optimize Docker resource allocation';
        }

        if ($totalTime > 500) {
            $recommendations[] = 'Implement progressive loading for large datasets';
            $recommendations[] = 'Use pagination for data-heavy components';
        }

        if (isset($results['cache_performance']) && $results['cache_performance']['status'] !== 'success') {
            $recommendations[] = 'Fix Redis caching system - caching is not working properly';
        }

        if (isset($results['states_lgas_load']) && $results['states_lgas_load']['time_ms'] > 50) {
            $recommendations[] = 'Consider caching states/LGAs data as it\'s loaded frequently';
        }

        if (empty($recommendations)) {
            $recommendations[] = 'Performance is good - system is operating within acceptable parameters';
        }

        return $recommendations;
    }

    /**
     * Test specific API endpoint performance
     */
    public function testEndpoint(Request $request)
    {
        $endpoint = $request->input('endpoint', '/api/states-lgas');
        $iterations = $request->input('iterations', 5);
        
        $results = [];
        $totalTime = 0;

        for ($i = 0; $i < $iterations; $i++) {
            $start = microtime(true);
            
            try {
                // Simulate the API call internally
                switch ($endpoint) {
                    case '/api/states-lgas':
                        $data = $this->simulateStatesLgasEndpoint();
                        break;
                    case '/api/clients':
                        $data = $this->simulateClientsEndpoint();
                        break;
                    default:
                        throw new \Exception("Endpoint not supported for testing");
                }
                
                $duration = round((microtime(true) - $start) * 1000, 2);
                $totalTime += $duration;
                
                $results[] = [
                    'iteration' => $i + 1,
                    'time_ms' => $duration,
                    'status' => 'success',
                    'record_count' => is_array($data) ? count($data) : (is_object($data) && method_exists($data, 'count') ? $data->count() : 'unknown')
                ];
            } catch (\Exception $e) {
                $duration = round((microtime(true) - $start) * 1000, 2);
                $totalTime += $duration;
                
                $results[] = [
                    'iteration' => $i + 1,
                    'time_ms' => $duration,
                    'status' => 'error',
                    'error' => $e->getMessage()
                ];
            }
        }

        $avgTime = round($totalTime / $iterations, 2);
        $minTime = collect($results)->min('time_ms');
        $maxTime = collect($results)->max('time_ms');

        return response()->json([
            'success' => true,
            'data' => [
                'endpoint' => $endpoint,
                'iterations' => $iterations,
                'average_time_ms' => $avgTime,
                'min_time_ms' => $minTime,
                'max_time_ms' => $maxTime,
                'total_time_ms' => round($totalTime, 2),
                'results' => $results
            ],
            'timestamp' => now()
        ]);
    }

    private function simulateStatesLgasEndpoint()
    {
        return DB::table('states_lgas')
            ->select('id', 'state_name', 'state_code', 'zone', 'lga_name', 'lga_code', 'is_capital')
            ->where('is_active', 1)
            ->orderBy('state_name')
            ->orderBy('lga_name')
            ->get();
    }

    private function simulateClientsEndpoint()
    {
        return DB::table('clients')
            ->select('id', 'organisation_name', 'contact_person_name', 'contact_person_email')
            ->where('is_active', 1)
            ->orderBy('organisation_name')
            ->get();
    }
}