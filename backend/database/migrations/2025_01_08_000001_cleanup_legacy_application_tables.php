<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        echo "Starting cleanup of legacy application tables...\n";
        
        // Step 1: Verify migration was successful by checking record counts
        $candidateAppCount = DB::table('candidate_job_applications')->count();
        $backupCount = DB::table('recruitment_applications_backup')->count();
        $legacyCount = DB::table('recruitment_applications')->count();
        $emptyJobApps = DB::table('job_applications')->count();
        
        echo "Verification:\n";
        echo "- candidate_job_applications: {$candidateAppCount} records\n";
        echo "- recruitment_applications_backup: {$backupCount} records\n";
        echo "- recruitment_applications: {$legacyCount} records\n";
        echo "- job_applications: {$emptyJobApps} records\n";
        
        // Ensure we have backup and new records before dropping
        if ($candidateAppCount >= 3 && $backupCount === 3) {
            
            // Step 2: Drop legacy tables (they're backed up)
            echo "Dropping legacy tables...\n";
            
            // Drop foreign key constraints safely (check if they exist first)
            try {
                if (Schema::hasTable('interview_invitations') && Schema::hasColumn('interview_invitations', 'job_application_id')) {
                    Schema::table('interview_invitations', function (Blueprint $table) {
                        $table->dropForeign(['job_application_id']);
                    });
                }
            } catch (\Exception $e) {
                echo "Note: interview_invitations foreign key already removed or doesn't exist\n";
            }
            
            try {
                if (Schema::hasTable('job_interviews') && Schema::hasColumn('job_interviews', 'job_application_id')) {
                    Schema::table('job_interviews', function (Blueprint $table) {
                        $table->dropForeign(['job_application_id']);
                    });
                }
            } catch (\Exception $e) {
                echo "Note: job_interviews foreign key already removed or doesn't exist\n";
            }
            
            try {
                if (Schema::hasTable('recruitment_applications') && Schema::hasColumn('recruitment_applications', 'job_application_id')) {
                    Schema::table('recruitment_applications', function (Blueprint $table) {
                        $table->dropForeign(['job_application_id']);
                    });
                }
            } catch (\Exception $e) {
                echo "Note: recruitment_applications foreign key already removed or doesn't exist\n";
            }
            
            // Now drop the tables
            Schema::dropIfExists('recruitment_applications');
            Schema::dropIfExists('job_applications');
            
            echo "Legacy tables dropped successfully!\n";
            
            // Step 3: Update column constraints and indexes on candidate_job_applications
            Schema::table('candidate_job_applications', function (Blueprint $table) {
                $table->index(['recruitment_request_id', 'candidate_id'], 'cja_recruitment_candidate_idx');
                $table->index(['application_status'], 'cja_status_idx');
                $table->index(['applied_at'], 'cja_applied_at_idx');
            });
            
            echo "Added performance indexes to candidate_job_applications\n";
            
        } else {
            echo "SAFETY CHECK FAILED: Migration verification failed. Not dropping tables.\n";
            echo "Expected: candidate_job_applications >= 3, backup = 3\n";
            echo "Found: candidate_job_applications = {$candidateAppCount}, backup = {$backupCount}\n";
        }
        
        echo "Legacy application table cleanup completed!\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate job_applications table
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->longText('cover_letter')->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->date('available_start_date')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'])->default('pending');
            $table->longText('notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('application_source', ['website', 'referral', 'agency', 'social_media', 'other'])->default('website');
            $table->timestamp('applied_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamps();
        });
        
        // Restore recruitment_applications from backup if it exists
        if (Schema::hasTable('recruitment_applications_backup')) {
            DB::statement('CREATE TABLE recruitment_applications AS SELECT * FROM recruitment_applications_backup');
            echo "Restored recruitment_applications from backup\n";
        }
        
        // Remove indexes from candidate_job_applications
        Schema::table('candidate_job_applications', function (Blueprint $table) {
            $table->dropIndex('cja_recruitment_candidate_idx');
            $table->dropIndex('cja_status_idx');
            $table->dropIndex('cja_applied_at_idx');
        });
        
        echo "Rollback completed - legacy tables restored\n";
    }
};
