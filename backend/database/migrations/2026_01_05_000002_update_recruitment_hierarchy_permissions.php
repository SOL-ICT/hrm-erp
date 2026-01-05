<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Update recruitment hierarchy permissions:
     * 1. Grant approval rights to Regional Manager and Recruitment roles
     * 2. Grant creation rights to Implant Manager, Regional Technician, and Recruitment Assistant
     *
     * @return void
     */
    public function up()
    {
        // Step 1: Grant approval rights to Regional Manager (role_id 8) and Recruitment (role_id 7)
        DB::table('recruitment_hierarchy')
            ->whereIn('role_id', [7, 8]) // Recruitment, Regional Manager
            ->update([
                'can_approve_request' => 1,
                'updated_at' => now(),
            ]);

        // Step 2: Insert Implant Manager and Regional Technician if they don't exist
        $rolesToInsert = [
            [
                'role_id' => 9, // Implant Manager
                'can_create_request' => 1,
                'can_approve_request' => 0,
                'can_assign_ticket' => 0,
                'can_board_without_approval' => 0,
                'can_approve_boarding' => 0,
                'hierarchy_level' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 15, // Regional Technician
                'can_create_request' => 1,
                'can_approve_request' => 0,
                'can_assign_ticket' => 0,
                'can_board_without_approval' => 0,
                'can_approve_boarding' => 0,
                'hierarchy_level' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($rolesToInsert as $roleData) {
            $exists = DB::table('recruitment_hierarchy')
                ->where('role_id', $roleData['role_id'])
                ->exists();
            
            if (!$exists) {
                DB::table('recruitment_hierarchy')->insert($roleData);
            }
        }

        // Step 3: Grant creation rights to Recruitment Assistant
        DB::table('recruitment_hierarchy')
            ->where('role_id', 10) // Recruitment Assistant
            ->update([
                'can_create_request' => 1,
                'updated_at' => now(),
            ]);

        // Log the changes
        \Log::info('Recruitment hierarchy permissions updated', [
            'approvers_added' => [
                'role_ids' => [7, 8],
                'roles' => ['Recruitment', 'Regional Manager']
            ],
            'creators_added' => [
                'role_ids' => [9, 15, 10],
                'roles' => ['Implant Manager', 'Regional Technician', 'Recruitment Assistant']
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Rollback: Remove approval rights from Regional Manager and Recruitment
        DB::table('recruitment_hierarchy')
            ->whereIn('role_id', [7, 8])
            ->update([
                'can_approve_request' => 0,
                'updated_at' => now(),
            ]);

        // Rollback: Remove creation rights from Recruitment Assistant
        DB::table('recruitment_hierarchy')
            ->where('role_id', 10)
            ->update([
                'can_create_request' => 0,
                'updated_at' => now(),
            ]);

        // Rollback: Delete Implant Manager and Regional Technician entries
        DB::table('recruitment_hierarchy')
            ->whereIn('role_id', [9, 15])
            ->delete();

        \Log::info('Recruitment hierarchy permissions rollback completed');
    }
};
