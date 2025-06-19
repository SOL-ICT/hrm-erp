<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_staff_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('type_code', 20); // Salaried, Contract, etc.
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('salary_structure')->nullable();
            $table->json('benefits')->nullable();
            $table->json('deductions')->nullable();
            $table->integer('grade_level')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['client_id', 'type_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_staff_types');
    }
};
