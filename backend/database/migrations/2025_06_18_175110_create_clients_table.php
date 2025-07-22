<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('client_code', 20)->unique();
            $table->string('name')->unique();
           // $table->string('email')->nullable()->unique(); // ✅ Add this
            $table->string('slug')->unique();
            $table->string('prefix', 10)->unique(); // For employee ID: DSA, SOL, etc.
            $table->text('address')->nullable();
            $table->json('sla_details')->nullable();
            $table->json('configuration')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->date('contract_start_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
