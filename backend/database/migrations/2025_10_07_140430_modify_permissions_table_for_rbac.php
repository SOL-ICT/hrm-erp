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
        // Modify permissions table to match RBAC structure
        Schema::table('permissions', function (Blueprint $table) {
            // Drop old columns that don't match our RBAC design
            $table->dropColumn(['display_name', 'module']);

            // Add new columns for RBAC
            $table->foreignId('submodule_id')->after('id')->constrained('submodules')->onDelete('cascade');
            $table->string('slug')->after('name');

            // Modify existing columns
            $table->string('name')->change(); // Ensure it's varchar(255)

            // Add unique constraint
            $table->unique(['submodule_id', 'slug'], 'unique_submodule_permission');
        });

        // Create user_permissions table for direct user permission overrides
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->boolean('granted')->default(true); // TRUE = granted, FALSE = denied (override)
            $table->foreignId('granted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('granted_at')->useCurrent();
            $table->timestamp('expires_at')->nullable(); // Optional expiration
            $table->timestamps();

            $table->unique(['user_id', 'permission_id'], 'unique_user_permission');
        });

        // Add missing primary key to permissions if needed
        Schema::table('permissions', function (Blueprint $table) {
            // Check if id column needs to be made auto-increment primary key
            $table->id()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop user_permissions table
        Schema::dropIfExists('user_permissions');

        // Revert permissions table changes
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropForeign(['submodule_id']);
            $table->dropUnique('unique_submodule_permission');
            $table->dropColumn(['submodule_id', 'slug']);

            // Add back old columns
            $table->string('display_name')->after('name');
            $table->string('module')->after('description');
        });
    }
};
