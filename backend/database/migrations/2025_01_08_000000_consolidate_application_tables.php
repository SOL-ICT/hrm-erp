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
        // Step 1: Check if we have any data to migrate
        $legacyCount = DB::table('recruitment_applications')->count();
        $emptyJobApps = DB::table('job_applications')->count();
        
        echo "Found {$legacyCount} records in recruitment_applications\n";
        echo "Found {$emptyJobApps} records in job_applications\n";
        
        if ($legacyCount > 0) {
            // Step 2: Migrate data from recruitment_applications to candidate_job_applications
            // Avoid duplicates by checking existing combinations
            $migratedCount = DB::statement("
                INSERT INTO candidate_job_applications (
                    candidate_id,
                    recruitment_request_id,
                    application_status,
                    cover_letter,
                    salary_expectations,
                    applied_at,
                    created_at,
                    updated_at,
                    meets_location_criteria,
                    meets_age_criteria,
                    meets_experience_criteria,
                    eligibility_score,
                    motivation,
                    last_status_change
                )
                SELECT 
                    ra.candidate_id,
                    ra.recruitment_request_id,
                    CASE ra.status
                        WHEN 'pending' THEN 'applied'
                        WHEN 'reviewing' THEN 'under_review'
                        WHEN 'shortlisted' THEN 'under_review'
                        WHEN 'interviewed' THEN 'interview_completed'
                        WHEN 'offered' THEN 'accepted'
                        WHEN 'hired' THEN 'accepted'
                        WHEN 'rejected' THEN 'rejected'
                        WHEN 'withdrawn' THEN 'rejected'
                        ELSE 'applied'
                    END as application_status,
                    ra.cover_letter,
                    CASE 
                        WHEN ra.expected_salary IS NOT NULL 
                        THEN JSON_OBJECT('min', ra.expected_salary, 'currency', 'NGN')
                        ELSE NULL
                    END as salary_expectations,
                    COALESCE(ra.applied_at, ra.created_at) as applied_at,
                    ra.created_at,
                    ra.updated_at,
                    -- Default eligibility to true for legacy data (we don't have criteria info)
                    true as meets_location_criteria,
                    true as meets_age_criteria,
                    true as meets_experience_criteria,
                    100 as eligibility_score,
                    COALESCE(ra.notes, 'Migrated from legacy recruitment_applications table') as motivation,
                    COALESCE(ra.reviewed_at, ra.updated_at) as last_status_change
                FROM recruitment_applications ra
                WHERE NOT EXISTS (
                    -- Avoid duplicates if candidate already applied via new system
                    SELECT 1 FROM candidate_job_applications cja 
                    WHERE ra.candidate_id = cja.candidate_id 
                    AND ra.recruitment_request_id = cja.recruitment_request_id
                )
            ");
            
            echo "Migrated records from recruitment_applications to candidate_job_applications\n";
        }
        
        // Step 3: Create a backup table for recruitment_applications before dropping
        DB::statement('CREATE TABLE recruitment_applications_backup AS SELECT * FROM recruitment_applications');
        echo "Created backup table: recruitment_applications_backup\n";
        
        // Step 4: Drop the legacy tables (we'll do this in a separate migration for safety)
        // Schema::dropIfExists('recruitment_applications');
        // Schema::dropIfExists('job_applications');
        
        echo "Migration completed. Legacy tables backed up but not yet dropped.\n";
        echo "Run the next migration to drop legacy tables after verifying data integrity.\n";
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore from backup if it exists
        if (Schema::hasTable('recruitment_applications_backup')) {
            Schema::dropIfExists('recruitment_applications');
            DB::statement('CREATE TABLE recruitment_applications AS SELECT * FROM recruitment_applications_backup');
            Schema::dropIfExists('recruitment_applications_backup');
            echo "Restored recruitment_applications from backup\n";
        }
        
        // Remove migrated records from candidate_job_applications
        // This is tricky - we'd need to identify which ones were migrated
        // For safety, we won't auto-delete them in rollback
        echo "Manual cleanup may be required for candidate_job_applications\n";
    }
};
