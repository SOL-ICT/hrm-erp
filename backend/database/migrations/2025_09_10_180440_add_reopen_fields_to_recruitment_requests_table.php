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
            $table->text('reopen_reason')->nullable()->after('closed_reason');
            $table->timestamp('reopened_at')->nullable()->after('reopen_reason');
            $table->foreignId('reopened_by')->nullable()->constrained('users')->onDelete('set null')->after('reopened_at');
            
            // Indexes for better query performance
            $table->index(['reopened_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropForeign(['reopened_by']);
            $table->dropIndex(['reopened_at']);
            $table->dropColumn(['reopen_reason', 'reopened_at', 'reopened_by']);
        });
    }
};
