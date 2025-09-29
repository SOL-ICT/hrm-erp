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
        Schema::create('generated_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 100)->unique(); // GEN-INV-2025-001
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('attendance_upload_id')->constrained('attendance_uploads')->onDelete('cascade');
            $table->date('invoice_month'); // Which month this invoice covers
            $table->enum('invoice_type', ['with_schedule', 'without_schedule']); // Detailed vs Summary
            $table->integer('total_employees'); // Number of employees in invoice
            $table->decimal('gross_payroll', 15, 2); // Total gross payroll
            $table->decimal('total_deductions', 15, 2)->default(0); // PAYE, NHF, NSITF
            $table->decimal('net_payroll', 15, 2); // After deductions
            $table->decimal('management_fee', 12, 2)->default(0); // 7% management fee
            $table->decimal('vat_amount', 12, 2)->default(0); // 7.5% VAT
            $table->decimal('wht_amount', 12, 2)->default(0); // WHT if applicable
            $table->decimal('total_invoice_amount', 15, 2); // Final amount to be paid
            $table->enum('status', ['draft', 'generated', 'sent', 'paid'])->default('draft');
            $table->string('excel_file_path', 500)->nullable(); // Path to generated Excel file
            $table->json('calculation_breakdown')->nullable(); // Detailed breakdown JSON
            $table->integer('generated_by'); // User who generated invoice
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['client_id', 'invoice_month']);
            $table->index('invoice_number');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_invoices');
    }
};
