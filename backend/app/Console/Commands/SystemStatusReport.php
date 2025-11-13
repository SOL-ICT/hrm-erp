<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Client;
use App\Models\CalculationTemplate;
use App\Models\ExportTemplate;
use Illuminate\Support\Facades\Storage;

class SystemStatusReport extends Command
{
    protected $signature = 'system:status';
    protected $description = 'Generate comprehensive system status report';

    public function handle()
    {
        $this->info("🏗️  HRM-ERP System Status Report");
        $this->line("=" . str_repeat("=", 50));
        $this->line("Generated: " . now()->format('Y-m-d H:i:s T'));
        $this->line("");

        // 1. System Overview
        $this->info("📊 System Overview");
        $this->line("-" . str_repeat("-", 30));

        $clientCount = Client::count();
        $calcTemplateCount = CalculationTemplate::count();
        $exportTemplateCount = ExportTemplate::count();
        $activeCalcTemplates = CalculationTemplate::where('is_active', true)->count();
        $activeExportTemplates = ExportTemplate::where('is_active', true)->count();

        $this->line("Clients: {$clientCount}");
        $this->line("Calculation Templates: {$calcTemplateCount} ({$activeCalcTemplates} active)");
        $this->line("Export Templates: {$exportTemplateCount} ({$activeExportTemplates} active)");

        // 2. Client Status
        $this->info("\n👥 Client Status");
        $this->line("-" . str_repeat("-", 30));

        $clients = Client::select('id', 'organisation_name')->get();
        foreach ($clients as $client) {
            $hasExportTemplate = ExportTemplate::where('client_id', $client->id)->exists();
            $templateStatus = $hasExportTemplate ? "✅" : "❌";
            $this->line("ID {$client->id}: {$client->organisation_name} {$templateStatus}");
        }

        // 3. Template Coverage Analysis
        $this->info("\n📋 Template Coverage Analysis");
        $this->line("-" . str_repeat("-", 30));

        $clientsWithTemplates = ExportTemplate::distinct('client_id')->count();
        $coverage = $clientCount > 0 ? round(($clientsWithTemplates / $clientCount) * 100, 1) : 0;

        $this->line("Export Template Coverage: {$clientsWithTemplates}/{$clientCount} clients ({$coverage}%)");

        // Missing templates
        $clientsWithoutTemplates = Client::whereNotIn(
            'id',
            ExportTemplate::pluck('client_id')->toArray()
        )->get();

        if ($clientsWithoutTemplates->isNotEmpty()) {
            $this->warn("⚠️  Clients missing export templates:");
            foreach ($clientsWithoutTemplates as $client) {
                $this->line("   • {$client->organisation_name}");
            }
        } else {
            $this->info("✅ All clients have export templates!");
        }

        // 4. Template Configuration Status
        $this->info("\n⚙️  Template Configuration Status");
        $this->line("-" . str_repeat("-", 30));

        $defaultTemplates = ExportTemplate::where('is_default', true)->count();
        $formatBreakdown = ExportTemplate::selectRaw('format, COUNT(*) as count')
            ->groupBy('format')
            ->pluck('count', 'format')
            ->toArray();

        $this->line("Default Templates: {$defaultTemplates}");
        $this->line("Format Distribution:");
        foreach ($formatBreakdown as $format => $count) {
            $this->line("   • {$format}: {$count}");
        }

        // 5. Storage Analysis
        $this->info("\n💾 Storage Analysis");
        $this->line("-" . str_repeat("-", 30));

        $exportPath = storage_path('app/exports');
        if (is_dir($exportPath)) {
            $files = glob($exportPath . '/*');
            $fileCount = count($files);

            if ($fileCount > 0) {
                $totalSize = 0;
                $recentFiles = [];

                foreach ($files as $file) {
                    if (is_file($file)) {
                        $totalSize += filesize($file);
                        $recentFiles[] = [
                            'name' => basename($file),
                            'size' => filesize($file),
                            'modified' => filemtime($file)
                        ];
                    }
                }

                // Sort by modification time (newest first)
                usort($recentFiles, function ($a, $b) {
                    return $b['modified'] - $a['modified'];
                });

                $this->line("Export Files: {$fileCount}");
                $this->line("Total Size: " . $this->formatBytes($totalSize));

                $this->line("Recent Files:");
                foreach (array_slice($recentFiles, 0, 5) as $file) {
                    $size = $this->formatBytes($file['size']);
                    $date = date('Y-m-d H:i', $file['modified']);
                    $this->line("   • {$file['name']} ({$size}, {$date})");
                }

                if ($fileCount > 5) {
                    $this->line("   ... and " . ($fileCount - 5) . " more files");
                }
            } else {
                $this->line("Export Files: 0 (No exports generated yet)");
            }
        } else {
            $this->line("Export Directory: Not found");
        }

        // 6. System Health Check
        $this->info("\n🔍 System Health Check");
        $this->line("-" . str_repeat("-", 30));

        $healthChecks = [
            'Database Connection' => $this->checkDatabaseConnection(),
            'Calculation Templates' => $calcTemplateCount > 0,
            'Export Templates' => $exportTemplateCount > 0,
            'Client Data' => $clientCount > 0,
            'Template Coverage' => $coverage >= 90,
            'Export Directory' => is_dir($exportPath) && is_writable($exportPath),
        ];

        foreach ($healthChecks as $check => $status) {
            $icon = $status ? "✅" : "❌";
            $this->line("{$icon} {$check}");
        }

        // 7. Recommendations
        $this->info("\n💡 Recommendations");
        $this->line("-" . str_repeat("-", 30));

        if ($coverage < 100) {
            $this->line("• Run 'php artisan export-templates:create-defaults' to create missing templates");
        }

        if ($calcTemplateCount === 0) {
            $this->line("• Create calculation templates using bulk upload");
        }

        if (!isset($formatBreakdown['excel'])) {
            $this->line("• Consider creating Excel export templates for better compatibility");
        }

        if ($fileCount > 100) {
            $this->line("• Consider implementing export file cleanup to manage storage");
        }

        if (count($healthChecks) === count(array_filter($healthChecks))) {
            $this->info("\n🎉 System Status: HEALTHY");
            $this->line("All systems operational and ready for production use!");
        } else {
            $this->warn("\n⚠️  System Status: NEEDS ATTENTION");
            $this->line("Some issues detected. Please review recommendations above.");
        }

        return 0;
    }

    private function checkDatabaseConnection(): bool
    {
        try {
            Client::count();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function formatBytes(int $size): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $power = $size > 0 ? floor(log($size, 1024)) : 0;
        return number_format($size / pow(1024, $power), 2) . ' ' . $units[$power];
    }
}
