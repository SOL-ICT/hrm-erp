<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds service_location_id to candidate_job_applications table
     * to track which specific location the candidate applied to.
     */
    public function up(): void
    {
        Schema::table('candidate_job_applications', function (Blueprint $table) {
            $table->foreignId('service_location_id')->nullable()->after('recruitment_request_id')->constrained('service_locations')->onDelete('set null');
            $table->index('service_location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidate_job_applications', function (Blueprint $table) {
            $table->dropForeign(['service_location_id']);
            $table->dropIndex(['service_location_id']);
            $table->dropColumn('service_location_id');
        });
    }
};
