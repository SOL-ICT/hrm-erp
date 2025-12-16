<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Claim Evidence Table - Stores file attachments (PDFs, images, videos, Excel)
     * for fidelity claims as supporting documentation.
     *
     * Refer to: CLAIMS_MODULE_IMPLEMENTATION.md
     */
    public function up(): void
    {
        Schema::create('claim_evidence', function (Blueprint $table) {
            $table->id();
            
            // Relationship
            $table->foreignId('claim_id')->constrained('fidelity_claims')->onDelete('cascade');
            
            // File Information
            $table->string('file_name')->comment('Original filename');
            $table->string('file_path')->comment('Storage path: claims/evidence/{claim_id}/{filename}');
            $table->string('file_type')->comment('MIME type');
            $table->unsignedInteger('file_size')->comment('Size in bytes');
            
            // Audit
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('claim_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('claim_evidence');
    }
};
