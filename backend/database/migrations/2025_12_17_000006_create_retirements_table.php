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
        Schema::create('retirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advance_id')->constrained('advances')->restrictOnDelete();
            $table->string('retirement_code', 50)->unique()->comment('RET-YYYY-NNNN');
            
            // Amounts
            $table->decimal('advance_amount', 15, 2);
            $table->decimal('total_spent', 15, 2);
            $table->decimal('balance', 15, 2)->comment('Can be negative (excess) or positive (return)');
            
            // Documents (JSON arrays of file paths)
            $table->json('receipt_documents')->nullable();
            $table->json('supporting_documents')->nullable();
            
            // Retirement details
            $table->text('retirement_summary');
            
            // Status
            $table->enum('status', [
                'submitted',
                'under_review',
                'approved',
                'queried',
                'rejected'
            ])->default('submitted');
            
            // Review tracking
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('reviewed_at')->nullable();
            $table->text('review_comments')->nullable();
            
            // Query/Rejection
            $table->text('query_reason')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('advance_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retirements');
    }
};
