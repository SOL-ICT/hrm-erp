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
        Schema::create('test_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_assignment_id')->constrained('test_assignments')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('test_id')->constrained('tests')->onDelete('cascade');
            $table->json('answers'); // Store all answers
            $table->integer('total_questions');
            $table->integer('correct_answers');
            $table->decimal('score_percentage', 5, 2);
            $table->integer('time_taken')->nullable(); // in minutes
            $table->enum('result_status', ['passed', 'failed'])->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at');
            $table->json('question_results')->nullable(); // Detailed question-by-question results
            $table->timestamps();
            
            $table->index(['candidate_id', 'test_id']);
            $table->index(['result_status', 'score_percentage']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('test_results');
    }
};
