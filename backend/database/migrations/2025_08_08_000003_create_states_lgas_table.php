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
        Schema::create('states_lgas', function (Blueprint $table) {
            $table->id();
            $table->string('state_name', 100);
            $table->string('state_code', 10);
            $table->string('lga_name', 100);
            $table->string('lga_code', 20);
            $table->enum('zone', ['north_central', 'north_east', 'north_west', 'south_east', 'south_south', 'south_west']);
            $table->boolean('is_capital')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('state_name');
            $table->index('state_code');
            $table->index('zone');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('states_lgas');
    }
};
