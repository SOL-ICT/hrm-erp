<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds job_structure_id and sol_office_id to staff table to establish
     * proper relationships with job structures and SOL offices.
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Add job_structure_id after job_title
            $table->unsignedBigInteger('job_structure_id')
                ->nullable()
                ->after('job_title')
                ->comment('Links staff to their job structure/position');

            // Add sol_office_id after service_location_id
            $table->unsignedBigInteger('sol_office_id')
                ->nullable()
                ->after('service_location_id')
                ->comment('Links staff to their SOL office location');

            // Add indexes for performance
            $table->index('job_structure_id', 'idx_staff_job_structure');
            $table->index('sol_office_id', 'idx_staff_sol_office');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_staff_job_structure');
            $table->dropIndex('idx_staff_sol_office');
            
            // Drop columns
            $table->dropColumn(['job_structure_id', 'sol_office_id']);
        });
    }
};
