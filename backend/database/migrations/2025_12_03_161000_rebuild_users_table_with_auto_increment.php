<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration rebuilds the users table completely to add AUTO_INCREMENT
     * which has failed to persist through 13+ different ALTER TABLE attempts.
     */
    public function up(): void
    {
        echo "Starting users table rebuild with AUTO_INCREMENT...\n";
        
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        try {
            // Step 1: Create new table with correct AUTO_INCREMENT structure
            echo "Step 1: Creating users_new table with AUTO_INCREMENT...\n";
            DB::statement("
                CREATE TABLE `users_new` (
                  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `email_verified_at` timestamp NULL DEFAULT NULL,
                  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                  `preferences` json DEFAULT NULL,
                  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'candidate',
                  `user_type` enum('candidate','staff','admin','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                  `staff_profile_id` bigint unsigned DEFAULT NULL,
                  `candidate_profile_id` bigint unsigned DEFAULT NULL,
                  `is_active` tinyint(1) NOT NULL DEFAULT '1',
                  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                  `created_at` timestamp NULL DEFAULT NULL,
                  `updated_at` timestamp NULL DEFAULT NULL,
                  PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
            
            // Step 2: Copy all data from old table to new table
            echo "Step 2: Copying data from users to users_new...\n";
            DB::statement("
                INSERT INTO users_new 
                SELECT * FROM users
            ");
            
            $copiedRows = DB::table('users_new')->count();
            echo "Copied {$copiedRows} rows\n";
            
            // Step 3: Drop old table
            echo "Step 3: Dropping old users table...\n";
            DB::statement("DROP TABLE users");
            
            // Step 4: Rename new table to users
            echo "Step 4: Renaming users_new to users...\n";
            DB::statement("RENAME TABLE users_new TO users");
            
            // Step 5: Verify AUTO_INCREMENT is set
            $autoIncrement = DB::select("
                SELECT AUTO_INCREMENT 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'users'
            ")[0]->AUTO_INCREMENT;
            
            echo "✅ SUCCESS! AUTO_INCREMENT is now set to: {$autoIncrement}\n";
            
            // Step 6: Recreate foreign keys
            echo "Step 5: Recreating foreign keys...\n";
            
            Schema::table('recruitment_requests', function ($table) {
                $table->foreign('delegated_by')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
            });
            
            Schema::table('staff', function ($table) {
                $table->foreign('control_approved_by')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
                    
                $table->foreign('control_rejected_by')
                    ->references('id')
                    ->on('users')
                    ->onDelete('set null');
            });
            
            echo "✅ All foreign keys recreated\n";
            echo "🎉 Users table rebuild complete!\n";
            
        } catch (\Exception $e) {
            echo "❌ ERROR: " . $e->getMessage() . "\n";
            
            // Cleanup: Drop users_new if it exists
            DB::statement("DROP TABLE IF EXISTS users_new");
            
            throw $e;
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse this migration safely
        throw new \Exception('This migration cannot be reversed. Restore from backup if needed.');
    }
};
