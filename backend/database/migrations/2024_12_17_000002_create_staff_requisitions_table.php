<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Staff requisitions table for internal item requests.
     * Tracks requisition lifecycle from creation to collection.
     */
    public function up(): void
    {
        Schema::create('staff_requisitions', function (Blueprint $table) {
            $table->id();
            
            // Requisition identification
            $table->string('requisition_code', 50)->unique()->comment('Unique code (e.g., SRQ-2024-001)');
            
            // Requester information
            $table->foreignId('user_id')->constrained('users')->comment('Staff member who created requisition');
            $table->string('department', 100)->comment('Requester department');
            $table->string('branch', 100)->comment('Requester branch');
            
            // Requisition details
            $table->date('request_date')->comment('Date requisition was created');
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
                  ->default('pending')
                  ->comment('Approval status');
            $table->enum('collection_status', ['pending', 'ready', 'collected', 'cancelled'])
                  ->default('pending')
                  ->comment('Collection/fulfillment status');
            
            // Approval tracking
            $table->foreignId('approved_by')->nullable()->constrained('users')->comment('Store keeper who approved');
            $table->dateTime('approval_date')->nullable()->comment('When approval was given');
            $table->text('rejection_reason')->nullable()->comment('Reason if rejected');
            
            // Collection tracking
            $table->dateTime('collection_date')->nullable()->comment('When items were collected');
            $table->foreignId('collected_by')->nullable()->constrained('users')->comment('Who marked as collected');
            
            // Additional information
            $table->text('notes')->nullable()->comment('General notes or comments');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('status');
            $table->index('collection_status');
            $table->index('user_id');
            $table->index('request_date');
            $table->index(['status', 'collection_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_requisitions');
    }
};
