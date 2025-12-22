<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Requisition status log table for audit trail.
     * Tracks all status changes for complete history.
     */
    public function up(): void
    {
        Schema::create('requisition_status_log', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('requisition_id')
                  ->constrained('staff_requisitions')
                  ->onDelete('cascade')
                  ->comment('Related requisition');
            $table->foreignId('changed_by')
                  ->constrained('users')
                  ->comment('User who made the change');
            
            // Status change details
            $table->string('old_status', 50)->nullable()->comment('Previous status');
            $table->string('new_status', 50)->comment('New status');
            $table->text('comments')->nullable()->comment('Comments about the change');
            
            $table->timestamp('created_at')->useCurrent()->comment('When change occurred');
            
            // Indexes for performance
            $table->index('requisition_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisition_status_log');
    }
};
