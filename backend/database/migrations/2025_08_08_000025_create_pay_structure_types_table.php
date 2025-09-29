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
        Schema::create('pay_structure_types', function (Blueprint $table) {
            $table->id();
            $table->string('type_code', 10)->unique();
            $table->string('type_name');
            $table->enum('contract_type', ['employment', 'service']);
            $table->enum('contract_nature', ['at_will', 'tenured']);
            $table->string('primary_component', 100);
            $table->string('secondary_component', 100)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('contract_type');
            $table->index('contract_nature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_structure_types');
    }
};
