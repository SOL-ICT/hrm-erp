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
        // Create boarding_requests table
        Schema::create('boarding_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->foreignId('job_structure_id')->nullable()->constrained('job_structures')->onDelete('set null');
            $table->foreignId('pay_grade_id')->nullable()->constrained('pay_grade_structures')->onDelete('set null');
            $table->string('boarding_type')->default('recommended'); // 'recommended', 'direct_placement'
            $table->enum('status', ['pending', 'offer_sent', 'offer_accepted', 'offer_rejected', 'onboarded', 'cancelled'])
                  ->default('pending');
            $table->date('proposed_start_date')->nullable();
            $table->decimal('offered_salary', 15, 2)->nullable();
            $table->text('offer_letter_content')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('offer_sent_at')->nullable();
            $table->timestamp('offer_responded_at')->nullable();
            $table->timestamp('onboarded_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Index for efficient queries
            $table->index(['candidate_id', 'status']);
            $table->index(['client_id', 'status']);
            $table->index(['recruitment_request_id']);
        });

        // Create staff_profiles table (for successfully onboarded candidates)
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('employee_id')->unique(); // Client's employee ID
            $table->string('sol_staff_id')->unique(); // SOL's internal staff ID
            $table->foreignId('job_structure_id')->constrained('job_structures')->onDelete('cascade');
            $table->foreignId('pay_grade_id')->constrained('pay_grade_structures')->onDelete('cascade');
            $table->decimal('current_salary', 15, 2);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('employment_status', ['active', 'terminated', 'suspended', 'on_leave'])
                  ->default('active');
            $table->text('contract_terms')->nullable();
            $table->json('performance_history')->nullable(); // Store performance reviews
            $table->json('salary_history')->nullable(); // Track salary changes
            $table->text('termination_reason')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Indexes for efficient queries
            $table->index(['client_id', 'employment_status']);
            $table->index(['candidate_id']);
            $table->index(['sol_staff_id']);
            $table->index(['employee_id']);
        });

        // Create offer_acceptances table (for tracking offer acceptance history)
        Schema::create('offer_acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->foreignId('candidate_id')->constrained('candidates')->onDelete('cascade');
            $table->enum('response_type', ['accepted', 'rejected', 'negotiating', 'expired']);
            $table->text('candidate_message')->nullable(); // Message from candidate
            $table->json('negotiation_points')->nullable(); // Salary, start date, etc.
            $table->decimal('counter_offer_salary', 15, 2)->nullable();
            $table->date('preferred_start_date')->nullable();
            $table->text('additional_terms')->nullable();
            $table->timestamp('responded_at');
            $table->timestamps();

            // Index for efficient queries
            $table->index(['boarding_request_id', 'response_type']);
            $table->index(['candidate_id', 'responded_at']);
        });

        // Create boarding_documents table (for storing offer letters, contracts, etc.)
        Schema::create('boarding_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->enum('document_type', [
                'offer_letter', 
                'contract', 
                'terms_conditions', 
                'acceptance_letter',
                'rejection_letter',
                'onboarding_checklist',
                'id_verification',
                'bank_details',
                'tax_forms'
            ]);
            $table->string('document_title');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type');
            $table->bigInteger('file_size'); // in bytes
            $table->json('metadata')->nullable(); // Additional document metadata
            $table->boolean('is_signed')->default(false);
            $table->timestamp('signed_at')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Index for efficient queries
            $table->index(['boarding_request_id', 'document_type']);
        });

        // Create boarding_timeline table (for tracking the boarding process)
        Schema::create('boarding_timeline', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boarding_request_id')->constrained('boarding_requests')->onDelete('cascade');
            $table->enum('action', [
                'request_created',
                'offer_prepared',
                'offer_sent',
                'offer_viewed',
                'offer_accepted',
                'offer_rejected',
                'offer_negotiated',
                'documents_submitted',
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
        Schema::dropIfExists('boarding_documents');
        Schema::dropIfExists('offer_acceptances');
        Schema::dropIfExists('staff_profiles');
        Schema::dropIfExists('boarding_requests');
    }
};
