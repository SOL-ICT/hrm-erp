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
        Schema::create('staff_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('old_job_structure_id')->constrained('job_structures')->onDelete('cascade');
            $table->foreignId('old_pay_grade_structure_id')->constrained('pay_grade_structures')->onDelete('cascade');
            $table->foreignId('new_job_structure_id')->constrained('job_structures')->onDelete('cascade');
            $table->foreignId('new_pay_grade_structure_id')->constrained('pay_grade_structures')->onDelete('cascade');
            $table->date('effective_date');
            $table->json('old_emoluments')->comment('Snapshot of old emoluments');
            $table->json('new_emoluments')->comment('Snapshot of new emoluments');
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_promotions');
    }
};
