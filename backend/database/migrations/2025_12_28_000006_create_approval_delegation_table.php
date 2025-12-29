<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Create approval_delegation table - delegation management
     * 
     * This table allows users to delegate their approval authority to others
     * during vacations, sick leave, or temporary absences.
     * 
     * Delegation can be module-specific or system-wide.
     */
    public function up(): void
    {
        Schema::create('approval_delegation', function (Blueprint $table) {
            $table->id();
            
            // Delegation parties
            $table->unsignedBigInteger('delegator_id')->comment('User delegating their authority');
            $table->unsignedBigInteger('delegate_id')->comment('User receiving the authority');
            
            // Scope of delegation
            $table->string('module_name', 100)->nullable()->comment('NULL = all modules, specific = only that module');
            $table->string('approval_type', 100)->nullable()->comment('NULL = all types, specific = only that type');
            
            // Time period
            $table->date('start_date');
            $table->date('end_date');
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Metadata
            $table->text('reason')->nullable()->comment('Vacation, sick leave, etc.');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('delegator_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('delegate_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes
            $table->index('delegate_id', 'idx_delegate_id');
            $table->index('delegator_id', 'idx_delegator_id');
            $table->index(['start_date', 'end_date'], 'idx_date_range');
            $table->index('is_active', 'idx_is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_delegation');
    }
};
