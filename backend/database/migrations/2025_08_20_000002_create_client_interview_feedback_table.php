<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('client_interview_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_interview_id')->nullable()->constrained('client_interviews')->onDelete('set null');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->enum('feedback_status', ['successful', 'unsuccessful', 'keep_in_view']);
            $table->text('comments')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes and constraints
            $table->index(['feedback_status']);
            $table->unique(['candidate_id', 'recruitment_request_id'], 'unique_candidate_feedback');
        });
    }

    public function down()
    {
        Schema::dropIfExists('client_interview_feedback');
    }
};