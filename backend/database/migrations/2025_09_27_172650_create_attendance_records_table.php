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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_upload_id')->constrained('attendance_uploads')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->bigInteger('staff_id')->nullable(); // Reference to staff.id without foreign key constraint
            $table->string('employee_id', 50); // Staff employee ID from Excel
            $table->string('employee_name', 255); // From Excel
            $table->string('designation', 255)->nullable(); // Job title from Excel
            $table->date('payroll_month'); // Which month this record is for
            $table->integer('days_worked'); // Number of days worked
            $table->decimal('basic_salary', 12, 2); // Monthly basic salary
            $table->json('allowances')->nullable(); // Other allowances from Excel
            $table->json('deductions')->nullable(); // Deductions from Excel
            $table->decimal('gross_pay', 12, 2)->default(0); // Calculated gross pay
            $table->decimal('net_pay', 12, 2)->default(0); // Calculated net pay
            $table->enum('status', ['pending', 'processed', 'excluded'])->default('pending');
            $table->text('processing_notes')->nullable(); // Any notes during processing
            $table->timestamps();

            // Indexes for performance
            $table->index(['client_id', 'payroll_month']);
            $table->index(['staff_id', 'payroll_month']);
            $table->index('employee_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
