<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        try {
            // Get current max ID
            $maxId = DB::table('users')->max('id') ?? 0;
            $nextAutoIncrement = $maxId + 1;
            
            // Drop the primary key first
            DB::statement('ALTER TABLE users DROP PRIMARY KEY');
            
            // Modify the column to add AUTO_INCREMENT
            DB::statement('ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY');
            
            // Set the AUTO_INCREMENT value explicitly
            DB::statement("ALTER TABLE users AUTO_INCREMENT = {$nextAutoIncrement}");
            
            echo "✅ AUTO_INCREMENT set to {$nextAutoIncrement}\n";
            
        } catch (\Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            throw $e;
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        try {
            DB::statement('ALTER TABLE users DROP PRIMARY KEY');
            DB::statement('ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE users ADD PRIMARY KEY (id)');
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
};
