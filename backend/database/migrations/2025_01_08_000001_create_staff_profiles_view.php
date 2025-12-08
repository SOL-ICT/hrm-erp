<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create staff_profiles view that includes leave entitlement from categories
        DB::statement("
            CREATE OR REPLACE VIEW staff_profiles AS
            SELECT 
                s.id AS staff_id,
                s.employee_code,
                s.first_name,
                s.middle_name,
                s.last_name,
                s.job_title,
                s.email,
                s.entry_date,
                s.location,
                s.client_id,
                s.department,
                s.status,
                sc.name AS category_name,
                sc.annual_leave_allowance AS leave_entitlement,
                sc.max_transferable_days,
                spi.mobile_phone,
                spi.current_address,
                spi.state_of_residence,
                spi.marital_status,
                sli.national_id_no,
                sb.account_number,
                sb.bank_name
            FROM staff s
            LEFT JOIN staff_categories sc ON s.category_id = sc.id
            LEFT JOIN staff_personal_info spi ON s.id = spi.staff_id
            LEFT JOIN staff_legal_ids sli ON s.id = sli.staff_id
            LEFT JOIN staff_banking sb ON s.id = sb.staff_id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP VIEW IF EXISTS staff_profiles');
    }
};
