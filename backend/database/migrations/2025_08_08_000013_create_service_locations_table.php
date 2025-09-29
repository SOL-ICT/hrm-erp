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
        Schema::create('service_locations', function (Blueprint $table) {
            $table->id();
            $table->string('location_code', 20)->unique();
            $table->string('unique_id', 50)->nullable();
            $table->string('location_name');
            $table->string('short_name', 100)->nullable();
            $table->string('country', 100)->default('Nigeria');
            $table->string('state', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->text('full_address')->nullable();
            $table->string('contact_person_name')->nullable();
            $table->string('contact_person_phone', 20)->nullable();
            $table->string('contact_person_email')->nullable();
            $table->text('address')->nullable();
            $table->string('pin_code', 10)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('fax', 20)->nullable();
            $table->text('notes')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('sol_region', 100)->nullable();
            $table->string('sol_zone', 100)->nullable();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('sol_office_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('unique_id');
            $table->index('short_name');
            $table->index('city');
            $table->index('sol_region');
            $table->index('sol_zone');
            $table->index('client_id');
            $table->index('sol_office_id');
            $table->index('is_active');
            $table->index('created_by');

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('sol_office_id')->references('id')->on('sol_offices')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_locations');
    }
};
