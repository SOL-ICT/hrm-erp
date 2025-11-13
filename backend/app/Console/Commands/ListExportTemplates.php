<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ExportTemplateService;
use App\Models\ExportTemplate;
use App\Models\Client;

class ListExportTemplates extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'export-templates:list {--client-id=} {--format=} {--details}';

    /**
     * The console command description.
     */
    protected $description = 'List all export templates with details';

    private ExportTemplateService $exportTemplateService;

    public function __construct(ExportTemplateService $exportTemplateService)
    {
        parent::__construct();
        $this->exportTemplateService = $exportTemplateService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("📋 Export Templates Overview");
        $this->info("============================");

        $clientId = $this->option('client-id');
        $format = $this->option('format');
        $showDetails = $this->option('details');

        // Build query
        $query = ExportTemplate::with('client')->active();

        if ($clientId) {
            $query->where('client_id', $clientId);
        }

        if ($format) {
            $query->where('format', $format);
        }

        $templates = $query->orderBy('client_id')
            ->orderBy('is_default', 'desc')
            ->get();

        if ($templates->isEmpty()) {
            $this->warn("No export templates found matching the criteria.");
            $this->info("\n💡 Create templates with: php artisan export-templates:create-defaults");
            return 0;
        }

        $this->displayTemplatesSummary($templates);

        if ($showDetails) {
            $this->displayTemplatesDetails($templates);
        }

        $this->displayStatistics($templates);

        return 0;
    }

    private function displayTemplatesSummary($templates): void
    {
        $this->info("📊 Templates Summary:");
        $this->line("====================");

        $headers = ['ID', 'Template Name', 'Client', 'Format', 'Default', 'Last Used'];
        $rows = [];

        foreach ($templates as $template) {
            $rows[] = [
                $template->id,
                $this->truncate($template->name, 30),
                $this->truncate($template->client->organisation_name, 25),
                strtoupper($template->format),
                $template->is_default ? '✅' : '❌',
                $template->last_used_at ? $template->last_used_at->diffForHumans() : 'Never'
            ];
        }

        $this->table($headers, $rows);
    }

    private function displayTemplatesDetails($templates): void
    {
        $this->info("\n🔍 Detailed Template Information:");
        $this->line("================================");

        foreach ($templates as $template) {
            $this->displayTemplateDetail($template);
            $this->line("----------------------------------------");
        }
    }

    private function displayTemplateDetail(ExportTemplate $template): void
    {
        $this->line("🎯 Template ID: {$template->id}");
        $this->line("📝 Name: {$template->name}");
        $this->line("🏢 Client: {$template->client->organisation_name}");
        $this->line("📋 Format: " . strtoupper($template->format));
        $this->line("🔄 Version: {$template->version}");
        $this->line("⭐ Default: " . ($template->is_default ? 'Yes' : 'No'));
        $this->line("📅 Created: {$template->created_at->format('d/m/Y H:i')}");
        $this->line("🕒 Last Used: " . ($template->last_used_at ? $template->last_used_at->format('d/m/Y H:i') : 'Never'));

        // Column mappings count
        $columnCount = count($template->column_mappings ?? []);
        $this->line("📊 Columns: {$columnCount} mapped");

        // Credit to bank model
        if ($template->use_credit_to_bank_model) {
            $this->line("💳 Credit to Bank: Yes ({$template->service_fee_percentage}% fee)");
        }

        // Show some column details
        if (!empty($template->column_mappings)) {
            $this->line("📋 Sample Columns:");
            $count = 0;
            foreach ($template->column_mappings as $key => $column) {
                if ($count < 5) { // Show first 5 columns
                    $this->line("   • {$column['label']} ({$key})");
                    $count++;
                } else {
                    $remaining = count($template->column_mappings) - 5;
                    $this->line("   • ... and {$remaining} more columns");
                    break;
                }
            }
        }

        $this->line("");
    }

    private function displayStatistics($templates): void
    {
        $this->info("\n📈 Statistics:");
        $this->line("==============");

        $stats = [
            'total' => $templates->count(),
            'by_format' => $templates->groupBy('format')->map->count(),
            'default_templates' => $templates->where('is_default', true)->count(),
            'recently_used' => $templates->where('last_used_at', '>', now()->subDays(30))->count(),
            'clients_with_templates' => $templates->unique('client_id')->count(),
            'total_clients' => Client::count()
        ];

        $this->line("📊 Total Templates: {$stats['total']}");
        $this->line("⭐ Default Templates: {$stats['default_templates']}");
        $this->line("🕒 Used in Last 30 Days: {$stats['recently_used']}");
        $this->line("🏢 Clients with Templates: {$stats['clients_with_templates']}/{$stats['total_clients']}");

        $this->line("\n📋 By Format:");
        foreach ($stats['by_format'] as $format => $count) {
            $this->line("   • " . strtoupper($format) . ": {$count}");
        }

        // Show clients without templates
        $clientsWithoutTemplates = Client::whereNotIn('id', $templates->pluck('client_id'))->get();
        if ($clientsWithoutTemplates->isNotEmpty()) {
            $this->warn("\n⚠️  Clients without export templates:");
            foreach ($clientsWithoutTemplates as $client) {
                $this->line("   • {$client->organisation_name} (ID: {$client->id})");
            }
            $this->info("\n💡 Create templates for these clients with:");
            $this->line("   php artisan export-templates:create-defaults");
        }
    }

    private function truncate(string $text, int $length): string
    {
        return strlen($text) > $length ? substr($text, 0, $length - 3) . '...' : $text;
    }
}
