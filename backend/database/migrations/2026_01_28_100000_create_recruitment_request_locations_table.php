<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates junction table for many-to-many relationship between
     * recruitment requests and service locations.
     * Allows one ticket to have multiple service locations.
     */
    public function up(): void
    {
        Schema::create('recruitment_request_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_request_id')->constrained('recruitment_requests')->onDelete('cascade');
            $table->foreignId('service_location_id')->constrained('service_locations')->onDelete('cascade');
            $table->timestamps();

            // Prevent duplicate location assignments
            $table->unique(['recruitment_request_id', 'service_location_id'], 'unique_request_location');
            
            $table->index('recruitment_request_id');
            $table->index('service_location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitment_request_locations');
    }
};
