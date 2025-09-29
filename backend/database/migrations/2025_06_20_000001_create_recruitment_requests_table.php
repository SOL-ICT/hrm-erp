<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruitment_requests', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_id', 20)->unique();
            $table->enum('status', ['active', 'closed', 'cancelled', 'on_hold'])->default('active');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('service_request_id')->constrained('service_requests')->onDelete('cascade');
            $table->foreignId('job_structure_id')->constrained('job_structures')->onDelete('cascade');
            $table->enum('gender_requirement', ['male', 'female', 'any'])->default('any');
            $table->enum('religion_requirement', ['christianity', 'islam', 'any'])->default('any');
            $table->string('age_limit_min', 3)->nullable();
            $table->string('age_limit_max', 3)->nullable();
            $table->text('experience_requirement')->nullable();
            $table->json('qualifications')->nullable();
            $table->foreignId('service_location_id')->constrained('service_locations')->onDelete('cascade');
            $table->string('lga', 100)->nullable();
            $table->string('zone', 100)->nullable();
            $table->foreignId('sol_office_id')->nullable()->constrained('sol_offices')->onDelete('set null');
            $table->dateTime('interview_date')->nullable();
            $table->integer('number_of_vacancies')->default(1);
            $table->decimal('salary_range_min', 12, 2)->nullable();
            $table->decimal('salary_range_max', 12, 2)->nullable();
            $table->enum('sol_service_type', ['MSS', 'RS', 'DSS'])->default('RS');
            $table->date('recruitment_period_start')->nullable();
            $table->date('recruitment_period_end')->nullable();
            $table->text('description')->nullable();
            $table->text('special_requirements')->nullable();
            $table->enum('priority_level', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->text('closed_reason')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('client_id');
            $table->index('service_request_id');
            $table->index('job_structure_id');
            $table->index('service_location_id');
            $table->index('sol_office_id');
            $table->index('created_by');
            $table->index('updated_by');
            $table->index('approved_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitment_requests');
    }
};
