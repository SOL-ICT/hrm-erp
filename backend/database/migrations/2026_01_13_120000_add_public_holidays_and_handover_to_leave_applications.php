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
            // Add number of public holidays during leave period
            $table->integer('public_holidays')->default(0)->after('days')->comment('Number of public holidays during leave period');
            
            // Add staff member who will cover during leave (handover)
            $table->bigInteger('handover_staff_id')->unsigned()->nullable()->after('reason')->comment('Staff ID who will cover during leave');
            
            // Add foreign key constraint for handover_staff_id
            $table->foreign('handover_staff_id')
                ->references('id')
                ->on('staff')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_applications', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['handover_staff_id']);
            
            // Drop columns
            $table->dropColumn('public_holidays');
            $table->dropColumn('handover_staff_id');
        });
    }
};
