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
        // Drop foreign keys temporarily
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropForeign(['delegated_by']);
        });
        
        Schema::table('staff', function (Blueprint $table) {
            $table->dropForeign(['control_approved_by']);
            $table->dropForeign(['control_rejected_by']);
        });

        // Fix the users table id column to have AUTO_INCREMENT
        DB::statement('ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');

        // Recreate foreign keys
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->foreign('delegated_by')->references('id')->on('users');
        });
        
        Schema::table('staff', function (Blueprint $table) {
            $table->foreign('control_approved_by')->references('id')->on('users');
            $table->foreign('control_rejected_by')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback needed - AUTO_INCREMENT should stay
    }
};
