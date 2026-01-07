<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onUpdate('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_types')->onUpdate('cascade');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('days');
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approver_id')->nullable()->constrained('staff')->onUpdate('cascade');
            $table->text('comments')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'start_date', 'end_date'], 'idx_staff_dates');
            $table->index('status', 'idx_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_applications');
    }
};