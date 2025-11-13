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
        Schema::table('attendance_uploads', function (Blueprint $table) {
            // Phase 1.3: Enhanced Attendance Upload Process columns
            $table->json('format_validation_results')->nullable()->after('processing_errors');
            $table->json('matching_validation_results')->nullable()->after('format_validation_results');
            $table->json('template_coverage_results')->nullable()->after('matching_validation_results');
            $table->integer('successfully_matched')->default(0)->after('template_coverage_results');
            $table->integer('failed_matches')->default(0)->after('successfully_matched');
            $table->decimal('match_percentage', 5, 2)->default(0)->after('failed_matches');
            $table->enum('validation_status', ['pending', 'validated', 'partial', 'failed'])->default('pending')->after('match_percentage');
            $table->boolean('ready_for_processing')->default(false)->after('validation_status');
            $table->timestamp('validation_completed_at')->nullable()->after('ready_for_processing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_uploads', function (Blueprint $table) {
            $table->dropColumn([
                'format_validation_results',
                'matching_validation_results',
                'template_coverage_results',
                'successfully_matched',
                'failed_matches',
                'match_percentage',
                'validation_status',
                'ready_for_processing',
                'validation_completed_at'
            ]);
        });
    }
};
