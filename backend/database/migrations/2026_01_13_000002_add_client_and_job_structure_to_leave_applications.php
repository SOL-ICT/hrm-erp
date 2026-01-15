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
        Schema::table('leave_applications', function (Blueprint $table) {
            // Add client_id for multi-tenancy
            $table->unsignedBigInteger('client_id')->nullable()->after('staff_id');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');

            // Add job_structure_id to track which position the leave was for
            $table->unsignedBigInteger('job_structure_id')->nullable()->after('client_id');
            $table->foreign('job_structure_id')->references('id')->on('job_structures')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_applications', function (Blueprint $table) {
            $table->dropForeign(['job_structure_id']);
            $table->dropColumn('job_structure_id');

            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });
    }
};
