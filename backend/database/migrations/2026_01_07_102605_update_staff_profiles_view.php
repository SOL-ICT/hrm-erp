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
        // Drop the old view if it exists
        DB::statement('DROP VIEW IF EXISTS staff_profiles');

        // Create the updated view
        DB::statement("
            CREATE VIEW staff_profiles AS
            SELECT
                s.id AS staff_id,
                s.employee_code AS employee_code,
                s.first_name AS first_name,
                s.middle_name AS middle_name,
                s.last_name AS last_name,
                s.job_title AS job_title,
                s.email AS email,
                s.entry_date AS entry_date,
                s.location AS location,
                s.client_id AS client_id,
                c.organisation_name AS organisation_name,
                c.prefix AS prefix,
                s.department AS department,
                s.status AS status,
                sc.name AS category_name,
                sc.annual_leave_allowance AS leave_entitlement,
                sc.max_transferable_days AS max_transferable_days,
                spi.mobile_phone AS mobile_phone,
                spi.current_address AS current_address,
                spi.state_of_residence AS state_of_residence,
                spi.marital_status AS marital_status,
                sli.national_id_no AS national_id_no,
                sb.account_number AS account_number,
                sb.bank_name AS bank_name
            FROM staff s
            LEFT JOIN staff_categories sc ON s.category_id = sc.id
            LEFT JOIN staff_personal_info spi ON s.id = spi.staff_id
            LEFT JOIN staff_legal_ids sli ON s.id = sli.staff_id
            LEFT JOIN staff_banking sb ON s.id = sb.staff_id
            LEFT JOIN clients c ON s.client_id = c.id
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
