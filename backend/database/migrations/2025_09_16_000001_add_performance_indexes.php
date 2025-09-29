<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add indexes for frequently queried columns
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'idx_status_created_at');
            $table->index(['client_id', 'status'], 'idx_client_status');
            $table->index(['status', 'recruitment_period_end'], 'idx_status_period_end');
            $table->index('created_at', 'idx_created_at');
        });

        Schema::table('candidate_job_applications', function (Blueprint $table) {
            $table->index(['recruitment_request_id', 'application_status'], 'idx_recruitment_status');
            $table->index('candidate_id', 'idx_candidate_id');
            $table->index('created_at', 'idx_created_at');
        });

        Schema::table('test_assignments', function (Blueprint $table) {
            $table->index(['candidate_id', 'status'], 'idx_candidate_status');
            $table->index(['recruitment_request_id', 'status'], 'idx_recruitment_status');
            $table->index('assigned_at', 'idx_assigned_at');
        });

        Schema::table('test_results', function (Blueprint $table) {
            $table->index(['candidate_id', 'test_id'], 'idx_candidate_test');
            $table->index('completed_at', 'idx_completed_at');
        });

        Schema::table('interview_invitations', function (Blueprint $table) {
            $table->index(['candidate_id', 'status'], 'idx_candidate_status');
            $table->index(['recruitment_request_id', 'status'], 'idx_recruitment_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('username', 'idx_username');
            $table->index('email', 'idx_email');
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->index('email', 'idx_email');
            $table->index(['first_name', 'last_name'], 'idx_full_name');
        });
    }

    public function down()
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropIndex('idx_status_created_at');
            $table->dropIndex('idx_client_status');
            $table->dropIndex('idx_status_period_end');
            $table->dropIndex('idx_created_at');
        });

        Schema::table('candidate_job_applications', function (Blueprint $table) {
            $table->dropIndex('idx_recruitment_status');
            $table->dropIndex('idx_candidate_id');
            $table->dropIndex('idx_created_at');
        });

        Schema::table('test_assignments', function (Blueprint $table) {
            $table->dropIndex('idx_candidate_status');
            $table->dropIndex('idx_recruitment_status');
            $table->dropIndex('idx_assigned_at');
        });

        Schema::table('test_results', function (Blueprint $table) {
            $table->dropIndex('idx_candidate_test');
            $table->dropIndex('idx_completed_at');
        });

        Schema::table('interview_invitations', function (Blueprint $table) {
            $table->dropIndex('idx_candidate_status');
            $table->dropIndex('idx_recruitment_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_username');
            $table->dropIndex('idx_email');
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->dropIndex('idx_email');
            $table->dropIndex('idx_full_name');
        });
    }
};