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
        Schema::create('staff_legal_ids', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id')->unique();
            $table->string('national_id_no', 50)->nullable();
            $table->string('tax_id_no', 50)->nullable();
            $table->string('pension_pin', 50)->nullable();
            $table->string('pfa_name')->nullable();
            $table->string('bank_verification_no', 20)->nullable()->unique();
            $table->string('nhf_account_no', 50)->nullable();
            $table->timestamps();

            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_legal_ids');
    }
};
