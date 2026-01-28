<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migrates existing single-location tickets to the junction table.
     * Keeps service_location_id in recruitment_requests for backward compatibility
     * but primary source will be recruitment_request_locations.
     */
    public function up(): void
    {
        // Migrate existing recruitment requests with service_location_id to junction table
        // Only migrate if the service_location exists (foreign key constraint)
        $recruitmentRequests = DB::table('recruitment_requests')
            ->whereNotNull('service_location_id')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('service_locations')
                      ->whereColumn('service_locations.id', 'recruitment_requests.service_location_id');
            })
            ->get();

        foreach ($recruitmentRequests as $request) {
            // Check if this combination doesn't already exist
            $exists = DB::table('recruitment_request_locations')
                ->where('recruitment_request_id', $request->id)
                ->where('service_location_id', $request->service_location_id)
                ->exists();

            if (!$exists) {
                DB::table('recruitment_request_locations')->insert([
                    'recruitment_request_id' => $request->id,
                    'service_location_id' => $request->service_location_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear migrated data
        DB::table('recruitment_request_locations')->truncate();
    }
};
