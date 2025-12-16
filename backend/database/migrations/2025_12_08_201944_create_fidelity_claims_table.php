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
        Schema::create('fidelity_claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_number')->unique(); // SOL-2024-001
            
            // Client Information
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('client_contact_person');
            $table->string('client_contact_email');
            
            // Staff Member Information
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->string('staff_position');
            $table->date('assignment_start_date');
            
            // Incident Details
            $table->date('incident_date');
            $table->text('incident_description');
            $table->decimal('reported_loss', 12, 2);
            
            // Policy Information
            $table->decimal('policy_single_limit', 12, 2);
            $table->decimal('policy_aggregate_limit', 12, 2);
            
            // Status Tracking
            $table->enum('status', [
                'client_reported',
                'sol_under_review',
                'sol_accepted',
                'sol_declined',
                'insurer_processing',
                'insurer_settled'
            ])->default('client_reported');
            
            $table->enum('sol_evaluation_status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->text('sol_notes')->nullable();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('evaluated_at')->nullable();
            
            // Insurer Information
            $table->string('insurer_claim_id')->nullable();
            $table->enum('insurer_status', ['pending', 'processing', 'settled', 'rejected'])->nullable();
            $table->decimal('settlement_amount', 12, 2)->nullable();
            $table->date('settlement_date')->nullable();
            $table->foreignId('filed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('filed_at')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('status');
            $table->index('client_id');
            $table->index('staff_id');
            $table->index('incident_date');
            $table->index('created_at');
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
