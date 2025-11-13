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
        Schema::table('job_structures', function (Blueprint $table) {
            // Add unique constraint for client_id + job_code combination
            // This allows multiple clients to have the same job_code
            $table->unique(['client_id', 'job_code'], 'job_structures_client_job_code_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_structures', function (Blueprint $table) {
            // Remove the unique constraint
            $table->dropUnique('job_structures_client_job_code_unique');
        });
    }
};
