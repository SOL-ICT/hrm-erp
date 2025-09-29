<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the job_opportunities table as it's now redundant
        // All data has been migrated to recruitment_requests
        Schema::dropIfExists('job_opportunities');
    }

    public function down(): void
    {
        // Recreate job_opportunities table for rollback
        Schema::create('job_opportunities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('description');
            $table->longText('requirements')->nullable();
            $table->longText('responsibilities')->nullable();
            $table->string('location')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'intern', 'temporary'])->default('full_time');
            $table->decimal('salary_range_min', 12, 2)->nullable();
            $table->decimal('salary_range_max', 12, 2)->nullable();
            $table->string('currency', 3)->default('NGN');
            $table->string('experience_level')->nullable();
            $table->string('education_level')->nullable();
            $table->json('skills_required')->nullable();
            $table->date('application_deadline')->nullable();
            $table->enum('status', ['draft', 'active', 'paused', 'closed', 'cancelled'])->default('draft');
            $table->string('slug')->unique();
            $table->string('job_code')->unique();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('job_category_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('filled_at')->nullable();
            $table->longText('notes')->nullable();
            $table->integer('number_of_vacancies')->default(1);
            $table->timestamps();

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('job_category_id')->references('id')->on('job_categories')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('staff')->onDelete('set null');
            $table->foreign('updated_by')->references('id')->on('staff')->onDelete('set null');

            $table->index('status');
            $table->index('client_id');
            $table->index('job_category_id');
            $table->index('created_by');
            $table->index('application_deadline');
            $table->index('published_at');
        });
    }
};
