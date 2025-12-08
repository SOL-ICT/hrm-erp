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
        Schema::create('name_change_approvals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('approved_by');
            $table->enum('status', ['Approved', 'Rejected']);
            $table->text('comments')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('request_id', 'fk_approvals_request')->references('id')->on('name_change_requests')->onDelete('cascade');
            $table->foreign('approved_by', 'fk_approvals_staff')->references('id')->on('staff')->onDelete('cascade');
            $table->index('request_id', 'idx_approvals_request');
            $table->index('approved_by', 'idx_approvals_approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('name_change_approvals');
    }
};
