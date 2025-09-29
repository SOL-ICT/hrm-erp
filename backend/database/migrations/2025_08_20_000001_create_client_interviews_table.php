<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('client_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->enum('interview_type', ['physical', 'online'])->default('physical');
            $table->date('interview_date');
            $table->time('interview_time');
            $table->string('contact_person')->nullable();
            $table->string('contact_person_phone', 20)->nullable();
            $table->text('meeting_link')->nullable();
            $table->string('location', 500)->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes
            $table->index(['status']);
            $table->index(['interview_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('client_interviews');
    }
};