<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->integer('year');
            $table->integer('category_entitlement');
            $table->integer('carried_over')->default(0);
            $table->integer('used_days')->default(0);
            $table->integer('remaining_balance');
            $table->timestamps();

            $table->unique(['staff_id', 'year'], 'unique_staff_year');
            $table->index('staff_id', 'idx_staff_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};