<?php

namespace App\Console\Commands;

use App\Services\SafeFormulaCalculator;
use App\Services\TemplateFormulaConverter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class ConvertPreservedTemplates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:convert-preserved {--export-results}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Convert preserved test templates to use SafeFormulaCalculator';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Converting Preserved Templates to Safe Formula Format');
        $this->info('=======================================================');

        $calculator = new SafeFormulaCalculator();
        $converter = new TemplateFormulaConverter($calculator);

        try {
            // Convert all preserved templates
            $results = $converter->convertAllPreservedTemplates();

            $this->displaySummary($results);
            $this->displayConversionDetails($results);

            // Export results if requested
            if ($this->option('export-results')) {
                $this->exportResults($results);
            }

            $this->newLine();
            $this->info('✅ Template conversion completed successfully!');

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Conversion failed: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Display conversion summary
     */
    private function displaySummary(array $results): void
    {
        $summary = $results['summary'];

        $this->newLine();
        $this->info('📊 CONVERSION SUMMARY');
        $this->line("Templates processed: {$summary['total_templates']}");
        $this->line("Formulas converted: {$summary['total_formulas_converted']}");
        $this->line("Variables identified: {$summary['total_variables_identified']}");

        if ($summary['conversion_issues'] > 0) {
            $this->warn("Issues found: {$summary['conversion_issues']}");
        } else {
            $this->line("Issues found: 0 ✅");
        }

        $this->newLine();
    }

    /**
     * Display detailed conversion results
     */
    private function displayConversionDetails(array $results): void
    {
        foreach ($results['converted_templates'] as $template) {
            $this->info("📋 {$template['template_name']} (ID: {$template['template_id']})");
            $this->line(str_repeat('─', 60));

            // Show custom components
            if (!empty($template['conversion_results']['custom'])) {
                $this->line("🔧 Custom Components:");
                foreach ($template['conversion_results']['custom'] as $result) {
                    $this->displayFormulaResult($result);
                }
            }

            // Show statutory components
            if (!empty($template['conversion_results']['statutory'])) {
                $this->line("⚖️ Statutory Components:");
                foreach ($template['conversion_results']['statutory'] as $result) {
                    $this->displayFormulaResult($result);
                }
            }

            // Show variable mappings
            if (!empty($template['variable_mappings'])) {
                $this->line("📝 Variables Used:");
                foreach ($template['variable_mappings'] as $variable => $mapping) {
                    $type = $mapping['type'];
                    $category = $mapping['component_category'];
                    $this->line("  • {$variable} → {$type} ({$category})");
                }
            }

            $this->newLine();
        }
    }

    /**
     * Display individual formula conversion result
     */
    private function displayFormulaResult(array $result): void
    {
        $status = empty($result['validation_issues']) ? '✅' : '⚠️';
        $this->line("  {$status} {$result['component_name']}");
        $this->line("    Original: {$result['original_formula']}");
        $this->line("    Converted: {$result['converted_formula']}");

        if (!empty($result['validation_issues'])) {
            foreach ($result['validation_issues'] as $issue) {
                $this->warn("    Issue: {$issue}");
            }
        }

        if (!empty($result['conversion_notes'])) {
            foreach ($result['conversion_notes'] as $note) {
                $this->line("    Note: {$note}");
            }
        }

        $this->line("");
    }

    /**
     * Export conversion results to file
     */
    private function exportResults(array $results): void
    {
        $timestamp = now()->format('Y_m_d_H_i_s');
        $filename = "template_conversion_results_{$timestamp}.json";

        Storage::disk('local')->put(
            "backups/{$filename}",
            json_encode($results, JSON_PRETTY_PRINT)
        );

        $this->info("📁 Results exported to: storage/app/backups/{$filename}");
    }
}
