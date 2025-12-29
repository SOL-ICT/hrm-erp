<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approval_policies table - rule-based approval routing
     * 
     * This table stores business rules that determine which workflow to use
     * based on conditions like amount thresholds, priority, department, etc.
     * 
     * Example: Claims over ₦100,000 require Finance Manager + CEO approval
     *          Claims under ₦100,000 require only immediate supervisor
     */
    public function up(): void
    {
        Schema::create('approval_policies', function (Blueprint $table) {
            $table->id();
            
            // Policy identification
            $table->string('policy_name', 200);
            $table->string('policy_code', 50)->unique();
            
            // Scope
            $table->string('module_name', 100);
            $table->string('approval_type', 100);
            $table->text('description')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Rule definition (JSON)
            $table->json('rules')->comment('Conditions: {"amount_threshold": 100000, "priority": "high", "bypass_roles": [1, 2]}');
            
            // Workflow assignment
            $table->unsignedBigInteger('workflow_id')->nullable()->comment('Workflow to use when rules match');
            
            // Priority for rule evaluation order (lower number = higher priority)
            $table->integer('priority')->default(0)->comment('Policies evaluated in priority order');
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('workflow_id')->references('id')->on('approval_workflows')->onDelete('set null');
            
            // Indexes
            $table->index(['module_name', 'approval_type'], 'idx_module_type');
            $table->index('is_active', 'idx_is_active');
            $table->index('priority', 'idx_priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_policies');
    }
};
