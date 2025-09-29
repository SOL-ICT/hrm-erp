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
        Schema::table('recruitment_requests', function (Blueprint $table) {
            // Remove old columns
            $table->dropColumn([
                'service_request_id',
                'interview_date', 
                'salary_range_min',
                'salary_range_max'
            ]);
            
            // Add new compensation field
            $table->decimal('compensation', 15, 2)->nullable()->after('number_of_vacancies');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            // Re-add the removed columns
            $table->unsignedBigInteger('service_request_id')->nullable()->after('client_id');
            $table->datetime('interview_date')->nullable()->after('sol_office_id');
            $table->decimal('salary_range_min', 15, 2)->nullable()->after('number_of_vacancies');
            $table->decimal('salary_range_max', 15, 2)->nullable()->after('salary_range_min');
            
            // Remove compensation field
            $table->dropColumn('compensation');
        });
    }
};
