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
        Schema::create('pay_grade_structures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_structure_id');
            $table->string('grade_name', 100);
            $table->string('grade_code', 20);
            $table->string('pay_structure_type', 10);
            $table->json('emoluments')->nullable();
            $table->decimal('total_compensation', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('NGN');
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('job_structure_id')->references('id')->on('job_structures')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            $table->index('job_structure_id');
            $table->index('grade_code');
            $table->index('pay_structure_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_grade_structures');
    }
};
