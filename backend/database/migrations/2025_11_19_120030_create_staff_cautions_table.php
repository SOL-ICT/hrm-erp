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
        Schema::create('staff_cautions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->text('reason');
            $table->date('issued_date');
            $table->foreignId('issued_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['active', 'resolved', 'escalated'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('issued_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_cautions');
    }
};
