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
        Schema::create('invoice_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_invoice_id')->constrained('generated_invoices')->onDelete('cascade');
            $table->foreignId('attendance_record_id')->constrained('attendance_records')->onDelete('cascade');
            $table->string('employee_id', 50); // From attendance record
            $table->string('employee_name', 255); // From attendance record
            $table->string('designation', 255)->nullable(); // Job title
            $table->integer('days_worked'); // Days worked in month
            $table->decimal('basic_salary', 12, 2); // Monthly basic
            $table->decimal('gross_pay', 12, 2); // Including allowances
            $table->decimal('paye_deduction', 12, 2)->default(0); // PAYE tax
            $table->decimal('nhf_deduction', 12, 2)->default(0); // National Housing Fund
            $table->decimal('nsitf_deduction', 12, 2)->default(0); // Nigeria Social Insurance Trust Fund
            $table->decimal('other_deductions', 12, 2)->default(0); // Other deductions
            $table->decimal('total_deductions', 12, 2)->default(0); // Sum of all deductions
            $table->decimal('net_pay', 12, 2); // Final pay after deductions
            $table->json('allowances_breakdown')->nullable(); // Detailed allowances
            $table->json('deductions_breakdown')->nullable(); // Detailed deductions
            $table->timestamps();

            // Indexes
            $table->index('generated_invoice_id');
            $table->index('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_line_items');
    }
};
