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
        Schema::create('change_request_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('change_request_id');
            $table->unsignedBigInteger('staff_id');
            $table->string('field_changed');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->enum('action_status', ['submitted', 'approved', 'rejected']);
            $table->timestamp('action_date')->useCurrent();
            $table->timestamps();

            $table->foreign('change_request_id')->references('id')->on('change_requests')->onDelete('cascade');
            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->index('change_request_id');
            $table->index('staff_id');
            $table->index('action_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('change_request_history');
    }
};
