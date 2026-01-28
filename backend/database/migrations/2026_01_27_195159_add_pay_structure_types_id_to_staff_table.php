<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Add pay_structure_types_id to staff table
     * This links each staff member to their contract type (employment/service)
     * Populated automatically from job category's pay structure during recruitment boarding
     */
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->unsignedBigInteger('pay_structure_types_id')->nullable()->after('job_title');
            $table->foreign('pay_structure_types_id')->references('id')->on('pay_structure_types')->onDelete('set null');
            $table->index('pay_structure_types_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropForeign(['pay_structure_types_id']);
            $table->dropIndex(['pay_structure_types_id']);
            $table->dropColumn('pay_structure_types_id');
        });
    }
};
