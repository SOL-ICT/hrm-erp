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
        Schema::create('staff_suspensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->text('reason');
            $table->date('suspension_start_date');
            $table->date('suspension_end_date')->nullable();
            $table->integer('suspension_days')->nullable();
            $table->enum('status', ['pending', 'active', 'lifted', 'completed'])->default('pending');
            $table->foreignId('issued_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('suspension_start_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_suspensions');
    }
};
