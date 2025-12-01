<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migration: Create recruitment_hierarchy table for role-based permissions
     * 
     * PURPOSE: Store configurable permissions for recruitment and boarding operations
     * per role. This allows Super Admin to control which roles can:
     * - Create recruitment requests without approval
     * - Approve recruitment requests
     * - Assign tickets to subordinates
     * - Board staff without needing approval
     * - Approve staff boarding
     * 
     * HIERARCHY LEVELS:
     * Lower number = higher authority (1-99)
     * - Level 1: Global Admin, Super Admin (highest authority)
     * - Level 2: Recruitment, Regional Manager
     * - Level 3: HR
     * - Level 5: Assistants (lowest authority)
     */
    public function up(): void
    {
        Schema::create('recruitment_hierarchy', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('role_id')->unique();

            // Permission flags
            $table->boolean('can_create_request')->default(false)
                ->comment('Can create recruitment request without approval');
            $table->boolean('can_approve_request')->default(false)
                ->comment('Can approve recruitment requests');
            $table->boolean('can_assign_ticket')->default(false)
                ->comment('Can assign tickets to subordinates');
            $table->boolean('can_board_without_approval')->default(false)
                ->comment('Can board staff without needing approval');
            $table->boolean('can_approve_boarding')->default(false)
                ->comment('Can approve staff boarding');

            // Hierarchy level (1-99, lower = higher authority)
            $table->integer('hierarchy_level')->default(99)
                ->comment('1=Highest authority (Global Admin), 99=Lowest');

            $table->timestamps();

            // Indexes
            $table->index('hierarchy_level', 'idx_recruitment_hierarchy_level');
            $table->index('role_id', 'idx_recruitment_hierarchy_role_id');

            // Foreign key - commented out due to missing index on roles table
            // Will be added manually or in separate migration if needed
            // $table->foreign('role_id', 'fk_recruitment_hierarchy_role_id')
            //       ->references('id')
            //       ->on('roles')
            //       ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitment_hierarchy');
    }
};
