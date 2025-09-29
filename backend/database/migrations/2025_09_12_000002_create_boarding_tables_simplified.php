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
        // Create boarding_requests table (simplified)
        Schema::create('boarding_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->foreignId('job_structure_id')->constrained('job_structures')->onDelete('cascade');
            $table->foreignId('pay_grade_structure_id')->constrained('pay_grade_structures')->onDelete('cascade');
            $table->foreignId('offer_letter_template_id')->constrained('offer_letter_templates')->onDelete('cascade');
            
            // Status tracking
            $table->enum('status', ['pending', 'offer_sent', 'offer_accepted', 'offer_rejected', 'onboarded', 'cancelled'])
                  ->default('pending');
            
            // Offer details
            $table->date('proposed_start_date')->nullable();
            $table->json('candidate_filled_fields')->nullable(); // Fields filled by candidate during offer acceptance
            $table->text('rejection_reason')->nullable();
            
            // Timestamps for tracking
            $table->timestamp('offer_sent_at')->nullable();
            $table->timestamp('offer_responded_at')->nullable();
            $table->timestamp('onboarded_at')->nullable();
            
            // Created by admin
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for efficient queries
            $table->index(['candidate_id', 'status']);
            $table->index(['client_id', 'status']);
            $table->index(['recruitment_request_id']);
            $table->index(['status', 'created_at']);
        });

        // Create offer_responses table (for tracking candidate responses)
        Schema::create('offer_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->enum('response_type', ['accepted', 'rejected']);
            $table->text('candidate_message')->nullable(); // Optional message from candidate
            $table->date('preferred_start_date')->nullable(); // If different from proposed
            $table->json('updated_candidate_info')->nullable(); // Any updated info during acceptance (BVN, NIN, bank details, etc.)
            $table->timestamp('responded_at')->useCurrent();
            $table->timestamps();

            // Index for efficient queries
            $table->index(['boarding_request_id']);
            $table->index(['candidate_id', 'responded_at']);
        });

        // Create boarding_timeline table (for audit trail)
        Schema::create('boarding_timeline', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->enum('action', [
                'request_created',
                'offer_sent',
                'offer_viewed',
                'offer_accepted',
                'offer_rejected',
                'candidate_info_updated',
                'onboarding_started',
                'onboarding_completed',
                'status_changed'
            ]);
            $table->text('description');
            $table->json('details')->nullable(); // Additional action details
            $table->foreignId('performed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamps();

            // Index for efficient queries
            $table->index(['boarding_request_id', 'performed_at']);
            $table->index(['action', 'performed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boarding_timeline');
        Schema::dropIfExists('offer_responses');
        Schema::dropIfExists('boarding_requests');
    }
};
