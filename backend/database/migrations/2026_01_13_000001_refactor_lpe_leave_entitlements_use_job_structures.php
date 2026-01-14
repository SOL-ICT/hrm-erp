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
        // Use raw SQL to handle the migration safely
        DB::statement('
            ALTER TABLE lpe_leave_entitlements
            DROP COLUMN staff_level_id,
            ADD COLUMN job_structure_id BIGINT UNSIGNED AFTER client_id,
            ADD CONSTRAINT lpe_leave_entitlements_job_structure_id_foreign
                FOREIGN KEY (job_structure_id) REFERENCES job_structures(id) ON DELETE CASCADE
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('
            ALTER TABLE lpe_leave_entitlements
            DROP FOREIGN KEY lpe_leave_entitlements_job_structure_id_foreign,
            DROP COLUMN job_structure_id,
            ADD COLUMN staff_level_id BIGINT UNSIGNED AFTER client_id,
            ADD CONSTRAINT lpe_leave_entitlements_staff_level_id_foreign
                FOREIGN KEY (staff_level_id) REFERENCES lpe_staff_levels(id) ON DELETE CASCADE
        ');
    }
};
