<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CacheService;

class CacheWarmupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warmup {--force : Force cache refresh}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up application caches with critical data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting cache warmup...');

        if ($this->option('force')) {
            $this->info('Force refresh enabled - clearing existing caches...');
            CacheService::clearAll();
        }

        // Warm up critical caches
        CacheService::warmUp();

        $this->info('Cache warmup completed successfully!');

        // Show cache statistics
        $stats = CacheService::getStats();
        if ($stats['status'] === 'connected') {
            $this->table(['Metric', 'Value'], [
                ['Status', '✅ Connected'],
                ['Memory Used', $stats['memory_used']],
                ['Total Keys', $stats['total_keys']],
                ['Cache Hits', $stats['cache_hits']],
                ['Cache Misses', $stats['cache_misses']]
            ]);
        } else {
            $this->error('Redis connection failed: ' . $stats['error']);
        }

        return Command::SUCCESS;
    }
}
