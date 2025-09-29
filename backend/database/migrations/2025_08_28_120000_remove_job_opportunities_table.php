<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // First, remove the legacy job_application_id column from interview_invitations
        // since it already has recruitment_request_id as the primary reference
        if (Schema::hasTable('interview_invitations') && Schema::hasColumn('interview_invitations', 'job_application_id')) {
            Schema::table('interview_invitations', function (Blueprint $table) {
                $table->dropForeign(['job_application_id']);
                $table->dropColumn('job_application_id');
            });
        }
        
        // Remove job_application_id from recruitment_applications if it exists
        if (Schema::hasTable('recruitment_applications') && Schema::hasColumn('recruitment_applications', 'job_application_id')) {
            Schema::table('recruitment_applications', function (Blueprint $table) {
                $table->dropForeign(['job_application_id']);
                $table->dropColumn('job_application_id');
            });
        }
        
        // Drop the job_interviews table if it exists
        if (Schema::hasTable('job_interviews')) {
            Schema::table('job_interviews', function (Blueprint $table) {
                $table->dropForeign(['job_application_id']);
            });
            Schema::dropIfExists('job_interviews');
        }
        
        // Drop the job_applications table if it exists
        Schema::dropIfExists('job_applications');
        
        // Finally drop the job_opportunities table if it exists
        Schema::dropIfExists('job_opportunities');
        
        // Note: interview_invitations now uses only recruitment_request_id for proper workflow
        // candidate_job_applications already exists and uses recruitment_requests properly
    }

    public function down(): void
    {
        // Recreate job_opportunities table if needed (rollback)
        Schema::create('job_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('job_category_id')->nullable()->constrained('job_categories')->onDelete('set null');
            $table->string('job_code', 50)->unique();
            $table->string('title');
            $table->string('slug');
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->decimal('salary_range_min', 12, 2)->nullable();
            $table->decimal('salary_range_max', 12, 2)->nullable();
            $table->string('salary_currency', 3)->default('NGN');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'temporary'])->default('full_time');
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'executive'])->default('entry');
            $table->string('location');
            $table->foreignId('state_lga_id')->nullable()->constrained('states_lgas')->onDelete('set null');
            $table->date('application_deadline');
            $table->integer('positions_available')->default(1);
            $table->enum('status', ['draft', 'active', 'paused', 'closed'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // Recreate job_applications table
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_opportunity_id')->constrained('job_opportunities')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->longText('cover_letter')->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->date('available_start_date')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'])->default('pending');
            $table->longText('notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('application_source', ['website', 'referral', 'agency', 'social_media', 'other'])->default('website');
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamps();
        });
    }
};
