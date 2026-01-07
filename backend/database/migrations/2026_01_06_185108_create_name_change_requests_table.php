<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('name_change_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade')->onUpdate('cascade');
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->text('reason');
            $table->string('proof_document', 255);
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index('staff_id', 'idx_name_change_staff');
            $table->index('status', 'idx_name_change_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('name_change_requests');
    }
};