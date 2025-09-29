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
        Schema::create('interview_invitations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('recruitment_request_id');
            $table->unsignedBigInteger('candidate_id');
            $table->unsignedBigInteger('job_application_id')->nullable();
            $table->string('invitation_type')->default('interview'); // interview, assessment, meeting
            $table->longText('message')->nullable();
            $table->dateTime('interview_date')->nullable();
            $table->string('interview_time')->nullable();
            $table->string('location')->nullable();
            $table->string('interview_type')->default('in_person'); // in_person, video, phone
            $table->enum('status', ['sent', 'pending', 'accepted', 'declined', 'expired'])->default('sent');
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('responded_at')->nullable();
            $table->longText('candidate_response')->nullable();
            $table->unsignedBigInteger('sent_by');
            $table->timestamps();

            $table->foreign('recruitment_request_id')->references('id')->on('recruitment_requests')->onDelete('cascade');
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
            $table->foreign('job_application_id')->references('id')->on('job_applications')->onDelete('set null');
            $table->foreign('sent_by')->references('id')->on('users')->onDelete('cascade');

            $table->index(['recruitment_request_id', 'candidate_id']);
            $table->index('status');
            $table->index('sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_invitations');
    }
};
