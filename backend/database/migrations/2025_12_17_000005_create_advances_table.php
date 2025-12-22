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
        Schema::create('advances', function (Blueprint $table) {
            $table->id();
            $table->string('advance_code', 50)->unique()->comment('ADV-YYYY-NNNN');
            
            // Requester details
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('office', 100);
            
            // Advance details
            $table->decimal('amount', 15, 2);
            $table->enum('budget_line', [
                'administrative_expenses',
                'procurement',
                'training_development',
                'transportation',
                'communication',
                'maintenance',
                'other'
            ]);
            $table->string('purpose', 500);
            $table->text('justification');
            
            // Status tracking
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'disbursed',
                'retired',
                'overdue',
                'cancelled'
            ])->default('pending');
            
            // Approval tracking
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('approved_at')->nullable();
            $table->text('approval_comments')->nullable();
            
            // Rejection tracking
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Disbursement tracking
            $table->foreignId('disbursed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('disbursed_at')->nullable();
            $table->string('disbursement_reference', 100)->nullable();
            
            // Retirement tracking
            $table->date('retirement_due_date')->nullable();
            $table->datetime('retired_at')->nullable();
            $table->boolean('is_overdue')->default(false);
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('retirement_due_date');
            $table->index('is_overdue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advances');
    }
};
