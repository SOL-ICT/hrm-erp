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
        Schema::create('staff_banking', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id')->unique();
            $table->enum('payment_mode', ['cash', 'bank_transfer', 'cheque'])->default('bank_transfer');
            $table->string('bank_name')->nullable();
            $table->string('account_number', 20)->nullable();
            $table->string('wages_type', 100)->nullable();
            $table->decimal('weekday_ot_rate', 10, 2)->nullable();
            $table->decimal('holiday_ot_rate', 10, 2)->nullable();
            $table->enum('entitled_to_ot', ['yes', 'no'])->default('no');
            $table->enum('pension_deduction', ['yes', 'no'])->default('yes');
            $table->timestamps();

            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_banking');
    }
};
