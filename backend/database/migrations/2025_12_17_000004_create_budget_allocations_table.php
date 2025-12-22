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
        Schema::create('budget_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            
            // Budget details
            $table->integer('fiscal_year');
            $table->enum('budget_period', ['annual', 'quarterly', 'monthly'])->default('annual');
            $table->decimal('allocated_amount', 15, 2);
            $table->decimal('utilized_amount', 15, 2)->default(0);
            $table->decimal('available_amount', 15, 2);
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Tracking
            $table->foreignId('allocated_by')->constrained('users')->restrictOnDelete();
            
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['user_id', 'fiscal_year', 'budget_period'], 'unique_user_year_period');
            
            // Indexes
            $table->index('user_id');
            $table->index('fiscal_year');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_allocations');
    }
};
