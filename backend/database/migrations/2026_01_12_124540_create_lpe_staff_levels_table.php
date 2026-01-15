<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpe_staff_levels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade')->onUpdate('cascade');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->integer('level_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['client_id', 'name'], 'uk_client_level');
            $table->index('client_id', 'idx_lpe_staff_levels_client');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpe_staff_levels');
    }
};