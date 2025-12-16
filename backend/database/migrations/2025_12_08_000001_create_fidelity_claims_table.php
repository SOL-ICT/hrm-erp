<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fidelity Claims Table - Manages client-reported fidelity insurance claims
     * through SOL evaluation and insurer processing lifecycle.
     *
     * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md
     */
    public function up(): void
    {
        Schema::create('fidelity_claims', function (Blueprint $table) {
            $table->id();
            
            // Claim Identification
            $table->string('claim_number')->unique()->comment('Auto-generated: SOL-YYYY-NNN');
            
            // Related Entities
            $table->foreignId('client_id')->constrained('clients')->onDelete('restrict');
            $table->foreignId('staff_id')->constrained('staff')->onDelete('restrict');
            
            // Client Contact Information
            $table->string('client_contact_name');
            $table->string('client_contact_email');
            
            // Staff & Assignment Details
            $table->string('staff_position')->comment('Staff role at client site');
            $table->date('assignment_start_date')->comment('When staff started at client');
            
            // Incident Information
            $table->date('incident_date')->comment('When fraud/theft occurred');
            $table->text('incident_description')->comment('Detailed incident narrative');
            $table->decimal('reported_loss', 15, 2)->comment('Client claimed amount');
            
            // Policy Coverage
            $table->decimal('policy_single_limit', 15, 2)->comment('Per-claim coverage limit');
            $table->decimal('policy_aggregate_limit', 15, 2)->comment('Total policy coverage');
            
            // Claim Status Tracking
            $table->enum('status', [
                'client_reported',
                'sol_under_review',
                'sol_accepted',
                'sol_declined',
                'insurer_processing',
                'insurer_settled'
            ])->default('client_reported')->index();
            
            // SOL Evaluation
            $table->enum('sol_evaluation_status', ['pending', 'accepted', 'declined'])
                  ->default('pending');
            $table->foreignId('sol_evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('sol_evaluation_notes')->nullable()->comment('SOL decision rationale');
            $table->timestamp('sol_evaluated_at')->nullable();
            
            // Insurer Processing
            $table->string('insurer_claim_id')->nullable()->comment('Insurance company claim ID');
            $table->string('insurer_status')->nullable()->comment('processing, settled, rejected');
            $table->timestamp('insurer_filed_at')->nullable();
            $table->foreignId('insurer_filed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Settlement
            $table->decimal('settlement_amount', 15, 2)->nullable()->comment('Final payout amount');
            $table->date('settlement_date')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes for performance
            $table->index('client_id');
            $table->index('staff_id');
            $table->index('created_at');
            $table->index(['status', 'created_at']); // Common filter combination
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fidelity_claims');
    }
};
