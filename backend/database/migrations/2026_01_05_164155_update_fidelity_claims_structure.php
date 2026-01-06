<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('fidelity_claims', function (Blueprint $table) {
            // Remove incident_date field
            $table->dropColumn('incident_date');
            
            // Add new fields
            $table->time('report_time')->nullable()->after('assignment_start_date');
            $table->foreignId('notified_to_staff_id')->nullable()->constrained('staff')->onDelete('set null')->after('report_time');
            $table->enum('reported_loss_status', ['known', 'not_provided'])->default('known')->after('incident_description');
        });
        
        // Make reported_loss nullable (for when loss is not provided)
        DB::statement('ALTER TABLE fidelity_claims MODIFY reported_loss DECIMAL(12,2) NULL');
        
        // Create documents tracking table
        Schema::create('fidelity_claim_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained('fidelity_claims')->onDelete('cascade');
            $table->string('document_name');
            $table->boolean('is_provided')->default(false);
            $table->text('file_path')->nullable();
            $table->timestamps();
            
            $table->index('claim_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fidelity_claim_documents');
        
        Schema::table('fidelity_claims', function (Blueprint $table) {
            $table->dropForeign(['notified_to_staff_id']);
            $table->dropColumn(['report_time', 'notified_to_staff_id', 'reported_loss_status']);
            $table->date('incident_date')->after('assignment_start_date');
        });
        
        // Make reported_loss non-nullable again
        DB::statement('ALTER TABLE fidelity_claims MODIFY reported_loss DECIMAL(12,2) NOT NULL');
    }
};
