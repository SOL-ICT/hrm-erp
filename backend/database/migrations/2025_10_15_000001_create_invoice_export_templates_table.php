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
        Schema::create('invoice_export_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->string('template_name');
            $table->text('description')->nullable();

            // Export line items (JSON)
            // Each line item: { name, formula_type, formula, depends_on, order }
            $table->json('line_items')->nullable();

            // Excel formatting options
            $table->json('excel_settings')->nullable(); // headers, styling, etc.

            // Sheet configuration
            $table->boolean('include_summary_sheet')->default(true);
            $table->boolean('include_breakdown_sheet')->default(true);

            // Active status
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('client_id')
                ->references('id')
                ->on('clients')
                ->onDelete('cascade');

            // Index for quick lookup
            $table->index(['client_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_export_templates');
    }
};
