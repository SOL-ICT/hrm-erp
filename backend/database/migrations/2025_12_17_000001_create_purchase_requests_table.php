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
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_code', 50)->unique()->comment('PR-YYYY-NNNN');
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->string('branch', 100);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            
            // Status tracking
            $table->enum('status', ['pending', 'reviewed', 'approved', 'rejected', 'completed', 'cancelled'])->default('pending');
            $table->enum('admin_status', ['pending', 'reviewed', 'approved', 'rejected'])->default('pending');
            $table->enum('finance_status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Justification
            $table->text('justification')->nullable();
            
            // Amounts
            $table->decimal('total_amount', 15, 2);
            
            // Review tracking
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('reviewed_at')->nullable();
            $table->text('review_comments')->nullable();
            
            // Approval tracking
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('approved_at')->nullable();
            $table->text('approval_comments')->nullable();
            
            // Rejection tracking
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Completion tracking (when procurement is logged)
            $table->datetime('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Dates
            $table->date('required_date');
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('admin_status');
            $table->index('finance_status');
            $table->index('requested_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
