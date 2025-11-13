<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AnalyzeInvoiceTemplatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoice:analyze-templates {--export-backup : Export backup files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyze existing invoice templates and recommend test templates to preserve';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("🔍 ANALYZING INVOICE TEMPLATES");
        $this->info("=====================================");
        $this->newLine();

        // Get all invoice templates
        $templates = DB::table('invoice_templates')
            ->join('clients', 'invoice_templates.client_id', '=', 'clients.id')
            ->join('pay_grade_structures', 'invoice_templates.pay_grade_structure_id', '=', 'pay_grade_structures.id')
            ->select(
                'invoice_templates.*',
                'clients.organisation_name as client_name',
                'pay_grade_structures.grade_name',
                'pay_grade_structures.grade_code'
            )
            ->orderBy('clients.organisation_name')
            ->orderBy('pay_grade_structures.grade_name')
            ->get();

        $this->info("📊 FOUND {$templates->count()} INVOICE TEMPLATES");
        $this->newLine();

        // Group by client for analysis
        $byClient = $templates->groupBy('client_id');

        $this->info("📋 TEMPLATE BREAKDOWN BY CLIENT:");
        $this->line("┌─────────────────────────────────────┬───────────┬─────────────────┬──────────────┐");
        $this->line("│ Client Name                         │ Templates │ Last Used       │ Active       │");
        $this->line("├─────────────────────────────────────┼───────────┼─────────────────┼──────────────┤");

        $totalTemplates = 0;
        $clientSummary = [];

        foreach ($byClient as $clientId => $clientTemplates) {
            $client = $clientTemplates->first();
            $templateCount = $clientTemplates->count();
            $totalTemplates += $templateCount;

            $lastUsed = $clientTemplates->max('last_used_at')
                ? \Carbon\Carbon::parse($clientTemplates->max('last_used_at'))->format('M j, Y')
                : 'Never';

            $activeCount = $clientTemplates->where('is_active', 1)->count();

            $clientSummary[] = [
                'client_id' => $clientId,
                'client_name' => $client->client_name,
                'template_count' => $templateCount,
                'active_count' => $activeCount,
                'last_used' => $lastUsed,
                'templates' => $clientTemplates
            ];

            $this->line(sprintf(
                "│ %-35s │ %9d │ %-15s │ %4d of %-4d │",
                substr($client->client_name, 0, 35),
                $templateCount,
                $lastUsed,
                $activeCount,
                $templateCount
            ));
        }

        $this->line("└─────────────────────────────────────┴───────────┴─────────────────┴──────────────┘");
        $this->newLine();

        // Detailed analysis per client
        $this->info("🔍 DETAILED TEMPLATE ANALYSIS:");
        $this->newLine();

        foreach ($clientSummary as $client) {
            $this->info("📁 CLIENT: {$client['client_name']} ({$client['template_count']} templates)");

            foreach ($client['templates'] as $template) {
                $status = $template->is_active ? '✅ Active' : '❌ Inactive';
                $lastUsed = $template->last_used_at
                    ? \Carbon\Carbon::parse($template->last_used_at)->diffForHumans()
                    : 'Never used';

                $this->line("  └─ {$template->grade_name} ({$template->grade_code}) - {$status} - {$lastUsed}");

                // Analyze template complexity
                $customComponents = json_decode($template->custom_components, true) ?? [];
                $statutoryComponents = json_decode($template->statutory_components, true) ?? [];

                $this->line("     Custom Components: " . count($customComponents));
                $this->line("     Statutory Components: " . count($statutoryComponents));
            }
            $this->newLine();
        }

        // Recommendations for test templates
        $this->info("🎯 RECOMMENDATIONS FOR TEST TEMPLATES:");
        $this->line("=====================================");
        $this->newLine();

        $recommendations = [];
        foreach ($clientSummary as $client) {
            // Recommend most recently used active template per client
            $mostRecent = $client['templates']
                ->where('is_active', 1)
                ->sortByDesc('last_used_at')
                ->first();

            if ($mostRecent) {
                $recommendations[] = $mostRecent;
                $this->info("✅ RECOMMEND PRESERVING:");
                $this->line("   Client: {$client['client_name']}");
                $this->line("   Template: {$mostRecent->grade_name} ({$mostRecent->grade_code})");
                $this->line("   ID: {$mostRecent->id}");
                $this->line("   Reason: Most recently used active template");
                $this->newLine();
            }
        }

        // Export backup if requested
        if ($this->option('export-backup')) {
            $this->exportBackup($templates, $recommendations);
        }

        // Summary
        $this->info("📊 ANALYSIS SUMMARY:");
        $this->line("┌─────────────────────────────────────┐");
        $this->line("│ Total Templates: " . str_pad($totalTemplates, 18) . " │");
        $this->line("│ Active Templates: " . str_pad($templates->where('is_active', 1)->count(), 17) . " │");
        $this->line("│ Clients: " . str_pad(count($clientSummary), 24) . " │");
        $this->line("│ Recommended for Testing: " . str_pad(count($recommendations), 10) . " │");
        $this->line("│ To be Deleted: " . str_pad($totalTemplates - count($recommendations), 16) . " │");
        $this->line("└─────────────────────────────────────┘");

        $this->newLine();
        $this->info("🎯 NEXT STEPS:");
        $this->line("1. Review recommendations above");
        $this->line("2. Run: php artisan invoice:analyze-templates --export-backup");
        $this->line("3. Run: php artisan invoice:preserve-test-templates " . collect($recommendations)->pluck('id')->implode(' '));
        $this->line("4. Run: php artisan invoice:clean-slate --confirm");

        return 0;
    }

    private function exportBackup($templates, $recommendations)
    {
        $this->info("💾 EXPORTING BACKUP FILES...");

        // Ensure backup directory exists
        $backupDir = storage_path('app/backups');
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $timestamp = date('Y_m_d_H_i_s');

        // Export all templates to JSON
        $backup = [
            'exported_at' => now()->toISOString(),
            'total_templates' => $templates->count(),
            'analysis_summary' => [
                'total_clients' => $templates->unique('client_id')->count(),
                'active_templates' => $templates->where('is_active', 1)->count(),
                'recommended_for_testing' => count($recommendations)
            ],
            'templates' => $templates->toArray(),
            'recommendations' => collect($recommendations)->toArray()
        ];

        $jsonFile = "invoice_templates_backup_{$timestamp}.json";
        file_put_contents(
            storage_path("app/backups/{$jsonFile}"),
            json_encode($backup, JSON_PRETTY_PRINT)
        );

        // Export to CSV for Excel compatibility
        $csvFile = "invoice_templates_backup_{$timestamp}.csv";
        $csvData = [];
        $csvData[] = [
            'ID',
            'Client Name',
            'Pay Grade',
            'Template Name',
            'Is Active',
            'Last Used',
            'Custom Components Count',
            'Statutory Components Count',
            'Recommended for Testing'
        ];

        foreach ($templates as $template) {
            $customComponents = json_decode($template->custom_components, true) ?? [];
            $statutoryComponents = json_decode($template->statutory_components, true) ?? [];
            $isRecommended = collect($recommendations)->contains('id', $template->id) ? 'YES' : 'NO';

            $csvData[] = [
                $template->id,
                $template->client_name,
                "{$template->grade_name} ({$template->grade_code})",
                $template->template_name,
                $template->is_active ? 'YES' : 'NO',
                $template->last_used_at ?: 'Never',
                count($customComponents),
                count($statutoryComponents),
                $isRecommended
            ];
        }

        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= '"' . implode('","', $row) . '"' . "\n";
        }

        file_put_contents(storage_path("app/backups/{$csvFile}"), $csvContent);

        $this->info("✅ Backup files created:");
        $this->line("  - storage/app/backups/{$jsonFile}");
        $this->line("  - storage/app/backups/{$csvFile}");
        $this->newLine();

        // Show recommended command for preservation
        if (!empty($recommendations)) {
            $recommendedIds = collect($recommendations)->pluck('id')->implode(' ');
            $this->info("🎯 RECOMMENDED PRESERVATION COMMAND:");
            $this->line("php artisan invoice:preserve-test-templates {$recommendedIds}");
            $this->newLine();
        }
    }
}
