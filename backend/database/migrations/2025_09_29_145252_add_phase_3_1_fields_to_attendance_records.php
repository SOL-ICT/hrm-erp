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
            // Phase 3.1 - Enhanced payroll calculation fields
            $table->decimal('gross_salary', 10, 2)->nullable()->after('gross_pay'); // Alternative to gross_pay
            $table->decimal('net_salary', 10, 2)->nullable()->after('net_pay'); // Alternative to net_pay
            $table->decimal('credit_to_bank', 10, 2)->nullable()->after('net_salary'); // What client pays us

            // Enhanced component storage
            $table->json('adjusted_components')->nullable()->after('credit_to_bank'); // Attendance-adjusted components
            $table->json('calculation_details')->nullable()->after('adjusted_components'); // Full calculation breakdown

            // Index for performance
            $table->index(['client_id', 'credit_to_bank']);
            $table->index(['gross_salary', 'net_salary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropIndex(['client_id', 'credit_to_bank']);
            $table->dropIndex(['gross_salary', 'net_salary']);

            $table->dropColumn([
                'gross_salary',
                'net_salary',
                'credit_to_bank',
                'adjusted_components',
                'calculation_details'
            ]);
        });
    }
};
