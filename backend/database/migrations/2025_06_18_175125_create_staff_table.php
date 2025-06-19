<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->nullable()->constrained('candidates')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('staff_type_id')->constrained('client_staff_types')->onDelete('restrict');

            // Employee Identification
            $table->string('employee_code', 20)->unique(); // DSA20260
            $table->string('staff_id', 20)->unique();

            // Employment Details
            $table->date('entry_date');
            $table->date('end_date')->nullable();
            $table->enum('appointment_status', ['probation', 'confirmed', 'contract', 'intern'])->default('probation');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
            $table->enum('status', ['active', 'inactive', 'terminated', 'resigned', 'on_leave'])->default('active');

            // Job Information
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('supervisor_id')->nullable()->constrained('staff')->onDelete('set null');

            // Categories
            $table->string('leave_category_level')->nullable();
            $table->string('appraisal_category')->nullable();

            // Financial Information
            $table->string('tax_id_no')->nullable();
            $table->string('pf_no')->nullable();
            $table->string('pf_administrator')->nullable();
            $table->string('pfa_code')->nullable();
            $table->string('bv_no')->nullable();
            $table->string('nhf_account_no')->nullable();

            // Client Specific
            $table->string('client_assigned_code')->nullable();
            $table->string('deployment_code')->nullable();

            // Onboarding Method
            $table->enum('onboarding_method', ['from_candidate', 'manual_entry', 'bulk_upload']);
            $table->foreignId('onboarded_by')->nullable()->constrained('staff')->onDelete('set null');

            $table->json('custom_fields')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
