<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CacheService;
use App\Models\Recruitment\RecruitmentRequest;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class TestCachePerformanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:test-performance {--iterations=5 : Number of test iterations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test cache performance with recruitment requests';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $iterations = (int) $this->option('iterations');
        
        $this->info('🚀 Testing Cache Performance');
        $this->line('');

        // Test 1: Database query without cache
        $this->info('🔹 Test 1: Direct Database Query (No Cache)');
        $dbTimes = [];
        for ($i = 0; $i < $iterations; $i++) {
            $start = microtime(true);
            $result = RecruitmentRequest::with([
                'client:id,organisation_name',
                'serviceRequest:id,service_name,service_type',
                'jobStructure:id,job_title,job_code',
            ])->take(10)->get();
            $end = microtime(true);
            $dbTimes[] = ($end - $start) * 1000; // Convert to milliseconds
            $this->line("  Iteration " . ($i + 1) . ": " . number_format($dbTimes[$i], 2) . "ms");
        }
        $avgDbTime = array_sum($dbTimes) / count($dbTimes);

        $this->line('');

        // Test 2: Cache-enabled query (first hit will be slow, subsequent fast)
        $this->info('🔹 Test 2: Cache-Enabled Query');
        $cacheTimes = [];
        
        // Clear any existing cache for this test
        Cache::forget('test_recruitment_requests');
        
        for ($i = 0; $i < $iterations; $i++) {
            $start = microtime(true);
            $result = CacheService::remember('test_recruitment_requests', 'recruitment', function () {
                return RecruitmentRequest::with([
                    'client:id,organisation_name',
                    'serviceRequest:id,service_name,service_type',
                    'jobStructure:id,job_title,job_code',
                ])->take(10)->get();
            }, 300);
            $end = microtime(true);
            $cacheTimes[] = ($end - $start) * 1000;
            $cacheStatus = $i === 0 ? 'MISS' : 'HIT';
            $this->line("  Iteration " . ($i + 1) . " ($cacheStatus): " . number_format($cacheTimes[$i], 2) . "ms");
        }

        $this->line('');

        // Test 3: Cache hits only (exclude first miss)
        $cacheHitTimes = array_slice($cacheTimes, 1);
        $avgCacheHitTime = !empty($cacheHitTimes) ? array_sum($cacheHitTimes) / count($cacheHitTimes) : 0;

        // Results summary
        $this->info('📊 Performance Results Summary');
        $this->line('');

        $this->table(['Metric', 'Average Time (ms)', 'Performance'], [
            ['Database Query (No Cache)', number_format($avgDbTime, 2), 'Baseline'],
            ['Cache Miss (First Hit)', number_format($cacheTimes[0], 2), $this->getPerformanceIndicator($cacheTimes[0], $avgDbTime)],
            ['Cache Hit (Subsequent)', number_format($avgCacheHitTime, 2), $this->getPerformanceIndicator($avgCacheHitTime, $avgDbTime)],
        ]);

        if ($avgCacheHitTime > 0) {
            $speedup = $avgDbTime / $avgCacheHitTime;
            $this->line('');
            $this->info("🎯 Cache provides " . number_format($speedup, 1) . "x speed improvement!");
            
            $percentImprovement = (($avgDbTime - $avgCacheHitTime) / $avgDbTime) * 100;
            $this->info("💰 Performance improvement: " . number_format($percentImprovement, 1) . "%");
        }

        // Current cache statistics
        $this->line('');
        $this->info('🗄️ Current Cache Statistics');
        $stats = CacheService::getStats();
        if ($stats['status'] === 'connected') {
            $this->table(['Metric', 'Value'], [
                ['Total Keys', number_format((int)($stats['total_keys'] ?? 0))],
                ['Cache Hits', number_format((int)($stats['cache_hits'] ?? 0))],
                ['Cache Misses', number_format((int)($stats['cache_misses'] ?? 0))],
                ['Hit Rate', $this->calculateHitRate((int)($stats['cache_hits'] ?? 0), (int)($stats['cache_misses'] ?? 0))]
            ]);
        }

        return Command::SUCCESS;
    }

    private function getPerformanceIndicator(float $time, float $baseline): string
    {
        $ratio = $time / $baseline;
        
        if ($ratio < 0.2) return '🚀 Excellent (5x+ faster)';
        if ($ratio < 0.5) return '⚡ Very Good (2-5x faster)';
        if ($ratio < 0.8) return '✅ Good (1.2-2x faster)';
        if ($ratio <= 1.0) return '😐 Similar';
        return '🐌 Slower';
    }

    private function calculateHitRate(int $hits, int $misses): string
    {
        $total = $hits + $misses;
        if ($total === 0) return '0%';
        
        $rate = ($hits / $total) * 100;
        return number_format($rate, 1) . '%';
    }
}
