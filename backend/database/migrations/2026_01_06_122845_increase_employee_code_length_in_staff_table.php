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
        Schema::table('staff', function (Blueprint $table) {
            // Increase employee_code from varchar(20) to varchar(50) to accommodate longer codes
            // Example: SOL/LAG/CHD/24/DSA/0027 (27 characters)
            $table->string('employee_code', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Revert back to varchar(20)
            $table->string('employee_code', 20)->change();
        });
    }
};
