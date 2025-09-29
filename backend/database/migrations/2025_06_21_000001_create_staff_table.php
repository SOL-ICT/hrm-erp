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
            $table->foreignId('candidate_id')->nullable()->constrained('candidates')->onDelete('set null');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('staff_type_id')->constrained('client_staff_types')->onDelete('cascade');
            $table->string('employee_code', 20)->unique();
            $table->string('staff_id', 20)->unique();
            $table->string('email')->unique()->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->date('entry_date');
            $table->date('end_date')->nullable();
            $table->enum('appointment_status', ['probation', 'confirmed', 'contract', 'intern'])->default('probation');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern'])->default('full_time');
            $table->enum('status', ['active', 'inactive', 'terminated', 'resigned', 'on_leave'])->default('active');
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('state_lga_id')->nullable()->constrained('states_lgas')->onDelete('set null');
            $table->foreignId('supervisor_id')->nullable()->constrained('staff')->onDelete('set null');
            $table->string('leave_category_level')->nullable();
            $table->string('appraisal_category')->nullable();
            $table->string('tax_id_no')->nullable();
            $table->string('pf_no')->nullable();
            $table->string('pf_administrator')->nullable();
            $table->string('pfa_code')->nullable();
            $table->string('bv_no')->nullable();
            $table->string('nhf_account_no')->nullable();
            $table->string('client_assigned_code')->nullable();
            $table->string('deployment_code')->nullable();
            $table->enum('onboarding_method', ['from_candidate', 'manual_entry', 'bulk_upload']);
            $table->foreignId('onboarded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->json('custom_fields')->nullable();
            $table->timestamps();

            $table->index('candidate_id');
            $table->index('client_id');
            $table->index('staff_type_id');
            $table->index('state_lga_id');
            $table->index('supervisor_id');
            $table->index('onboarded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
