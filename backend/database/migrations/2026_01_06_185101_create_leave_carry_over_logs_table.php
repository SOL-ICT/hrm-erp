<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_carry_over_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->integer('from_year');
            $table->integer('to_year');
            $table->integer('days_available');
            $table->integer('days_transferred');
            $table->integer('days_discarded');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['staff_id', 'from_year'], 'idx_staff_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_carry_over_logs');
    }
};