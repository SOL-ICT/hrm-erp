<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // First, let's add the new recruitment_request_id column
        Schema::table('job_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('recruitment_request_id')->nullable()->after('job_opportunity_id');
            $table->index('recruitment_request_id');
        });

        // Copy data from job_opportunities to recruitment_requests if needed
        // and update job_applications to reference recruitment_requests
        DB::statement('
            UPDATE job_applications ja
            LEFT JOIN job_opportunities jo ON ja.job_opportunity_id = jo.id
            LEFT JOIN recruitment_requests rr ON (
                rr.client_id = jo.client_id 
                AND rr.status = "active"
                AND (rr.description LIKE CONCAT("%", jo.title, "%") OR jo.title LIKE CONCAT("%", rr.description, "%"))
            )
            SET ja.recruitment_request_id = rr.id
            WHERE rr.id IS NOT NULL
        ');

        // For job_applications that couldn't be matched, we'll need to create corresponding recruitment_requests
        // This query finds unmatched applications
        $unmatchedApplications = DB::select('
            SELECT DISTINCT ja.job_opportunity_id, jo.* 
            FROM job_applications ja 
            JOIN job_opportunities jo ON ja.job_opportunity_id = jo.id 
            WHERE ja.recruitment_request_id IS NULL
        ');

        // Create recruitment_requests for unmatched job_opportunities
        foreach ($unmatchedApplications as $jobOpp) {
            $recruitmentRequestId = DB::table('recruitment_requests')->insertGetId([
                'ticket_id' => 'MIGR-' . str_pad($jobOpp->id, 6, '0', STR_PAD_LEFT),
                'status' => $jobOpp->status === 'active' ? 'active' : 'closed',
                'client_id' => $jobOpp->client_id,
                'service_request_id' => 1, // Default service request - adjust as needed
                'job_structure_id' => 1, // Default job structure - adjust as needed
                'service_location_id' => 1, // Default location - adjust as needed
                'number_of_vacancies' => $jobOpp->number_of_vacancies ?? 1,
                'salary_range_min' => $jobOpp->salary_range_min,
                'salary_range_max' => $jobOpp->salary_range_max,
                'description' => $jobOpp->title . "\n\n" . ($jobOpp->description ?? ''),
                'special_requirements' => $jobOpp->requirements,
                'created_at' => $jobOpp->created_at,
                'updated_at' => $jobOpp->updated_at,
            ]);

            // Update job_applications to reference the new recruitment_request
            DB::table('job_applications')
                ->where('job_opportunity_id', $jobOpp->id)
                ->update(['recruitment_request_id' => $recruitmentRequestId]);
        }

        // Now make recruitment_request_id required and remove job_opportunity_id
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropForeign(['job_opportunity_id']);
            $table->dropColumn('job_opportunity_id');
            $table->unsignedBigInteger('recruitment_request_id')->nullable(false)->change();
            $table->foreign('recruitment_request_id')->references('id')->on('recruitment_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // Rollback - restore job_opportunity_id column
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropForeign(['recruitment_request_id']);
            $table->unsignedBigInteger('job_opportunity_id')->nullable()->after('id');
            $table->index('job_opportunity_id');
        });

        // Restore foreign key constraint
        Schema::table('job_applications', function (Blueprint $table) {
            $table->foreign('job_opportunity_id')->references('id')->on('job_opportunities')->onDelete('cascade');
            $table->dropColumn('recruitment_request_id');
        });
    }
};
