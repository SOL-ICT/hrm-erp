<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanSlateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoice:clean-slate {--confirm : Confirm deletion of non-test templates}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all invoice templates except those marked as [TEST PRESERVED]';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🧹 CLEAN SLATE OPERATION");
        $this->info("========================");
        $this->newLine();

        if (!$this->option('confirm')) {
            $this->error('❌ This command requires --confirm flag');
            $this->warn('⚠️  This will DELETE invoice templates permanently!');
            $this->info('Usage: php artisan invoice:clean-slate --confirm');
            return 1;
        }

        // Count what will be affected
        $allTemplates = DB::table('invoice_templates')->count();
        $preservedTemplates = DB::table('invoice_templates')
            ->where('template_name', 'LIKE', '%[TEST PRESERVED]%')
            ->get(['id', 'template_name']);

        $toDeleteCount = $allTemplates - $preservedTemplates->count();

        $this->info("📊 CLEAN SLATE ANALYSIS:");
        $this->line("┌─────────────────────────────────────┐");
        $this->line("│ Total Templates: " . str_pad($allTemplates, 18) . " │");
        $this->line("│ Templates to PRESERVE: " . str_pad($preservedTemplates->count(), 12) . " │");
        $this->line("│ Templates to DELETE: " . str_pad($toDeleteCount, 14) . " │");
        $this->line("└─────────────────────────────────────┘");
        $this->newLine();

        if ($preservedTemplates->count() === 0) {
            $this->error("❌ No templates marked as [TEST PRESERVED] found!");
            $this->warn("⚠️  You must preserve test templates first:");
            $this->line("   php artisan invoice:preserve-test-templates 1 5 8");
            return 1;
        }

        // Show what will be preserved
        $this->info("🛡️ TEMPLATES TO PRESERVE:");
        foreach ($preservedTemplates as $template) {
            $this->line("  ✓ ID {$template->id}: " . str_replace(' [TEST PRESERVED]', '', $template->template_name));
        }
        $this->newLine();

        // Show what will be deleted
        $toDelete = DB::table('invoice_templates')
            ->join('clients', 'invoice_templates.client_id', '=', 'clients.id')
            ->where('invoice_templates.template_name', 'NOT LIKE', '%[TEST PRESERVED]%')
            ->select(
                'invoice_templates.id',
                'invoice_templates.template_name',
                'clients.organisation_name as client_name'
            )
            ->get();

        if ($toDelete->count() > 0) {
            $this->warn("🗑️ TEMPLATES TO DELETE:");
            foreach ($toDelete as $template) {
                $this->line("  ❌ ID {$template->id}: {$template->client_name} - {$template->template_name}");
            }
            $this->newLine();
        }

        // Final confirmation
        $this->error("⚠️  WARNING: This operation cannot be undone!");
        $this->info("📦 Backup files are available in storage/app/backups/");

        if (!$this->confirm("Are you absolutely sure you want to DELETE {$toDeleteCount} templates?")) {
            $this->info('Operation cancelled - no templates deleted');
            return 0;
        }

        // Create final backup before deletion
        $this->info("💾 Creating final backup before deletion...");
        $finalBackup = [
            'cleanup_timestamp' => now()->toISOString(),
            'preserved_templates' => $preservedTemplates->toArray(),
            'templates_to_delete' => $toDelete->toArray(),
            'total_deleted' => $toDelete->count()
        ];

        $backupFile = "final_backup_before_cleanup_" . date('Y_m_d_H_i_s') . ".json";
        file_put_contents(
            storage_path("app/backups/{$backupFile}"),
            json_encode($finalBackup, JSON_PRETTY_PRINT)
        );
        $this->info("✅ Final backup saved: storage/app/backups/{$backupFile}");

        // Execute deletion
        $this->info("🗑️ Executing clean slate operation...");

        $deleted = DB::table('invoice_templates')
            ->where('template_name', 'NOT LIKE', '%[TEST PRESERVED]%')
            ->delete();

        $this->newLine();
        $this->info("✅ CLEAN SLATE COMPLETE!");
        $this->line("┌─────────────────────────────────────┐");
        $this->line("│ Templates DELETED: " . str_pad($deleted, 17) . " │");
        $this->line("│ Templates PRESERVED: " . str_pad($preservedTemplates->count(), 15) . " │");
        $this->line("│ Remaining Templates: " . str_pad(DB::table('invoice_templates')->count(), 15) . " │");
        $this->line("└─────────────────────────────────────┘");

        $this->newLine();
        $this->info("🎯 WHAT'S NEXT:");
        $this->line("1. ✅ Database cleaned - old templates removed");
        $this->line("2. ✅ Test templates preserved for validation");
        $this->line("3. 🔄 Build new invoice system architecture");
        $this->line("4. 🧪 Test new system against preserved templates");
        $this->line("5. 📤 Bulk upload all client templates using new system");

        $this->newLine();
        $this->info("🚀 Ready to build the new invoice system!");
        $this->warn("⚠️  Preserved templates are INACTIVE - only for testing");

        return 0;
    }
}
