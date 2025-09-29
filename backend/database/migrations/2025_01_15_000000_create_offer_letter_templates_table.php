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
        Schema::create('offer_letter_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('job_category_id')->constrained('job_structures')->onDelete('cascade');
            $table->foreignId('pay_grade_id')->constrained('pay_grade_structures')->onDelete('cascade');

            // Template configuration
            $table->json('header_config')->nullable(); // logo, date, company_info settings
            $table->json('sections')->nullable(); // Template sections array
            $table->json('footer_config')->nullable(); // signature_section, acknowledgment_section, acceptance_section
            $table->json('variables')->nullable(); // Template variables array

            // Template metadata
            $table->enum('status', ['draft', 'active', 'archived'])->default('active');
            $table->text('description')->nullable();
            $table->json('smart_elements')->nullable(); // Smart element configurations

            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Ensure one template per grade combination
            $table->unique(['client_id', 'job_category_id', 'pay_grade_id'], 'unique_offer_letter_per_grade');

            // Indexes
            $table->index(['client_id', 'status']);
            $table->index(['job_category_id', 'status']);
            $table->index(['pay_grade_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offer_letter_templates');
    }
};
