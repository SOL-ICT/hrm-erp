<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Recreate the job_interviews table that was accidentally dropped
        Schema::create('job_interviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_application_id');
            $table->unsignedBigInteger('interviewer_id')->nullable();
            $table->dateTime('interview_date');
            $table->string('interview_time')->nullable();
            $table->string('location')->nullable();
            $table->string('interview_type')->default('in_person'); // in_person, video, phone
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->longText('notes')->nullable();
            $table->longText('feedback')->nullable();
            $table->integer('rating')->nullable(); // 1-10 scale
            $table->enum('recommendation', ['hire', 'reject', 'consider', 'pending'])->nullable();
            $table->timestamps();

            $table->foreign('job_application_id')->references('id')->on('job_applications')->onDelete('cascade');
            $table->foreign('interviewer_id')->references('id')->on('staff')->onDelete('set null');

            $table->index('job_application_id');
            $table->index('interviewer_id');
            $table->index('interview_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_interviews');
    }
};
