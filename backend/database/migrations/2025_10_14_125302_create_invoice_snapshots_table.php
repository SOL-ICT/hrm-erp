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
        Schema::create('invoice_snapshots', function (Blueprint $table) {
            $table->id();

            // Invoice identification
            $table->foreignId('client_id')->constrained()->comment('Client this invoice belongs to');
            $table->foreignId('calculation_template_id')->constrained()->comment('Calculation template used');
            $table->foreignId('export_template_id')->constrained()->comment('Export template used');
            $table->string('invoice_number')->unique()->comment('Unique invoice number');
            $table->string('invoice_period')->comment('Period this invoice covers (e.g., 2025-10)');

            // Calculation data (frozen snapshot)
            $table->json('employee_calculations')->comment('Complete calculation data for all employees');
            $table->json('template_snapshot')->comment('Snapshot of calculation template at time of generation');
            $table->json('calculation_metadata')->comment('Metadata about the calculation process');

            // Totals and summary
            $table->decimal('total_gross_salary', 15, 2)->comment('Total gross salary for all employees');
            $table->decimal('total_deductions', 15, 2)->comment('Total deductions for all employees');
            $table->decimal('total_net_salary', 15, 2)->comment('Total net salary for all employees');
            $table->decimal('total_service_fees', 10, 2)->default(0.00)->comment('Total service fees');
            $table->integer('employee_count')->comment('Number of employees in this invoice');

            // Export information
            $table->json('export_metadata')->nullable()->comment('Metadata about exported files');
            $table->json('export_file_paths')->nullable()->comment('Paths to generated export files');

            // Status and workflow
            $table->enum('status', ['draft', 'generated', 'sent', 'paid', 'cancelled'])->default('draft')->comment('Invoice status');
            $table->timestamp('generated_at')->nullable()->comment('When invoice was generated');
            $table->timestamp('sent_at')->nullable()->comment('When invoice was sent to client');
            $table->timestamp('paid_at')->nullable()->comment('When invoice was marked as paid');

            // Validation and integrity
            $table->string('calculation_hash')->comment('Hash of calculation data for integrity checking');
            $table->boolean('is_validated')->default(false)->comment('Whether calculations have been validated');
            $table->timestamp('validated_at')->nullable()->comment('When invoice was validated');
            $table->string('validated_by')->nullable()->comment('User who validated the invoice');

            // Metadata
            $table->string('created_by')->comment('User who created this invoice');
            $table->string('updated_by')->nullable()->comment('User who last updated this invoice');
            $table->text('notes')->nullable()->comment('Additional notes about this invoice');

            // Audit trail
            $table->timestamps();

            // Indexes
            $table->index('client_id');
            $table->index(['client_id', 'invoice_period'], 'idx_client_period');
            $table->index(['calculation_template_id', 'export_template_id'], 'idx_calc_export_templates');
            $table->index('status');
            $table->index('generated_at');
            $table->index('calculation_hash');
            $table->index(['is_validated', 'validated_at'], 'idx_validation_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_snapshots');
    }
};
