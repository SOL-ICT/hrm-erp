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
        Schema::create('advance_status_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advance_id')->constrained('advances')->cascadeOnDelete();
            
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            
            $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $table->text('comments')->nullable();
            
            $table->timestamp('created_at')->useCurrent();
            
            // Index
            $table->index('advance_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advance_status_log');
    }
};
