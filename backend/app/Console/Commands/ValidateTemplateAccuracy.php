<?php

namespace App\Console\Commands;

use App\Services\TemplateValidationService;
use Illuminate\Console\Command;

class ValidateTemplateAccuracy extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:validate-accuracy 
                           {--templates=* : Specific template IDs to validate (default: 22,13,17)}
                           {--detailed : Show detailed comparison results}
                           {--report : Generate full validation report}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate new template system accuracy against preserved legacy templates';

    private TemplateValidationService $validationService;

    /**
     * Create a new command instance.
     */
    public function __construct(TemplateValidationService $validationService)
    {
        parent::__construct();
        $this->validationService = $validationService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Starting Template Accuracy Validation...');
        $this->newLine();

        // Get template IDs to validate
        $templateIds = $this->option('templates') ?: [22, 13, 17];
        if (is_string($templateIds)) {
            $templateIds = explode(',', $templateIds);
        }
        $templateIds = array_map('intval', $templateIds);

        $this->info("Validating templates: " . implode(', ', $templateIds));
        $this->newLine();

        // Run validation
        $results = $this->validationService->validateAgainstLegacyTemplates($templateIds);

        // Display results
        $this->displayValidationSummary($results);

        if ($this->option('detailed')) {
            $this->displayDetailedResults($results);
        }

        if ($this->option('report')) {
            $this->generateAndDisplayReport($templateIds);
        }

        // Exit with appropriate code
        return $results['is_production_ready'] ? 0 : 1;
    }

    /**
     * Display validation summary
     */
    private function displayValidationSummary(array $results): void
    {
        $this->info('📊 VALIDATION SUMMARY');
        $this->line('==================');

        // Overall accuracy
        $accuracyColor = $results['overall_accuracy'] >= 99.9 ? 'green' : 'red';
        $this->line(sprintf(
            'Overall Accuracy: <%s>%.2f%%</%s>',
            $accuracyColor,
            $results['overall_accuracy'],
            $accuracyColor
        ));

        $this->line('Templates Tested: ' . $results['total_templates_tested']);

        $statusIcon = $results['is_production_ready'] ? '✅' : '❌';
        $statusColor = $results['is_production_ready'] ? 'green' : 'red';
        $this->line(sprintf(
            'Production Ready: %s <%s>%s</%s>',
            $statusIcon,
            $statusColor,
            $results['is_production_ready'] ? 'YES' : 'NO',
            $statusColor
        ));

        $this->newLine();

        // Individual template results
        $this->info('📋 TEMPLATE RESULTS');
        $this->line('==================');

        $headers = ['Template ID', 'Pay Grade', 'Accuracy %', 'Status', 'Issues'];
        $tableData = [];

        foreach ($results['individual_results'] as $templateId => $result) {
            if ($result['success']) {
                $status = $result['test_passed'] ? '✅ PASS' : '❌ FAIL';
                $statusColor = $result['test_passed'] ? 'green' : 'red';

                $tableData[] = [
                    $templateId,
                    $result['pay_grade'],
                    sprintf('%.2f%%', $result['accuracy_percentage']),
                    sprintf('<%s>%s</%s>', $statusColor, $status, $statusColor),
                    count($result['differences'])
                ];
            } else {
                $tableData[] = [
                    $templateId,
                    'N/A',
                    'N/A',
                    '<red>❌ ERROR</red>',
                    $result['error']
                ];
            }
        }

        $this->table($headers, $tableData);
        $this->newLine();
    }

    /**
     * Display detailed validation results
     */
    private function displayDetailedResults(array $results): void
    {
        $this->info('🔍 DETAILED RESULTS');
        $this->line('==================');

        foreach ($results['individual_results'] as $templateId => $result) {
            if (!$result['success']) {
                $this->error("Template {$templateId}: " . $result['error']);
                continue;
            }

            $this->info("Template {$templateId} (Grade {$result['pay_grade']}):");
            $this->line("  Accuracy: {$result['accuracy_percentage']}%");
            $this->line("  Test employees: {$result['test_employees_count']}");

            if (!empty($result['differences'])) {
                $this->warn("  Calculation differences found:");

                foreach ($result['differences'] as $field => $fieldDiffs) {
                    $this->line("    📊 Field: {$field}");
                    foreach ($fieldDiffs as $diff) {
                        $this->line(sprintf(
                            "      Employee %s: Legacy=%.2f, New=%.2f, Diff=%.2f (%.2f%%)",
                            $diff['employee_id'],
                            $diff['legacy_value'],
                            $diff['new_value'],
                            $diff['difference'],
                            $diff['percentage_diff']
                        ));
                    }
                }
            } else {
                $this->info("  ✅ All calculations match perfectly!");
            }

            $this->newLine();
        }
    }

    /**
     * Generate and display full validation report
     */
    private function generateAndDisplayReport(array $templateIds): void
    {
        $this->info('📄 GENERATING VALIDATION REPORT');
        $this->line('==============================');

        $report = $this->validationService->generateValidationReport($templateIds);

        // Display validation summary
        $this->info('Summary:');
        $this->line("  Timestamp: {$report['validation_summary']['timestamp']}");
        $this->line("  Overall Accuracy: {$report['validation_summary']['overall_accuracy']}%");
        $this->line("  Production Ready: " . ($report['validation_summary']['is_production_ready'] ? 'YES' : 'NO'));
        $this->newLine();

        // Display recommendations
        if (!empty($report['recommendations'])) {
            $this->warn('Recommendations:');
            foreach ($report['recommendations'] as $recommendation) {
                $this->line("  • {$recommendation}");
            }
            $this->newLine();
        }

        // Display next steps
        $this->info('Next Steps:');
        foreach ($report['next_steps'] as $step) {
            $this->line("  • {$step}");
        }
        $this->newLine();

        // Option to save report to file
        if ($this->confirm('Save detailed report to file?')) {
            $filename = 'validation_report_' . now()->format('Y-m-d_H-i-s') . '.json';
            $filepath = storage_path("app/reports/{$filename}");

            // Ensure directory exists
            if (!is_dir(dirname($filepath))) {
                mkdir(dirname($filepath), 0755, true);
            }

            file_put_contents($filepath, json_encode($report, JSON_PRETTY_PRINT));
            $this->info("Report saved to: {$filepath}");
        }
    }
}
