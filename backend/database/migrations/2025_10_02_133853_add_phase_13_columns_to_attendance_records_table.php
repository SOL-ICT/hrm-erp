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
            // Drop all salary-related columns (now handled by templates)
            $table->dropColumn([
                'basic_salary',
                'allowances',
                'deductions',
                'gross_pay',
                'gross_salary',
                'net_pay',
                'net_salary',
                'credit_to_bank',
                'adjusted_components'
            ]);

            // Phase 1.3: Enhanced Attendance Upload Process columns
            $table->string('employee_code', 50)->nullable()->after('employee_id');
            $table->bigInteger('pay_grade_structure_id')->unsigned()->nullable()->after('employee_code');
            $table->boolean('direct_id_matched')->default(false)->after('pay_grade_structure_id');
            $table->json('validation_errors')->nullable()->after('direct_id_matched');
            $table->enum('record_status', ['valid', 'invalid', 'pending_review'])->default('pending_review')->after('validation_errors');
            $table->boolean('template_available')->default(false)->after('record_status');
            $table->string('template_name')->nullable()->after('template_available');
            $table->boolean('ready_for_calculation')->default(false)->after('template_name');

            // Add foreign key constraint for pay_grade_structure_id if the table exists
            // $table->foreign('pay_grade_structure_id')->references('id')->on('pay_grade_structures')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            // Re-add the dropped salary columns
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->json('allowances')->nullable();
            $table->json('deductions')->nullable();
            $table->decimal('gross_pay', 12, 2)->default(0);
            $table->decimal('gross_salary', 10, 2)->nullable();
            $table->decimal('net_pay', 12, 2)->default(0);
            $table->decimal('net_salary', 10, 2)->nullable();
            $table->decimal('credit_to_bank', 10, 2)->nullable();
            $table->json('adjusted_components')->nullable();

            // Drop Phase 1.3 columns
            $table->dropColumn([
                'employee_code',
                'pay_grade_structure_id',
                'direct_id_matched',
                'validation_errors',
                'record_status',
                'template_available',
                'template_name',
                'ready_for_calculation'
            ]);
        });
    }
};
