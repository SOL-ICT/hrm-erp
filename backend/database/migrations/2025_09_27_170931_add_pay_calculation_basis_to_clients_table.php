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
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('pay_calculation_basis', ['working_days', 'calendar_days'])
                ->default('working_days')
                ->nullable()
                ->after('client_category')
                ->comment('Basis for payroll calculations: working_days (Mon-Fri) or calendar_days (full month)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('pay_calculation_basis');
        });
    }
};
