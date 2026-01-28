<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Fixes UBA service locations that have incorrect state values.
     * The bug was using SOL office's state instead of LGA's actual state.
     * This migration corrects state values by matching cities to their LGAs.
     */
    public function up(): void
    {
        // Get all UBA locations with state='Oyo' that might be incorrect
        $locations = DB::table('service_locations')
            ->where('client_id', 41) // UBA
            ->where('state', 'Oyo')
            ->get();

        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($locations as $location) {
            // Fuzzy match city to LGA (normalize hyphens and spaces)
            $lga = DB::table('states_lgas')
                ->whereRaw("
                    REPLACE(REPLACE(LOWER(lga_name), '-', ' '), '  ', ' ') = 
                    REPLACE(REPLACE(LOWER(?), '-', ' '), '  ', ' ')
                ", [$location->city])
                ->first();

            if ($lga) {
                // Only update if the state is different
                if ($lga->state_name !== $location->state) {
                    DB::table('service_locations')
                        ->where('id', $location->id)
                        ->update(['state' => $lga->state_name]);
                    
                    $updatedCount++;
                    
                    echo "✅ Updated: {$location->city} -> {$lga->state_name} (was {$location->state})\n";
                } else {
                    $skippedCount++;
                    echo "⏭️ Skipped: {$location->city} (already correct: {$lga->state_name})\n";
                }
            } else {
                echo "⚠️ Warning: No LGA match found for {$location->city}\n";
            }
        }

        echo "\n✅ Migration complete: Updated {$updatedCount} locations, skipped {$skippedCount} correct locations\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse - we don't know what the original incorrect values were
        echo "⚠️ Cannot reverse this migration - original incorrect values were not stored\n";
    }
};
