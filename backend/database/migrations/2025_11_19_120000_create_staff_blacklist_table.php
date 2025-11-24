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
        Schema::create('staff_blacklist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('termination_id')->nullable()->constrained('staff_terminations')->onDelete('set null');
            $table->date('blacklist_date');
            $table->text('reason');
            $table->json('staff_details_snapshot')->comment('Snapshot of staff record at blacklist time');
            $table->timestamps();

            $table->index(['staff_id', 'client_id']);
            $table->index('blacklist_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_blacklist');
    }
};
