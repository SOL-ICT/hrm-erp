<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ExportTemplateService;
use App\Models\Client;
use App\Models\ExportTemplate;

class CreateDefaultExportTemplates extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'export-templates:create-defaults {--force} {--client-id=}';

    /**
     * The console command description.
     */
    protected $description = 'Create default export templates for all clients';

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
        $this->info("🎯 Creating default export templates...");

        $force = $this->option('force');
        $clientId = $this->option('client-id');

        if ($force) {
            $this->warn("⚠️  Force mode enabled - existing templates will be replaced");
        }

        try {
            if ($clientId) {
                $result = $this->createForSpecificClient($clientId, $force);
            } else {
                $result = $this->createForAllClients($force);
            }

            $this->displayResults($result);

            return $result['created'] > 0 ? 0 : 1;
        } catch (\Exception $e) {
            $this->error("❌ Failed to create export templates: " . $e->getMessage());
            return 1;
        }
    }

    private function createForAllClients(bool $force): array
    {
        if ($force) {
            $this->info("🔄 Removing existing default templates...");
            ExportTemplate::where('is_default', true)->delete();
        }

        return $this->exportTemplateService->createDefaultTemplatesForAllClients();
    }

    private function createForSpecificClient(int $clientId, bool $force): array
    {
        $client = Client::find($clientId);

        if (!$client) {
            throw new \Exception("Client with ID {$clientId} not found");
        }

        $this->info("🏢 Creating template for: {$client->organisation_name}");

        if ($force) {
            ExportTemplate::where('client_id', $clientId)
                ->where('is_default', true)
                ->delete();
        }

        try {
            $template = $this->exportTemplateService->createDefaultTemplateForClient($client);

            return [
                'created' => 1,
                'skipped' => 0,
                'errors' => [],
                'templates' => [[
                    'client_id' => $client->id,
                    'client_name' => $client->organisation_name,
                    'template_id' => $template->id,
                    'template_name' => $template->name
                ]]
            ];
        } catch (\Exception $e) {
            return [
                'created' => 0,
                'skipped' => 0,
                'errors' => ["Client {$client->organisation_name}: " . $e->getMessage()],
                'templates' => []
            ];
        }
    }

    private function displayResults(array $result): void
    {
        $this->info("\n📈 EXPORT TEMPLATE CREATION RESULTS");
        $this->info("===================================");

        $this->line("✅ Created: {$result['created']} templates");
        $this->line("⏭️  Skipped: {$result['skipped']} templates");
        $this->line("❌ Errors: " . count($result['errors']));

        if (!empty($result['errors'])) {
            $this->error("\n❌ ERRORS:");
            foreach ($result['errors'] as $error) {
                $this->error("   • {$error}");
            }
        }

        if (!empty($result['templates'])) {
            $this->info("\n📝 CREATED TEMPLATES:");
            foreach ($result['templates'] as $template) {
                $this->line("   • ID {$template['template_id']}: {$template['template_name']}");
                $this->line("     Client: {$template['client_name']}");
            }
        }

        if ($result['created'] > 0) {
            $this->info("\n🎉 Export template creation completed successfully!");
            $this->info("📊 Templates are ready for invoice generation.");

            $this->info("\n🧪 Next steps:");
            $this->line("   1. Verify templates: php artisan export-templates:list");
            $this->line("   2. Test export: php artisan export-templates:test-export");
            $this->line("   3. Generate invoice: [use your invoice generation command]");
        }
    }
}
