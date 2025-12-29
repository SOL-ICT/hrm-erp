<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // CRITICAL SAFETY CHECK: Ensure we're NEVER using production database
        $databaseName = DB::connection()->getDatabaseName();
        
        if ($databaseName !== 'hrm_database_test') {
            throw new \Exception(
                "CRITICAL ERROR: Tests attempting to run against '{$databaseName}' instead of 'hrm_database_test'. " .
                "This would wipe your development database. Tests aborted for safety."
            );
        }
    }

    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        return $app;
    }
}
