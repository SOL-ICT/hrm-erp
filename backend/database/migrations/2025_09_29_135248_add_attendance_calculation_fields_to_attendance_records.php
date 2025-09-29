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
        Schema::table('attendance_records', function (Blueprint $table) {
            // Attendance Calculation Fields
            $table->decimal('attendance_factor', 3, 2)->nullable()->after('status'); // Factor for salary calculation (0.00 to 1.00)
            $table->integer('total_expected_days')->nullable()->after('attendance_factor'); // Total expected working/calendar days
            $table->integer('actual_working_days')->nullable()->after('total_expected_days'); // Actual days worked
            $table->decimal('prorated_percentage', 5, 2)->nullable()->after('actual_working_days'); // Percentage for proration

            // Calculation Metadata
            $table->enum('calculation_method', ['working_days', 'calendar_days'])->nullable()->after('prorated_percentage');
            $table->json('calculation_metadata')->nullable()->after('calculation_method'); // Store calculation details
            $table->timestamp('calculated_at')->nullable()->after('calculation_metadata');
            $table->string('calculated_by')->nullable()->after('calculated_at');

            // Index for performance
            $table->index(['client_id', 'attendance_factor']);
            $table->index(['calculated_at', 'calculation_method']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropIndex(['client_id', 'attendance_factor']);
            $table->dropIndex(['calculated_at', 'calculation_method']);

            $table->dropColumn([
                'attendance_factor',
                'total_expected_days',
                'actual_working_days',
                'prorated_percentage',
                'calculation_method',
                'calculation_metadata',
                'calculated_at',
                'calculated_by'
            ]);
        });
    }
};
