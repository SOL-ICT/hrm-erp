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
        Schema::create('staff_bulk_import_temp', function (Blueprint $table) {
            $table->id();
            $table->integer('sn')->nullable();
            $table->string('client_name')->nullable();
            $table->string('emp_code', 50)->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('marital_status', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('nationality', 100)->nullable();
            $table->string('state_of_origin', 100)->nullable();
            $table->string('local_government', 100)->nullable();
            $table->string('national_id_no', 50)->nullable();
            $table->string('tax_id_no', 50)->nullable();
            $table->string('pin_no', 50)->nullable();
            $table->string('pfa_name')->nullable();
            $table->string('bank_verification_no', 20)->nullable();
            $table->string('nhf_account_no', 50)->nullable();
            $table->date('entry_date')->nullable();
            $table->text('current_residential_address')->nullable();
            $table->string('mobile_phone_no', 20)->nullable();
            $table->string('email_id')->nullable();
            $table->text('permanent_address')->nullable();
            $table->string('nearby_landmark')->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->text('emergency_contact_address')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->string('emergency_contact_email')->nullable();
            $table->string('emergency_contact_relationship', 100)->nullable();
            $table->string('category')->nullable();
            $table->string('grade', 50)->nullable();
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->string('service_place')->nullable();
            $table->string('service_location')->nullable();
            $table->string('state_of_service')->nullable();
            $table->date('date_of_join')->nullable();
            $table->string('reporting_manager')->nullable();
            $table->string('office_email_id')->nullable();
            $table->string('office_phone_no', 20)->nullable();

            // Education fields (up to 3 schools)
            $table->string('school_1')->nullable();
            $table->year('graduation_year_1')->nullable();
            $table->string('certificate_1')->nullable();
            $table->string('specialization_1')->nullable();
            $table->string('score_class_1', 100)->nullable();
            $table->string('school_2')->nullable();
            $table->year('graduation_year_2')->nullable();
            $table->string('certificate_2')->nullable();
            $table->string('specialization_2')->nullable();
            $table->string('score_class_2', 100)->nullable();
            $table->string('school_3')->nullable();
            $table->year('graduation_year_3')->nullable();
            $table->string('certificate_3')->nullable();
            $table->string('specialization_3')->nullable();
            $table->string('score_class_3', 100)->nullable();

            // Experience fields (up to 3 employers)
            $table->string('employer_1')->nullable();
            $table->string('designation_1')->nullable();
            $table->date('start_date_1')->nullable();
            $table->date('end_date_1')->nullable();
            $table->string('employer_2')->nullable();
            $table->string('designation_2')->nullable();
            $table->date('start_date_2')->nullable();
            $table->date('end_date_2')->nullable();
            $table->string('employer_3')->nullable();
            $table->string('designation_3')->nullable();
            $table->date('start_date_3')->nullable();
            $table->date('end_date_3')->nullable();

            // Banking details
            $table->string('payment_mode', 50)->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_no', 20)->nullable();
            $table->string('wages_type', 100)->nullable();
            $table->decimal('wd_ot_rate', 10, 2)->nullable();
            $table->decimal('ho_ot_rate', 10, 2)->nullable();
            $table->string('entitled_to_ot', 10)->nullable();
            $table->string('pension_deduction', 10)->nullable();

            // Family contacts
            $table->string('father_name')->nullable();
            $table->string('father_relationship', 50)->nullable();
            $table->string('father_gender', 10)->nullable();
            $table->date('father_dob')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_relationship', 50)->nullable();
            $table->string('mother_gender', 10)->nullable();
            $table->date('mother_dob')->nullable();
            $table->string('next_of_kin')->nullable();
            $table->string('next_of_kin_phone', 20)->nullable();
            $table->string('next_of_kin_relationship', 100)->nullable();
            $table->string('next_of_kin_email')->nullable();

            // References
            $table->string('referee_1_name')->nullable();
            $table->text('referee_1_address')->nullable();
            $table->string('referee_1_phone', 20)->nullable();
            $table->string('referee_1_email')->nullable();
            $table->string('referee_2_name')->nullable();
            $table->text('referee_2_address')->nullable();
            $table->string('referee_2_phone', 20)->nullable();
            $table->string('referee_2_email')->nullable();

            // Guarantors
            $table->string('guarantor_1_name')->nullable();
            $table->text('guarantor_1_address')->nullable();
            $table->date('guarantor_1_dob')->nullable();
            $table->string('guarantor_1_phone', 20)->nullable();
            $table->string('guarantor_1_email')->nullable();
            $table->text('guarantor_1_bank_details')->nullable();
            $table->text('guarantor_1_employer')->nullable();
            $table->string('guarantor_1_relationship', 100)->nullable();
            $table->string('guarantor_2_name')->nullable();
            $table->text('guarantor_2_address')->nullable();
            $table->date('guarantor_2_dob')->nullable();
            $table->string('guarantor_2_phone', 20)->nullable();
            $table->string('guarantor_2_email')->nullable();
            $table->text('guarantor_2_bank_details')->nullable();
            $table->text('guarantor_2_employer')->nullable();
            $table->string('guarantor_2_relationship', 100)->nullable();

            $table->boolean('processed')->default(false);
            $table->text('processing_errors')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_bulk_import_temp');
    }
};
