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
        Schema::create('interview_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->enum('interview_type', ['initial', 'technical', 'client_meeting', 'final'])->default('initial');
            $table->enum('interview_mode', ['video', 'phone', 'in_person'])->default('video');
            $table->timestamp('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->text('meeting_link')->nullable();
            $table->text('location')->nullable(); // For in-person interviews
            $table->text('instructions')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->text('interviewer_notes')->nullable();
            $table->enum('outcome', ['passed', 'failed', 'pending'])->nullable();
            $table->decimal('rating', 3, 2)->nullable(); // Out of 5.0
            $table->json('feedback')->nullable(); // Structured feedback
            $table->foreignId('scheduled_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['candidate_id', 'interview_type']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_schedules');
    }
};
