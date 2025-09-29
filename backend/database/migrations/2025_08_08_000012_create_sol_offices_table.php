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
        Schema::create('sol_offices', function (Blueprint $table) {
            $table->id();
            $table->string('office_name');
            $table->string('office_code', 20)->unique();
            $table->string('zone', 50)->nullable();
            $table->string('zone_name', 100)->nullable();
            $table->string('state_name', 100);
            $table->string('state_code', 10);
            $table->enum('control_type', ['lga', 'state']);
            $table->json('controlled_areas')->nullable();
            $table->text('office_address')->nullable();
            $table->string('office_phone', 20)->nullable();
            $table->string('office_email')->nullable();
            $table->string('manager_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('state_code');
            $table->index('is_active');
            $table->index('deleted_at');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sol_offices');
    }
};
