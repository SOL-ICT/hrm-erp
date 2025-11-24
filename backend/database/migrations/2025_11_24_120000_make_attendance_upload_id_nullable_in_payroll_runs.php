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
        Schema::table('payroll_runs', function (Blueprint $table) {
            // Make attendance_upload_id nullable to allow draft payroll runs without attendance
            $table->unsignedBigInteger('attendance_upload_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_runs', function (Blueprint $table) {
            // Revert to NOT NULL (be careful - this will fail if there are NULL values)
            $table->unsignedBigInteger('attendance_upload_id')->nullable(false)->change();
        });
    }
};
