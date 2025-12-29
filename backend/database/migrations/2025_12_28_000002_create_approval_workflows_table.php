<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approval_workflows table - stores workflow definitions
     * 
     * This table defines approval workflows for different modules and approval types.
     * Examples: STAFF_BOARDING_2LEVEL, CLAIM_HIGH_VALUE, CONTRACT_LEGAL_REVIEW
     * 
     * Workflow types:
     * - sequential: One level at a time (Level 1 → Level 2 → Level 3)
     * - parallel: Multiple approvers at same level (all must approve)
     * - conditional: Dynamic routing based on rules
     */
    public function up(): void
    {
        Schema::create('approval_workflows', function (Blueprint $table) {
            $table->id();
            
            // Workflow identification
            $table->string('workflow_name', 200);
            $table->string('workflow_code', 50)->unique()->comment('Unique code like STAFF_BOARDING_2LEVEL');
            $table->string('module_name', 100)->comment('Module: recruitment, claims, contracts, etc.');
            $table->string('approval_type', 100)->comment('Type: staff_boarding, claim_submission, etc.');
            
            // Workflow configuration
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Workflow type
            $table->enum('workflow_type', ['sequential', 'parallel', 'conditional'])->default('sequential');
            
            // Total levels in workflow
            $table->integer('total_levels')->default(1);
            
            // Conditions for workflow activation (JSON)
            // Example: {"amount_threshold": 100000, "department": "Finance"}
            $table->json('activation_conditions')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['module_name', 'approval_type'], 'idx_module_type');
            $table->index('is_active', 'idx_is_active');
            $table->index('workflow_code', 'idx_workflow_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_workflows');
    }
};
