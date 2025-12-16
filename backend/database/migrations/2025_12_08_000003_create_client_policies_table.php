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
        Schema::create('client_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->decimal('policy_aggregate_limit', 15, 2)->default(0)->comment('Total aggregate policy limit');
            $table->decimal('policy_single_limit', 15, 2)->default(0)->comment('Single occurrence limit');
            $table->date('policy_start_date')->nullable();
            $table->date('policy_end_date')->nullable();
            $table->string('policy_number')->nullable();
            $table->string('insurer_name')->nullable()->comment('Insurance company name');
            $table->enum('status', ['active', 'expired', 'suspended'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('client_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_policies');
    }
};
