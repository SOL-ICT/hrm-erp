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
        Schema::table('generated_invoices', function (Blueprint $table) {
            // FIRS Submission Status
            $table->boolean('firs_submitted')->default(false)->comment('Whether invoice has been submitted to FIRS');
            $table->boolean('firs_approved')->default(false)->comment('Whether invoice has been approved by FIRS');
            $table->string('firs_status')->nullable()->comment('Current FIRS processing status');

            // FIRS Response Data
            $table->string('firs_invoice_number')->nullable()->comment('FIRS-assigned invoice number');
            $table->string('firs_reference')->nullable()->comment('FIRS transaction reference');
            $table->string('firs_irn')->nullable()->comment('FIRS Invoice Reference Number (IRN)');
            $table->text('firs_certificate')->nullable()->comment('FIRS digital certificate data');

            // QR Code and Compliance Data
            $table->text('firs_qr_data')->nullable()->comment('FIRS QR code data for invoice verification');
            $table->json('firs_response_data')->nullable()->comment('Complete FIRS API response data');

            // FIRS Processing Timestamps
            $table->timestamp('firs_submitted_at')->nullable()->comment('When invoice was submitted to FIRS');
            $table->timestamp('firs_approved_at')->nullable()->comment('When invoice was approved by FIRS');
            $table->timestamp('firs_last_checked_at')->nullable()->comment('Last FIRS status check');

            // Error Tracking
            $table->text('firs_error_message')->nullable()->comment('Last FIRS error message if any');
            $table->json('firs_validation_errors')->nullable()->comment('FIRS validation error details');
            $table->integer('firs_retry_count')->default(0)->comment('Number of FIRS submission retries');

            // Tax Compliance Fields
            $table->decimal('firs_vat_rate', 5, 2)->nullable()->comment('VAT rate applied for FIRS');
            $table->string('firs_tax_scheme')->nullable()->comment('Tax scheme applied (e.g., VAT, WHT)');
            $table->boolean('firs_withholding_tax_applicable')->default(false)->comment('Whether WHT is applicable');

            // Add indexes for performance
            $table->index('firs_approved', 'generated_invoices_firs_approved_index');
            $table->index('firs_submitted', 'generated_invoices_firs_submitted_index');
            $table->index('firs_invoice_number', 'generated_invoices_firs_number_index');
            $table->index('firs_reference', 'generated_invoices_firs_reference_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generated_invoices', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('generated_invoices_firs_approved_index');
            $table->dropIndex('generated_invoices_firs_submitted_index');
            $table->dropIndex('generated_invoices_firs_number_index');
            $table->dropIndex('generated_invoices_firs_reference_index');

            // Drop columns
            $table->dropColumn([
                'firs_submitted',
                'firs_approved',
                'firs_status',
                'firs_invoice_number',
                'firs_reference',
                'firs_irn',
                'firs_certificate',
                'firs_qr_data',
                'firs_response_data',
                'firs_submitted_at',
                'firs_approved_at',
                'firs_last_checked_at',
                'firs_error_message',
                'firs_validation_errors',
                'firs_retry_count',
                'firs_vat_rate',
                'firs_tax_scheme',
                'firs_withholding_tax_applicable'
            ]);
        });
    }
};
