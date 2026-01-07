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
        // Guard: only modify table if it already exists. This prevents failures
        // when this migration runs before the migration that creates the `staff` table.
        if (Schema::hasTable('staff')) {
            Schema::table('staff', function (Blueprint $table) {
                $table->unsignedBigInteger('category_id')->nullable()->after('leave_category_level');
                $table->foreign('category_id')->references('id')->on('staff_categories')->onDelete('set null');
                $table->index('category_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('staff')) {
            Schema::table('staff', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
                $table->dropIndex(['category_id']);
                $table->dropColumn('category_id');
            });
        }
    }
};
