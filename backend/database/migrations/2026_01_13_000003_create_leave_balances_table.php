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
        // Skip if table already exists
        if (Schema::hasTable('leave_balances')) {
            return;
        }

        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('leave_type_id');
            $table->integer('year');
            
            // Entitlement and usage tracking
            $table->decimal('entitled_days', 8, 2);
            $table->decimal('used_days', 8, 2)->default(0);
            $table->decimal('carryover_days', 8, 2)->default(0);
            $table->decimal('available_balance', 8, 2);
            
            // Renewal frequency for tracking
            $table->enum('renewal_frequency', ['ANNUAL', 'BIANNUAL', 'NONE'])->default('ANNUAL');
            
            // Effective dates for the entitlement
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('leave_type_id')->references('id')->on('lpe_leave_types')->onDelete('cascade');
            
            // Unique constraint - only one balance per staff per leave type per year
            $table->unique(['staff_id', 'leave_type_id', 'year'], 'uk_leave_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
