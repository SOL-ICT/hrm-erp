<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheService
{
    // Cache durations in seconds
    const CACHE_DURATIONS = [
        'reference_data' => 3600,      // 1 hour for static reference data
        'user_data' => 1800,           // 30 minutes for user-related data
        'dynamic_data' => 300,         // 5 minutes for frequently changing data
        'query_results' => 900,        // 15 minutes for query results
        'api_responses' => 600,        // 10 minutes for API responses
    ];

    // Cache tags for organized invalidation
    const CACHE_TAGS = [
        'clients' => 'clients',
        'recruitment' => 'recruitment_requests',
        'services' => 'service_requests',
        'contracts' => 'contracts',
        'users' => 'users',
        'jobs' => 'job_structures',
        'tests' => 'tests',
        'interviews' => 'interviews',
    ];

    /**
     * Cache data with tags and TTL
     */
    public static function remember(string $key, string $tag, callable $callback, ?int $ttl = null): mixed
    {
        $ttl = $ttl ?? self::CACHE_DURATIONS['query_results'];
        
        try {
            return Cache::tags([self::CACHE_TAGS[$tag] ?? $tag])
                ->remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning("Cache remember failed for key: {$key}", [
                'error' => $e->getMessage(),
                'tag' => $tag
            ]);
            return $callback();
        }
    }

    /**
     * Cache reference data (longer TTL)
     */
    public static function rememberReferenceData(string $key, string $tag, callable $callback): mixed
    {
        return self::remember($key, $tag, $callback, self::CACHE_DURATIONS['reference_data']);
    }

    /**
     * Cache API responses
     */
    public static function rememberApiResponse(string $key, string $tag, callable $callback): mixed
    {
        return self::remember($key, $tag, $callback, self::CACHE_DURATIONS['api_responses']);
    }

    /**
     * Invalidate cache by tag
     */
    public static function invalidateTag(string $tag): bool
    {
        try {
            Cache::tags([self::CACHE_TAGS[$tag] ?? $tag])->flush();
            Log::info("Cache invalidated for tag: {$tag}");
            return true;
        } catch (\Exception $e) {
            Log::error("Cache invalidation failed for tag: {$tag}", [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Generate cache key from request parameters
     */
    public static function generateKey(string $prefix, array $params = []): string
    {
        if (empty($params)) {
            return $prefix;
        }
        
        $paramString = md5(serialize($params));
        return "{$prefix}_{$paramString}";
    }

    /**
     * Warm up critical cache data
     */
    public static function warmUp(): void
    {
        try {
            Log::info("Starting cache warm-up...");

            // Warm up clients cache
            self::rememberReferenceData('all_clients', 'clients', function () {
                return \App\Models\Client::select('id', 'organisation_name', 'email', 'phone')
                    ->where('is_active', 1)
                    ->get();
            });

            // Warm up job structures cache
            self::rememberReferenceData('all_job_structures', 'jobs', function () {
                return \App\Models\JobStructure::select('id', 'job_title', 'job_code', 'client_id')
                    ->where('is_active', 1)
                    ->with('client:id,organisation_name')
                    ->get();
            });

            // Warm up service requests cache
            self::rememberReferenceData('all_service_requests', 'services', function () {
                return \App\Models\ServiceRequest::select('id', 'service_name', 'service_type', 'client_id')
                    ->where('is_active', 1)
                    ->get();
            });

            Log::info("Cache warm-up completed successfully");
        } catch (\Exception $e) {
            Log::error("Cache warm-up failed", ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get cache statistics
     */
    public static function getStats(): array
    {
        try {
            $redis = Cache::getRedis();
            $info = $redis->info();
            
            return [
                'status' => 'connected',
                'memory_used' => $info['used_memory_human'] ?? 'N/A',
                'total_keys' => $redis->dbsize(),
                'connected_clients' => $info['connected_clients'] ?? 'N/A',
                'cache_hits' => $info['keyspace_hits'] ?? 'N/A',
                'cache_misses' => $info['keyspace_misses'] ?? 'N/A',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'disconnected',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Clear all application caches
     */
    public static function clearAll(): bool
    {
        try {
            Cache::flush();
            Log::info("All caches cleared successfully");
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to clear all caches", ['error' => $e->getMessage()]);
            return false;
        }
    }
}
