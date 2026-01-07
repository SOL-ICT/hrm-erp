<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('name_change_approvals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('request_id')->constrained('name_change_requests')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('approved_by')->constrained('staff')->onDelete('cascade')->onUpdate('cascade');
            $table->enum('status', ['Approved', 'Rejected']);
            $table->text('comments')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('request_id', 'idx_approvals_request');
            $table->index('approved_by', 'idx_approvals_approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('name_change_approvals');
    }
};