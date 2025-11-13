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
            // Remove the old ambiguous profile_id column
            $table->dropColumn('profile_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore the old profile_id column if needed (for rollback)
            $table->unsignedBigInteger('profile_id')->nullable()->after('user_type');
            $table->index('profile_id');
        });
    }
};
