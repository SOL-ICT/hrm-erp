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
        // Fix staff table - add PRIMARY KEY and AUTO_INCREMENT
        DB::statement('ALTER TABLE `staff` MODIFY `id` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this safely without data loss
        DB::statement('ALTER TABLE `staff` MODIFY `id` bigint unsigned NOT NULL');
    }
};
