<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use App\Services\ExportTemplateService;

class TestExportGeneration extends Command
{
    protected $signature = 'test:export-generation {--client-id=1}';
    protected $description = 'Test export generation with actual calculation template data';

    protected $exportService;

    public function __construct(ExportTemplateService $exportService)
    {
        parent::__construct();
        $this->exportService = $exportService;
    }

    public function handle()
    {
        $clientId = $this->option('client-id');

        $this->info("🧪 Testing Export Generation for Client ID: {$clientId}");
        $this->line("=======================================================");

        // Get any calculation template (they are not client-specific)
        $calculationTemplate = CalculationTemplate::where('is_active', true)->first();

        if (!$calculationTemplate) {
            $this->error("❌ No active calculation template found");
            return 1;
        }

        $this->info("✅ Found calculation template: {$calculationTemplate->name}");
        $this->line("   Pay Grade: {$calculationTemplate->pay_grade_code}");
        $this->line("   Description: {$calculationTemplate->description}");

        // Create sample invoice data based on the calculation template structure
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
            ],
            [
                'employee_id' => 'EMP002',
                'employee_name' => 'Jane Smith',
                'designation' => 'Project Manager',
                'basic_salary' => 450000,
                'housing_allowance' => 150000,
                'transport_allowance' => 75000,
                'lunch_allowance' => 37500,
                'gross_salary' => 712500,
                'income_tax' => 85500,
                'pension' => 21375,
                'net_salary' => 605625,
                'payment_date' => now()->format('Y-m-d'),
                'period' => now()->format('F Y'),
                'generated_at' => now()->format('Y-m-d H:i:s'),
                'payment_reference' => 'REF-' . strtoupper(uniqid()),
                'employee_bank' => 'Access Bank',
            ]
        ];

        try {
            $this->info("\n🚀 Generating export...");

            // Get the export template for this client
            $exportTemplate = ExportTemplate::where('client_id', $clientId)
                ->where('is_default', true)
                ->first();

            if (!$exportTemplate) {
                $this->error("❌ No export template found for client ID {$clientId}");
                return 1;
            }

            $this->line("📋 Using template: {$exportTemplate->name}");

            $result = $this->exportService->generateExport(
                $exportTemplate,
                $invoiceData,
                [
                    'filename' => 'test-export-' . now()->format('Y-m-d-H-i-s'),
                    'title' => 'Test Export for ' . $exportTemplate->client->organisation_name
                ]
            );

            $this->info("✅ Export generated successfully!");
            $this->line("📁 File info:");
            $this->line("   Content type: " . ($result['content_type'] ?? 'unknown'));
            $this->line("   Filename: " . ($result['filename'] ?? 'unknown'));

            if (isset($result['file_path']) && file_exists($result['file_path'])) {
                $fileSize = filesize($result['file_path']);
                $this->line("   File size: " . number_format($fileSize) . " bytes");
                $this->line("   Path: {$result['file_path']}");
                $this->info("🎉 Export test completed successfully!");
            } else {
                $this->info("📄 Export data generated (in-memory)");
                if (isset($result['content'])) {
                    $this->line("   Content length: " . strlen($result['content']) . " bytes");
                }
            }
        } catch (\Exception $e) {
            $this->error("❌ Export generation failed:");
            $this->error("   " . $e->getMessage());
            $this->line("   File: " . $e->getFile() . ":" . $e->getLine());
            return 1;
        }

        return 0;
    }
}
