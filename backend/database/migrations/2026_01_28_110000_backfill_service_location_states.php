<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Backfill NULL state values in service_locations table by copying
     * the state_name from their linked SOL office.
     */
    public function up(): void
    {
        // Update service locations that have NULL state but have a linked SOL office
        $updatedCount = DB::update("
            UPDATE service_locations sl
            INNER JOIN sol_offices so ON sl.sol_office_id = so.id
            SET sl.state = so.state_name
            WHERE sl.state IS NULL
            AND sl.sol_office_id IS NOT NULL
            AND so.state_name IS NOT NULL
        ");
        
        // Log the result
        if ($updatedCount > 0) {
            echo "✅ Backfilled {$updatedCount} service location(s) with state from SOL office\n";
        } else {
            echo "ℹ️ No service locations needed state backfill\n";
        }
    }

    /**
     * Reverse the migrations.
     * 
     * Note: We cannot reverse this as we don't know which states were NULL before.
     * This is a data quality improvement, not a schema change.
     */
    public function down(): void
    {
        // Cannot reverse data backfill
        echo "⚠️ State backfill cannot be reversed. This is a one-way data quality improvement.\n";
    }
};
