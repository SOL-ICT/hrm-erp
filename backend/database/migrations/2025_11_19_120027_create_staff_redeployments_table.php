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
        Schema::create('staff_redeployments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->enum('redeployment_type', ['department', 'designation', 'service_location', 'client']);
            $table->string('old_department')->nullable();
            $table->string('new_department')->nullable();
            $table->string('old_designation')->nullable();
            $table->string('new_designation')->nullable();
            $table->foreignId('old_service_location_id')->nullable()->constrained('service_locations')->onDelete('set null');
            $table->foreignId('new_service_location_id')->nullable()->constrained('service_locations')->onDelete('set null');
            $table->foreignId('old_client_id')->nullable()->constrained('clients')->onDelete('set null');
            $table->foreignId('new_client_id')->nullable()->constrained('clients')->onDelete('set null');
            $table->date('effective_date');
            $table->text('reason')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('redeployment_type');
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_redeployments');
    }
};
