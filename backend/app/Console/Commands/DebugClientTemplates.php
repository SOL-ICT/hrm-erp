<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Client;
use App\Models\ExportTemplate;

class DebugClientTemplates extends Command
{
    protected $signature = 'debug:client-templates';
    protected $description = 'Debug client and export template relationship';

    public function handle()
    {
        $this->info("🔍 Debugging Client and Export Template Relationships");
        $this->line("====================================================");

        // Show clients
        $this->info("\n📋 Clients:");
        $clients = Client::select('id', 'organisation_name')->get();
        foreach ($clients as $client) {
            $this->line("ID {$client->id}: {$client->organisation_name}");
        }

        // Show export templates
        $this->info("\n📊 Export Templates:");
        $templates = ExportTemplate::with('client')->get();
        foreach ($templates as $template) {
            $this->line("ID {$template->id}: {$template->name}");
            $this->line("   Client ID: {$template->client_id} ({$template->client->organisation_name})");
        }

        // Show one template detail
        if ($templates->isNotEmpty()) {
            $firstTemplate = $templates->first();
            $this->info("\n🔍 Sample Template Details (ID {$firstTemplate->id}):");
            $this->line("Name: {$firstTemplate->name}");
            $this->line("Client: {$firstTemplate->client->organisation_name}");
            $this->line("Format: {$firstTemplate->format}");
            $this->line("Columns: " . count($firstTemplate->column_mappings ?? []));

            if (!empty($firstTemplate->column_mappings)) {
                $this->line("Sample columns:");
                $count = 0;
                foreach ($firstTemplate->column_mappings as $key => $column) {
                    if ($count < 5) {
                        $this->line("   • {$column['label']} ({$key})");
                        $count++;
                    }
                }
            }
        }

        return 0;
    }
}
