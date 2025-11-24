<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update enum to remove 'designation' type
        DB::statement("ALTER TABLE staff_redeployments MODIFY COLUMN redeployment_type ENUM('department', 'service_location', 'client') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the original enum with 'designation'
        DB::statement("ALTER TABLE staff_redeployments MODIFY COLUMN redeployment_type ENUM('department', 'designation', 'service_location', 'client') NOT NULL");
    }
};
