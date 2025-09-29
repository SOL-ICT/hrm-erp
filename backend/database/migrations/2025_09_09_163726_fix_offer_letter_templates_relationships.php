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
        Schema::table('offer_letter_templates', function (Blueprint $table) {
            // Drop existing foreign key constraints with their actual names
            $table->dropForeign('offer_letter_templates_job_category_id_foreign');
            $table->dropForeign('offer_letter_templates_pay_grade_id_foreign');
            
            // Rename the columns to have correct names
            $table->renameColumn('job_category_id', 'job_structure_id');
            $table->renameColumn('pay_grade_id', 'pay_grade_structure_id');
            
            // Add new foreign key constraints with correct names
            $table->foreign('job_structure_id')->references('id')->on('job_structures')->onDelete('cascade');
            $table->foreign('pay_grade_structure_id')->references('id')->on('pay_grade_structures')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offer_letter_templates', function (Blueprint $table) {
            // Drop the new foreign key constraints
            $table->dropForeign(['job_structure_id']);
            $table->dropForeign(['pay_grade_structure_id']);
            
            // Rename columns back to original names
            $table->renameColumn('job_structure_id', 'job_category_id');
            $table->renameColumn('pay_grade_structure_id', 'pay_grade_id');
            
            // Restore original foreign key constraints
            $table->foreign('job_category_id')->references('id')->on('job_structures')->onDelete('cascade');
            $table->foreign('pay_grade_id')->references('id')->on('pay_grade_structures')->onDelete('cascade');
        });
    }
};
