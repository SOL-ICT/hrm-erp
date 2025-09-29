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
        Schema::create('invoice_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('pay_grade_structure_id')->constrained('pay_grade_structures')->onDelete('cascade');
            $table->string('template_name');
            $table->text('description')->nullable();

            // Template Configuration
            $table->json('custom_components'); // Store allowance components with their configurations
            $table->json('statutory_components'); // Store statutory components settings
            $table->json('calculation_rules')->nullable(); // Store formula rules and dependencies

            // Credit to Bank Model Settings
            $table->boolean('use_credit_to_bank_model')->default(true);
            $table->decimal('service_fee_percentage', 5, 2)->default(0.00); // Our service fee percentage

            // Attendance Calculation Settings
            $table->enum('attendance_calculation_method', ['working_days', 'calendar_days'])->default('working_days');
            $table->boolean('prorate_salary')->default(true); // Whether to prorate based on attendance
            $table->decimal('minimum_attendance_factor', 3, 2)->default(0.00); // Minimum factor (e.g., 0.5 for 50%)

            // Template Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false); // One default template per client-grade combination

            // Metadata
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamp('last_used_at')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['client_id', 'pay_grade_structure_id']);
            $table->index(['is_active', 'is_default']);

            // Unique constraint for default templates
            $table->unique(['client_id', 'pay_grade_structure_id', 'is_default'], 'unique_default_template');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_templates');
    }
};
