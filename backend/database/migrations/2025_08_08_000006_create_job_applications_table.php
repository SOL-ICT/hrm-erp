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
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_opportunity_id');
            $table->unsignedBigInteger('candidate_id');
            $table->longText('cover_letter')->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->date('available_start_date')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'])->default('pending');
            $table->longText('notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('application_source', ['website', 'referral', 'agency', 'social_media', 'other'])->default('website');
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamps();

            $table->foreign('job_opportunity_id')->references('id')->on('job_opportunities')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['job_opportunity_id', 'candidate_id']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
