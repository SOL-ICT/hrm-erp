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
        Schema::create('claim_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fidelity_claim_id')->constrained('fidelity_claims')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // pdf, image, video, spreadsheet
            $table->integer('file_size'); // in bytes
            $table->string('mime_type');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('fidelity_claim_id');
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
