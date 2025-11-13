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
        // Use raw SQL to modify the id column to be auto-incrementing
        DB::statement('ALTER TABLE emolument_components MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove auto increment from id column
        DB::statement('ALTER TABLE emolument_components MODIFY COLUMN id BIGINT UNSIGNED NOT NULL');
    }
};
