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
        Schema::create('emolument_components', function (Blueprint $table) {
            $table->id();
            $table->string('component_code', 40)->unique();
            $table->string('component_name');
            $table->enum('status', ['benefit', 'regular'])->default('regular');
            $table->enum('type', ['fixed_allowance', 'variable_allowance'])->default('fixed_allowance');
            $table->enum('class', ['cash_item', 'non_cash_item'])->default('cash_item');
            $table->string('client_account', 100);
            $table->string('ledger_account_code', 20);
            $table->string('ledger_account_name');
            $table->enum('category', ['basic', 'allowance', 'deduction', 'benefit'])->default('allowance');
            $table->boolean('is_taxable')->default(true);
            $table->enum('calculation_method', ['fixed', 'percentage', 'formula'])->default('fixed');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index('component_name');
            $table->index('status');
            $table->index('type');
            $table->index('class');
            $table->index('client_account');
            $table->index('category');
            $table->index('display_order');
            $table->index('is_active');

            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emolument_components');
    }
};
