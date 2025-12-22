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
        Schema::create('retirement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('retirement_id')->constrained('retirements')->cascadeOnDelete();
            
            $table->string('description', 500);
            $table->decimal('amount', 15, 2);
            $table->string('receipt_reference', 100)->nullable();
            $table->date('transaction_date');
            
            $table->timestamps();
            
            // Index
            $table->index('retirement_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retirement_items');
    }
};
