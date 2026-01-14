<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpe_leave_types', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100)->unique();
            $table->string('code', 50)->unique()->nullable();
            $table->text('description')->nullable();
            $table->boolean('requires_documentation')->default(false);
            $table->enum('is_gender_specific', ['NONE', 'MALE_ONLY', 'FEMALE_ONLY'])->default('NONE');
            $table->boolean('is_proratable')->default(true);
            $table->enum('accrual_frequency', ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME'])->default('ANNUALLY');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('name', 'idx_lpe_leave_types_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpe_leave_types');
    }
};