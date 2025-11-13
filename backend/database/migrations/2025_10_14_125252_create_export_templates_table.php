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
        Schema::create('export_templates', function (Blueprint $table) {
            $table->id();

            // Template identification
            $table->foreignId('client_id')->constrained()->comment('Client this export template belongs to');
            $table->string('name')->comment('Export template name');
            $table->text('description')->nullable()->comment('Template description');
            $table->string('version', 10)->default('1.0')->comment('Template version for change tracking');

            // Export configuration
            $table->string('format')->default('excel')->comment('Export format: excel, pdf, csv');
            $table->json('column_mappings')->comment('Column mappings and custom labels');
            $table->json('formatting_rules')->comment('Formatting rules for export');
            $table->json('grouping_rules')->nullable()->comment('Grouping and sorting rules');

            // Invoice specific settings
            $table->boolean('use_credit_to_bank_model')->default(false)->comment('Whether to use credit to bank model');
            $table->decimal('service_fee_percentage', 5, 2)->default(0.00)->comment('Service fee percentage');
            $table->json('fee_calculation_rules')->nullable()->comment('Rules for fee calculation');

            // Branding and styling
            $table->json('header_config')->nullable()->comment('Header configuration (logo, company info)');
            $table->json('footer_config')->nullable()->comment('Footer configuration');
            $table->json('styling_config')->nullable()->comment('Colors, fonts, and styling');

            // Metadata
            $table->boolean('is_active')->default(true)->comment('Whether template is active');
            $table->boolean('is_default')->default(false)->comment('Whether this is the default template for the client');
            $table->string('created_by')->comment('User who created this template');
            $table->string('updated_by')->nullable()->comment('User who last updated this template');
            $table->timestamp('last_used_at')->nullable()->comment('When this template was last used');

            // Audit trail
            $table->timestamps();

            // Indexes
            $table->index('client_id');
            $table->index(['client_id', 'is_active', 'is_default']);
            $table->index('last_used_at');
            $table->index('format');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('export_templates');
    }
};
