<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->string('middle_name')->nullable();
            $table->string('formal_name')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->string('nationality')->nullable();
            $table->unsignedBigInteger('state_lga_id')->nullable();
            $table->string('state_of_origin')->nullable();
            $table->string('local_government')->nullable();
            $table->string('national_id_no')->nullable();
            $table->string('phone_primary')->nullable();
            $table->string('phone_secondary')->nullable();
            $table->text('address_current')->nullable();
            $table->text('address_line_2_current')->nullable();
            $table->string('state_of_residence_current', 100)->nullable();
            $table->string('local_government_residence_current', 100)->nullable();
            $table->string('state_of_residence_permanent', 100)->nullable();
            $table->string('local_government_residence_permanent', 100)->nullable();
            $table->text('address_permanent')->nullable();
            $table->text('address_line_2_permanent')->nullable();
            $table->string('profile_picture')->nullable();
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();
            $table->string('state_of_residence', 100)->nullable();
            $table->string('local_government_residence', 100)->nullable();
            $table->timestamps();

            $table->index('candidate_id');
            $table->foreign('state_lga_id')->references('id')->on('states_lgas')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_profiles');
    }
};
