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
        Schema::create('staff_education', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('staff_id');
            $table->string('institution_name');
            $table->string('certificate_type', 100);
            $table->string('specialization')->nullable();
            $table->year('start_year')->nullable();
            $table->year('end_year')->nullable();
            $table->year('graduation_year')->nullable();
            $table->string('score_class', 100)->nullable();
            $table->year('year_obtained')->nullable();
            $table->tinyInteger('education_order')->default(1);
            $table->timestamps();

            $table->foreign('staff_id')->references('id')->on('staff')->onDelete('cascade');
            $table->index('staff_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_education');
    }
};
