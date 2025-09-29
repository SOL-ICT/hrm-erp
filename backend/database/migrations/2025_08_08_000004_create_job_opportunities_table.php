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
        Schema::create('job_opportunities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('job_category_id')->nullable();
            $table->string('job_code', 50)->unique();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description');
            $table->longText('requirements')->nullable();
            $table->longText('responsibilities')->nullable();
            $table->decimal('salary_range_min', 12, 2)->nullable();
            $table->decimal('salary_range_max', 12, 2)->nullable();
            $table->string('salary_currency', 10)->default('NGN');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern', 'temporary'])->default('full_time');
            $table->enum('experience_level', ['entry', 'junior', 'mid', 'senior', 'executive'])->default('entry');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('state_lga_id')->nullable();
            $table->date('application_deadline')->nullable();
            $table->integer('positions_available')->default(1);
            $table->enum('status', ['draft', 'active', 'paused', 'closed', 'cancelled'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('job_category_id')->references('id')->on('job_categories')->onDelete('set null');
            $table->foreign('state_lga_id')->references('id')->on('states_lgas')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_opportunities');
    }
};
