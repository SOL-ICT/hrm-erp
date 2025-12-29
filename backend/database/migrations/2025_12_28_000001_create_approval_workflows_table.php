<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Create approval_workflows table
 * 
 * Purpose:
 * Define approval workflows for each module. Each workflow represents a specific
 * approval process with defined levels/steps. Workflows are reusable templates
 * that determine who approves what and in what order.
 * 
 * Key Design Decisions:
 * - Module-Specific: Each module (boarding, contracts, claims) defines its own workflows
 * - Workflow Types: Sequential (step-by-step), Parallel (all at once), Conditional (based on criteria)
 * - Activation Conditions: JSON field stores rules for when this workflow applies
 *   Example: {"amount": {"min": 0, "max": 10000}} for claims under 10k
 * - Workflow Code: Unique identifier (e.g., STAFF_BOARDING_2LEVEL, CONTRACT_NEW_PERMANENT)
 * 
 * Module-Specific Workflows:
 * - Boarding: Auto-approval (0 levels), Supervisor+Control (2 levels), Director+Control (2 levels)
 * - Contracts: HR Review, HR+Legal Review, Full Executive Approval
 * - Claims: Manager Only, Manager+Finance, Finance+Executive
 * 
 * Each module queries this table filtered by module_name to get available workflows.
 * 
 * NOTE: This migration MUST run BEFORE approvals migration since approvals has FK to workflows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_workflows', function (Blueprint $table) {
            // Core identification
            $table->id();
            $table->string('workflow_name', 255)->comment('Display name (e.g., "Staff Boarding - Supervisor + Control")');
            $table->string('workflow_code', 100)->unique()->comment('Unique identifier (e.g., STAFF_BOARDING_2LEVEL)');
            
            // Module association
            $table->string('module_name', 100)->comment('Module this workflow belongs to (boarding, contracts, claims, etc)');
            $table->string('approval_type', 100)->comment('Specific approval type within module (staff_boarding, contract_creation, claim_submission)');
            
            // Workflow configuration
            $table->enum('workflow_type', [
                'sequential',   // Steps must be completed in order (Level 1 → Level 2 → Level 3)
                'parallel',     // All levels can approve simultaneously
                'conditional'   // Next level determined by conditions/results
            ])->default('sequential')->comment('How approval levels are processed');
            
            $table->integer('total_levels')->default(1)->comment('Number of approval levels in this workflow');
            
            // Activation rules
            $table->json('activation_conditions')->nullable()->comment('JSON rules for when this workflow applies. Example: {"amount": {"min": 0, "max": 10000}, "priority": ["low", "medium"]}');
            
            // Status and priority
            $table->boolean('is_active')->default(true)->comment('Whether this workflow is currently in use');
            $table->integer('priority')->default(0)->comment('Higher priority workflows are checked first when multiple match');
            
            // Metadata
            $table->text('description')->nullable()->comment('Detailed description of when and how to use this workflow');
            $table->json('metadata')->nullable()->comment('Additional configuration (notifications, escalation rules, etc)');
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes()->comment('Soft delete to preserve historical workflow references');
            
            // Indexes for performance
            $table->index('module_name', 'idx_workflows_module');
            $table->index(['module_name', 'approval_type'], 'idx_workflows_module_type');
            $table->index('is_active', 'idx_workflows_active');
            $table->index('workflow_code', 'idx_workflows_code');
        });
        
        // Add helpful comment to table
        DB::statement("ALTER TABLE approval_workflows COMMENT = 'Reusable approval workflow templates per module. Each workflow defines the sequence of approval levels and activation conditions. Referenced by approvals table via workflow_id.'");
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_workflows');
    }
};
