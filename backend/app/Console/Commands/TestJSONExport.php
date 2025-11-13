<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ExportTemplate;
use App\Services\ExportTemplateService;

class TestJSONExport extends Command
{
    protected $signature = 'test:json-export {--client-id=32}';
    protected $description = 'Test JSON export generation';

    protected $exportService;

    public function __construct(ExportTemplateService $exportService)
    {
        parent::__construct();
        $this->exportService = $exportService;
    }

    public function handle()
    {
        $clientId = $this->option('client-id');

        $this->info("🧪 Testing JSON Export Generation for Client ID: {$clientId}");
        $this->line("=========================================================");

        // Create a test JSON export template
        $exportTemplate = ExportTemplate::where('client_id', $clientId)->first();

        if (!$exportTemplate) {
            $this->error("❌ No export template found for client ID {$clientId}");
            return 1;
        }

        // Update to JSON format for testing
        $originalFormat = $exportTemplate->format;
        $exportTemplate->update(['format' => 'json']);

        $this->info("✅ Using template: {$exportTemplate->name} (format changed to JSON)");

        // Create sample data
        $invoiceData = [
            [
                'employee_id' => 'EMP001',
                'employee_name' => 'John Doe',
                'designation' => 'Software Engineer',
                'basic_salary' => 300000,
                'housing_allowance' => 100000,
                'transport_allowance' => 50000,
                'lunch_allowance' => 25000,
                'gross_salary' => 475000,
                'income_tax' => 47500,
                'pension' => 14250,
                'net_salary' => 413250,
                'payment_date' => now()->format('Y-m-d'),
                'period' => now()->format('F Y'),
                'generated_at' => now()->format('Y-m-d H:i:s'),
                'payment_reference' => 'REF-' . strtoupper(uniqid()),
                'employee_bank' => 'First Bank Nigeria',
            ]
        ];

        try {
            $this->info("\n🚀 Generating JSON export...");

            $result = $this->exportService->generateExport(
                $exportTemplate,
                $invoiceData,
                [
                    'filename' => 'test-json-export-' . now()->format('Y-m-d-H-i-s'),
                    'title' => 'Test JSON Export'
                ]
            );

            $this->info("✅ JSON Export generated successfully!");

            if (isset($result['content'])) {
                $this->line("📄 JSON Content sample (first 500 chars):");
                $this->line(substr($result['content'], 0, 500) . "...");

                // Validate JSON
                $jsonData = json_decode($result['content'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->info("✅ JSON is valid");
                    $this->line("📊 Records count: " . count($jsonData['data'] ?? []));
                } else {
                    $this->error("❌ Invalid JSON generated");
                }
            }
        } catch (\Exception $e) {
            $this->error("❌ JSON Export generation failed:");
            $this->error("   " . $e->getMessage());
        } finally {
            // Restore original format
            $exportTemplate->update(['format' => $originalFormat]);
            $this->line("🔄 Restored original format: {$originalFormat}");
        }

        return 0;
    }
}
