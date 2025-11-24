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
        Schema::create('staff_terminations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->enum('termination_type', ['terminated', 'death', 'resignation']);
            $table->integer('notice_period_days')->nullable()->comment('Max 30 days');
            $table->date('termination_date');
            $table->date('transaction_date');
            $table->date('actual_relieving_date');
            $table->text('reason');
            $table->enum('exit_penalty', ['yes', 'no'])->default('no');
            $table->enum('ppe_return', ['n/a', 'yes', 'no'])->default('n/a');
            $table->enum('exit_interview', ['n/a', 'yes', 'no'])->default('n/a');
            $table->boolean('is_blacklisted')->default(false);
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('termination_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_terminations');
    }
};
