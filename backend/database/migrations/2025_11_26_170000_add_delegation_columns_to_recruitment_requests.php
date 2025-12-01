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
        Schema::table('recruitment_requests', function (Blueprint $table) {
            // Add delegation tracking columns
            $table->unsignedBigInteger('delegated_by')->nullable()->after('assigned_to');
            $table->timestamp('delegated_at')->nullable()->after('delegated_by');
            $table->text('delegation_notes')->nullable()->after('delegated_at');

            // Add foreign key
            $table->foreign('delegated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropForeign(['delegated_by']);
            $table->dropColumn(['delegated_by', 'delegated_at', 'delegation_notes']);
        });
    }
};
