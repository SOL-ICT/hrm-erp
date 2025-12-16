<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedSuperAdminPermissions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'rbac:seed-super-admin {--role-id=1 : The role ID to seed permissions for}';

    /**
     * The console command description.
     */
    protected $description = 'Seed all module/submodule permissions for Super Admin role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $roleId = $this->option('role-id');

        // Check if role exists
        $role = DB::table('roles')->where('id', $roleId)->first();
        if (!$role) {
            $this->error("Role with ID {$roleId} not found!");
            return 1;
        }

        $this->info("Seeding all permissions for role: {$role->name} (ID: {$roleId})");

        // Get all active modules
        $modules = DB::table('modules')
            ->where('is_active', true)
            ->get();

        $this->info("Found {$modules->count()} active modules");

        $totalPermissionsAdded = 0;
        $skippedDuplicates = 0;

        foreach ($modules as $module) {
            // Get all active submodules for this module
            $submodules = DB::table('submodules')
                ->where('module_id', $module->id)
                ->where('is_active', true)
                ->get();

            $this->line("  Module: {$module->name} ({$submodules->count()} submodules)");

            foreach ($submodules as $submodule) {
                // Get all permissions for this submodule
                $permissions = DB::table('permissions')
                    ->where('submodule_id', $submodule->id)
                    ->get();

                foreach ($permissions as $permission) {
                    // Check if permission already assigned
                    $exists = DB::table('role_permissions')
                        ->where('role_id', $roleId)
                        ->where('permission_id', $permission->id)
                        ->exists();

                    if (!$exists) {
                        DB::table('role_permissions')->insert([
                            'role_id' => $roleId,
                            'permission_id' => $permission->id,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                        $totalPermissionsAdded++;
                        $this->line("    ✓ Added: {$submodule->slug}.{$permission->slug}");
                    } else {
                        $skippedDuplicates++;
                    }
                }
            }
        }

        $this->newLine();
        $this->info("✅ Seeding complete!");
        $this->info("   Permissions added: {$totalPermissionsAdded}");
        $this->info("   Duplicates skipped: {$skippedDuplicates}");

        // Show total permissions now
        $totalNow = DB::table('role_permissions')->where('role_id', $roleId)->count();
        $this->info("   Total permissions for role: {$totalNow}");

        return 0;
    }
}
