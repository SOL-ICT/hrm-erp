<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds Yewa South LGA to states_lgas table.
     * Yewa South is the modern name for what was formerly called Egbado South.
     * Also updates any existing service locations with "Yewa South" to have proper state.
     */
    public function up(): void
    {
        // Check if Yewa South already exists
        $exists = DB::table('states_lgas')
            ->where('state_name', 'Ogun')
            ->where('lga_name', 'Yewa South')
            ->exists();
        
        if (!$exists) {
            // Insert Yewa South LGA
            DB::table('states_lgas')->insert([
                'state_name' => 'Ogun',
                'state_code' => 'OG',
                'lga_name' => 'Yewa South',
                'lga_code' => 'OG21', // Next available code after OG20 (Sagamu)
                'zone' => 'south_west',
                'is_capital' => 0,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            echo "✅ Added Yewa South LGA to Ogun state\n";
        } else {
            echo "ℹ️ Yewa South already exists in states_lgas\n";
        }
        
        // Update any service locations with Yewa South that have NULL state
        $updated = DB::table('service_locations')
            ->where('city', 'Yewa South')
            ->whereNull('state')
            ->update(['state' => 'Ogun']);
        
        if ($updated > 0) {
            echo "✅ Updated {$updated} service location(s) with Yewa South to have Ogun state\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove Yewa South LGA
        DB::table('states_lgas')
            ->where('state_name', 'Ogun')
            ->where('lga_name', 'Yewa South')
            ->delete();
        
        echo "⚠️ Removed Yewa South LGA from states_lgas\n";
    }
};
