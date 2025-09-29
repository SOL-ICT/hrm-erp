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
        Schema::create('candidate_job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->enum('application_status', ['applied', 'under_review', 'test_sent', 'test_completed', 'interview_scheduled', 'interview_completed', 'accepted', 'rejected'])->default('applied');
            $table->text('cover_letter')->nullable();
            $table->json('salary_expectations')->nullable(); // {min: 0, max: 0, currency: 'NGN'}
            $table->text('motivation')->nullable();
            $table->json('availability')->nullable(); // Start date, notice period, etc.
            $table->boolean('meets_location_criteria')->default(false);
            $table->boolean('meets_age_criteria')->default(false);
            $table->boolean('meets_experience_criteria')->default(false);
            $table->decimal('eligibility_score', 5, 2)->default(0.00); // Overall matching score
            $table->boolean('is_eligible')->default(false); // Whether candidate meets all eligibility criteria
            $table->timestamp('applied_at');
            $table->timestamp('last_status_change')->nullable();
            $table->json('status_history')->nullable(); // Track status changes
            $table->timestamps();
            
            $table->unique(['candidate_id', 'recruitment_request_id'], 'job_app_unique');
            $table->index(['application_status', 'applied_at'], 'job_app_status_idx');
            $table->index(['eligibility_score', 'meets_location_criteria'], 'job_app_eligibility_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_job_applications');
    }
};
