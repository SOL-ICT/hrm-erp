<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PreserveTestTemplatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoice:preserve-test-templates {template_ids* : IDs of templates to preserve for testing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark selected invoice templates as test templates to preserve during clean slate operation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $templateIds = $this->argument('template_ids');

        if (empty($templateIds)) {
            $this->error('❌ No template IDs provided');
            $this->info('Usage: php artisan invoice:preserve-test-templates 1 5 8');
            return 1;
        }

        $this->info("🛡️ PRESERVING TEST TEMPLATES");
        $this->info("============================");
        $this->newLine();

        // Validate template IDs exist
        $existingTemplates = DB::table('invoice_templates')
            ->whereIn('id', $templateIds)
            ->get(['id', 'template_name', 'client_id']);

        if ($existingTemplates->count() !== count($templateIds)) {
            $missing = array_diff($templateIds, $existingTemplates->pluck('id')->toArray());
            $this->error("❌ Template IDs not found: " . implode(', ', $missing));
            return 1;
        }

        // Get client names for display
        $templatesWithClients = DB::table('invoice_templates')
            ->join('clients', 'invoice_templates.client_id', '=', 'clients.id')
            ->join('pay_grade_structures', 'invoice_templates.pay_grade_structure_id', '=', 'pay_grade_structures.id')
            ->whereIn('invoice_templates.id', $templateIds)
            ->select(
                'invoice_templates.id',
                'invoice_templates.template_name',
                'clients.organisation_name as client_name',
                'pay_grade_structures.grade_name',
                'pay_grade_structures.grade_code'
            )
            ->get();

        $this->info("📋 TEMPLATES TO PRESERVE:");
        $this->line("┌─────┬─────────────────────────────────────┬─────────────────────────────────────┐");
        $this->line("│ ID  │ Client                              │ Template                            │");
        $this->line("├─────┼─────────────────────────────────────┼─────────────────────────────────────┤");

        foreach ($templatesWithClients as $template) {
            $this->line(sprintf(
                "│ %-3s │ %-35s │ %-35s │",
                $template->id,
                substr($template->client_name, 0, 35),
                substr("{$template->grade_name} ({$template->grade_code})", 0, 35)
            ));
        }

        $this->line("└─────┴─────────────────────────────────────┴─────────────────────────────────────┘");
        $this->newLine();

        if (!$this->confirm('Mark these templates as TEST PRESERVED? They will be excluded from cleanup.', true)) {
            $this->info('Operation cancelled');
            return 0;
        }

        // Mark templates as test preserved
        $updated = DB::table('invoice_templates')
            ->whereIn('id', $templateIds)
            ->update([
                'template_name' => DB::raw("CONCAT(template_name, ' [TEST PRESERVED]')"),
                'description' => DB::raw("CONCAT(COALESCE(description, ''), '\n\nPRESERVED FOR TESTING NEW INVOICE SYSTEM - DO NOT DELETE')"),
                'is_active' => false, // Don't use in production
                'updated_by' => 'preservation_script',
                'updated_at' => now()
            ]);

        $this->info("✅ Successfully marked {$updated} templates as TEST PRESERVED");
        $this->newLine();

        // Show what was preserved
        $preserved = DB::table('invoice_templates')
            ->join('clients', 'invoice_templates.client_id', '=', 'clients.id')
            ->whereIn('invoice_templates.id', $templateIds)
            ->select(
                'invoice_templates.id',
                'invoice_templates.template_name',
                'clients.organisation_name as client_name'
            )
            ->get();

        $this->info("🛡️ PRESERVED TEMPLATES:");
        foreach ($preserved as $template) {
            $this->line("  ✓ ID {$template->id}: {$template->client_name}");
            $this->line("    Template: {$template->template_name}");
        }

        $this->newLine();
        $this->info("🎯 NEXT STEPS:");
        $this->line("1. Verify preserved templates are correct");
        $this->line("2. Run: php artisan invoice:clean-slate --confirm");
        $this->line("3. This will delete " . (18 - count($templateIds)) . " non-preserved templates");

        $this->newLine();
        $this->info("✅ Templates preserved successfully!");
        $this->warn("⚠️  These templates are now marked as INACTIVE and won't be used in production");
        $this->warn("⚠️  They are ONLY for testing the new system");

        return 0;
    }
}
