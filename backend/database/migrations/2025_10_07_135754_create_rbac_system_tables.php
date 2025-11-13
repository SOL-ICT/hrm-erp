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
        // 1. Modules Table (Main system modules)
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable(); // For dashboard icons
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Submodules Table (Features within modules)
        Schema::create('submodules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('route')->nullable(); // Frontend route/URL
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['module_id', 'slug'], 'unique_module_submodule');
        });

        // 3. Permissions Table (Individual permissions)
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submodule_id')->constrained('submodules')->onDelete('cascade');
            $table->string('name'); // read, write, delete, full
            $table->string('slug'); // read, write, delete, full
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['submodule_id', 'slug'], 'unique_submodule_permission');
        });

        // 4. Role Permissions Table (Many-to-many relationship)
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->foreignId('granted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('granted_at')->useCurrent();
            $table->timestamps();

            $table->unique(['role_id', 'permission_id'], 'unique_role_permission');
        });

        // 5. User Permissions Table (Direct user permissions - overrides)
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

        // Create indexes for performance
        Schema::table('submodules', function (Blueprint $table) {
            $table->index('module_id', 'idx_submodules_module_id');
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->index('submodule_id', 'idx_permissions_submodule_id');
        });

        Schema::table('role_permissions', function (Blueprint $table) {
            $table->index('role_id', 'idx_role_permissions_role_id');
            $table->index('permission_id', 'idx_role_permissions_permission_id');
        });

        Schema::table('user_permissions', function (Blueprint $table) {
            $table->index('user_id', 'idx_user_permissions_user_id');
            $table->index('permission_id', 'idx_user_permissions_permission_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('submodules');
        Schema::dropIfExists('modules');
    }
};
