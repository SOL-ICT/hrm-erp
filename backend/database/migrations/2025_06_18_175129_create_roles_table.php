<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->foreignId('client_id')->nullable()->constrained('clients')->onDelete('cascade');
            $table->boolean('is_system_role')->default(false); // For global roles
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
