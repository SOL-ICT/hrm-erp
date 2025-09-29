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
        Schema::create('job_interviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_application_id');
            $table->enum('interview_type', ['phone', 'video', 'in_person', 'group', 'panel'])->default('in_person');
            $table->dateTime('interview_date');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('interviewer_id')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'])->default('scheduled');
            $table->longText('notes')->nullable();
            $table->tinyInteger('rating')->nullable();
            $table->longText('feedback')->nullable();
            $table->timestamps();

            $table->foreign('job_application_id')->references('id')->on('job_applications')->onDelete('cascade');
            $table->foreign('interviewer_id')->references('id')->on('users')->onDelete('set null');
            $table->index('job_application_id');
            $table->index('interviewer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_interviews');
    }
};
