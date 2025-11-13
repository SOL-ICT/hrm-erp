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
        Schema::create('sol_master_details', function (Blueprint $table) {
            $table->id();
            $table->enum('purpose', ['invoice', 'reimbursement'])->comment('Purpose: Invoice or Reimbursement');
            $table->string('bank_name')->comment('Bank name for payments');
            $table->string('account_name')->comment('Account holder name');
            $table->string('account_number')->comment('Bank account number');
            $table->string('sort_code')->nullable()->comment('Bank sort code');
            $table->string('vat_registration_number')->nullable()->comment('VAT registration number');
            $table->string('tin')->nullable()->comment('Tax Identification Number');
            $table->string('compensation_officer')->nullable()->comment('Name of compensation officer');
            $table->string('company_accountant')->nullable()->comment('Name of company accountant');
            $table->text('address')->nullable()->comment('Company address');
            $table->string('phone')->nullable()->comment('Company phone number');
            $table->string('email')->nullable()->comment('Company email address');
            $table->boolean('is_active')->default(true)->comment('Whether this record is active');
            $table->timestamps();

            // Index for quick lookup by purpose
            $table->index(['purpose', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sol_master_details');
    }
};
