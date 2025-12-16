<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateMissingPermissions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'rbac:generate-missing-permissions {--dry-run : Show what would be created without actually creating}';

    /**
     * The console command description.
     */
    protected $description = 'Generate missing permission records for submodules that have none';

    /**
     * Standard permission types for each submodule
     */
    private $permissionTypes = ['read', 'create', 'update', 'delete'];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info("🔍 DRY RUN MODE - No changes will be made");
            $this->newLine();
        }

        // Get all active submodules with their modules
        $submodules = DB::table('submodules as s')
            ->join('modules as m', 's.module_id', '=', 'm.id')
            ->where('s.is_active', true)
            ->where('m.is_active', true)
            ->select('s.id as submodule_id', 's.name as submodule_name', 's.slug as submodule_slug', 
                     'm.name as module_name', 'm.slug as module_slug')
            ->get();

        $this->info("Found {$submodules->count()} active submodules");
        $this->newLine();

        $totalCreated = 0;
        $submodulesFixed = 0;

        foreach ($submodules as $submodule) {
            // Check if this submodule has any permissions
            $existingCount = DB::table('permissions')
                ->where('submodule_id', $submodule->submodule_id)
                ->count();

            if ($existingCount === 0) {
                $this->line("⚠️  {$submodule->module_name} > {$submodule->submodule_name} (0 permissions)");
                
                $created = 0;
                foreach ($this->permissionTypes as $permType) {
                    $permissionSlug = $permType;
                    $permissionName = ucfirst($permType) . ' ' . $submodule->submodule_name;

                    if ($dryRun) {
                        $this->line("   Would create: {$permissionSlug}");
                        $created++;
                    } else {
                        DB::table('permissions')->insert([
                            'submodule_id' => $submodule->submodule_id,
                            'name' => $permissionName,
                            'slug' => $permissionSlug,
                            'description' => ucfirst($permType) . ' access to ' . $submodule->submodule_name,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                        $this->line("   ✓ Created: {$permissionSlug}");
                        $created++;
                    }
                }

                $totalCreated += $created;
                $submodulesFixed++;
                $this->newLine();
            }
        }

        $this->newLine();
        if ($dryRun) {
            $this->info("📊 DRY RUN SUMMARY:");
            $this->info("   Would fix {$submodulesFixed} submodules");
            $this->info("   Would create {$totalCreated} permissions");
            $this->newLine();
            $this->info("Run without --dry-run to actually create the permissions");
        } else {
            $this->info("✅ COMPLETED!");
            $this->info("   Fixed {$submodulesFixed} submodules");
            $this->info("   Created {$totalCreated} permissions");
            $this->newLine();
            $this->info("💡 Next step: Run 'php artisan rbac:seed-super-admin' to grant these to Super Admin role");
        }

        return 0;
    }
}
