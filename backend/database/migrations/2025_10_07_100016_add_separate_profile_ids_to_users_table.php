<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add separate profile ID columns
            $table->unsignedBigInteger('staff_profile_id')->nullable()->after('profile_id');
            $table->unsignedBigInteger('candidate_profile_id')->nullable()->after('staff_profile_id');

            // Add foreign key constraints
            $table->foreign('staff_profile_id')->references('id')->on('staff')->onDelete('set null');
            $table->foreign('candidate_profile_id')->references('id')->on('candidates')->onDelete('set null');

            // Add indexes for better performance
            $table->index('staff_profile_id');
            $table->index('candidate_profile_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['staff_profile_id']);
            $table->dropForeign(['candidate_profile_id']);

            // Drop indexes
            $table->dropIndex(['staff_profile_id']);
            $table->dropIndex(['candidate_profile_id']);

            // Drop columns
            $table->dropColumn(['staff_profile_id', 'candidate_profile_id']);
        });
    }
};
