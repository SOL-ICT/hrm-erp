<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Populate supervisor_email_sent for existing leave applications
        // by joining with staff_supervisors table to get the most recent supervisor email
        DB::statement('
            UPDATE leave_applications la
            JOIN staff_supervisors ss ON la.staff_id = ss.staff_id
            SET la.supervisor_email_sent = ss.supervisor_email
            WHERE la.supervisor_email_sent IS NULL
            AND ss.is_active = 1
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't reverse this - data should persist
    }
};
