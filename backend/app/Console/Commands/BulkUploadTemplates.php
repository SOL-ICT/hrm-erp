<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TemplateUploadService;
use App\Models\CalculationTemplate;
use Illuminate\Support\Facades\Storage;

class BulkUploadTemplates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:bulk-upload {file} {--validate-only} {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bulk upload calculation templates from Excel file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->argument('file');
        $validateOnly = $this->option('validate-only');
        $dryRun = $this->option('dry-run');

        $this->info("🚀 Starting bulk template upload...");
        $this->info("📁 File: {$filePath}");

        if ($validateOnly) {
            $this->info("🔍 Validation-only mode: Will not create templates");
        }

        if ($dryRun) {
            $this->info("🧪 Dry-run mode: Will not save to database");
        }

        // Check if file exists
        if (!file_exists($filePath)) {
            $this->error("❌ File not found: {$filePath}");
            return 1;
        }

        try {
            $uploadService = new TemplateUploadService();

            $this->info("\n📊 Processing Excel file...");
            $result = $uploadService->processExcelFile($filePath, [
                'validate_only' => $validateOnly,
                'dry_run' => $dryRun,
                'progress_callback' => function ($current, $total, $templateName) {
                    $this->line("   Processing {$current}/{$total}: {$templateName}");
                }
            ]);

            $this->displayResults($result);

            return $result['success'] ? 0 : 1;
        } catch (\Exception $e) {
            $this->error("❌ Upload failed: " . $e->getMessage());
            $this->error("📍 Stack trace: " . $e->getTraceAsString());
            return 1;
        }
    }

    private function displayResults(array $result)
    {
        $this->info("\n📈 UPLOAD RESULTS");
        $this->info("================");

        $this->line("✅ Successfully processed: {$result['processed']} templates");
        $this->line("❌ Failed: {$result['failed']} templates");
        $this->line("⚠️  Warnings: {$result['warnings']} items");

        if (!empty($result['errors'])) {
            $this->error("\n❌ ERRORS:");
            foreach ($result['errors'] as $error) {
                $this->error("   • {$error}");
            }
        }

        if (!empty($result['warnings_list'])) {
            $this->warn("\n⚠️  WARNINGS:");
            foreach ($result['warnings_list'] as $warning) {
                $this->warn("   • {$warning}");
            }
        }

        if (!empty($result['created_templates'])) {
            $this->info("\n📝 CREATED TEMPLATES:");
            foreach ($result['created_templates'] as $template) {
                $this->line("   • ID {$template['id']}: {$template['name']} ({$template['client_name']})");
            }
        }

        $this->info("\n🎯 Upload " . ($result['success'] ? 'COMPLETED' : 'FAILED'));
    }
}
