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
            // Pay grade structure reference - the proper way!
            $table->unsignedBigInteger('pay_grade_structure_id')->nullable()->after('status');

            // Salary metadata
            $table->timestamp('salary_effective_date')->nullable()->after('pay_grade_structure_id');
            $table->string('salary_currency', 3)->default('NGN')->after('salary_effective_date');

            // Foreign key constraint
            $table->foreign('pay_grade_structure_id')->references('id')->on('pay_grade_structures')->onDelete('set null');

            // Index for performance
            $table->index(['client_id', 'pay_grade_structure_id']);
            $table->index(['pay_grade_structure_id', 'salary_effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            // Drop foreign key and indexes first
            $table->dropForeign(['pay_grade_structure_id']);
            $table->dropIndex(['client_id', 'pay_grade_structure_id']);
            $table->dropIndex(['pay_grade_structure_id', 'salary_effective_date']);

            // Drop columns
            $table->dropColumn([
                'pay_grade_structure_id',
                'salary_effective_date',
                'salary_currency'
            ]);
        });
    }
};
