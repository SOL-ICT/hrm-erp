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
            //$table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('candidate_id')->unique()->constrained('candidates')->onDelete('cascade');
            //This ensures one-to-one integrity between candidates and candidate_profiles.

            // Personal Details
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('formal_name')->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->date('date_of_birth');
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();

            // Location & Identity
            $table->string('nationality')->default('Nigeria');
            $table->string('state_of_origin')->nullable();
            $table->string('local_government')->nullable();
            $table->string('national_id_no')->nullable();

            // Contact Information
            $table->string('phone_primary')->nullable();
            $table->string('phone_secondary')->nullable();
            $table->text('address_current')->nullable();
            $table->text('address_permanent')->nullable();

            // Additional
            $table->string('profile_picture')->nullable();
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_profiles');
    }
};
