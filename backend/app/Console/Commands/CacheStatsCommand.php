<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CacheService;
use Illuminate\Support\Facades\Cache;

class CacheStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display cache statistics and information';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('📊 Cache Statistics Dashboard');
        $this->line('');

        $stats = CacheService::getStats();

        if ($stats['status'] === 'connected') {
            $this->info('✅ Redis Connection: Connected');
            $this->line('');

            $this->table(['Metric', 'Value'], [
                ['Memory Used', $stats['memory_used']],
                ['Total Keys', number_format((int)($stats['total_keys'] ?? 0))],
                ['Connected Clients', $stats['connected_clients']],
                ['Cache Hits', number_format((int)($stats['cache_hits'] ?? 0))],
                ['Cache Misses', number_format((int)($stats['cache_misses'] ?? 0))],
                ['Hit Rate', $this->calculateHitRate((int)($stats['cache_hits'] ?? 0), (int)($stats['cache_misses'] ?? 0))]
            ]);

            // Show sample of cached keys
            try {
                $redis = Cache::getRedis();
                $keys = $redis->keys('*');
                $sampleKeys = array_slice($keys, 0, 10);
                
                if (!empty($sampleKeys)) {
                    $this->line('');
                    $this->info('🔑 Sample Cached Keys:');
                    foreach ($sampleKeys as $key) {
                        $ttl = $redis->ttl($key);
                        $ttlText = $ttl > 0 ? "expires in {$ttl}s" : ($ttl === -1 ? 'no expiry' : 'expired');
                        $this->line("  • {$key} ({$ttlText})");
                    }
                }
            } catch (\Exception $e) {
                $this->warn('Could not retrieve cache keys: ' . $e->getMessage());
            }

        } else {
            $this->error('❌ Redis Connection: Disconnected');
            $this->error('Error: ' . $stats['error']);
            
            $this->line('');
            $this->info('💡 Troubleshooting Tips:');
            $this->line('  • Check if Redis container is running: docker ps');
            $this->line('  • Verify Redis connection settings in .env');
            $this->line('  • Test connection: redis-cli ping');
        }

        return Command::SUCCESS;
    }

    private function calculateHitRate($hits, $misses): string
    {
        $total = $hits + $misses;
        if ($total === 0) return '0%';
        
        $rate = ($hits / $total) * 100;
        return number_format($rate, 1) . '%';
    }
}
