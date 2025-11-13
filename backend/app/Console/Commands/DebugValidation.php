<?php

namespace App\Console\Commands;

use App\Services\TemplateValidationService;
use App\Models\InvoiceTemplate;
use App\Models\CalculationTemplate;
use Illuminate\Console\Command;

class DebugValidation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:validation {template_id=22}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug validation process for a specific template';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $templateId = (int) $this->argument('template_id');
        $validationService = app(TemplateValidationService::class);

        $this->info("Debugging validation for template {$templateId}");
        $this->newLine();

        // Show template structures first
        $legacyTemplate = InvoiceTemplate::find($templateId);
        $newTemplate = CalculationTemplate::where('pay_grade_code', $legacyTemplate->payGradeStructure->grade_code)->first();

        $this->info("Legacy Template Structure:");
        $legacyFields = $legacyTemplate->toArray();
        foreach ($legacyFields as $key => $value) {
            if (strpos($key, '_formula') !== false && !empty($value)) {
                $this->line("  {$key}: {$value}");
            }
        }
        $this->newLine();

        $this->info("New Template Formulas:");
        foreach ($newTemplate->formulas as $field => $formula) {
            $this->line("  {$field}: {$formula}");
        }
        $this->newLine();

        $result = $validationService->validateSingleTemplate($templateId);

        if (!$result['success']) {
            $this->error("Validation failed: " . $result['error']);
            return 1;
        }

        $this->info("Basic Info:");
        $this->line("- Legacy Template ID: {$result['legacy_template_id']}");
        $this->line("- New Template ID: {$result['new_template_id']}");
        $this->line("- Pay Grade: {$result['pay_grade']}");
        $this->line("- Test Employees: {$result['test_employees_count']}");
        $this->line("- Accuracy: {$result['accuracy_percentage']}%");
        $this->newLine();

        $this->info("Legacy Results (first employee):");
        if (!empty($result['legacy_results'])) {
            $first = $result['legacy_results'][0];
            foreach ($first as $key => $value) {
                if (is_numeric($value)) {
                    $this->line("  {$key}: " . number_format($value, 2));
                } else {
                    $this->line("  {$key}: {$value}");
                }
            }
        }
        $this->newLine();

        $this->info("New Results (first employee):");
        if (!empty($result['new_results'])) {
            $first = $result['new_results'][0];
            foreach ($first as $key => $value) {
                if (is_numeric($value)) {
                    $this->line("  {$key}: " . number_format($value, 2));
                } else {
                    $this->line("  {$key}: {$value}");
                }
            }
        }
        $this->newLine();

        if (!empty($result['differences'])) {
            $this->warn("Differences found:");
            foreach ($result['differences'] as $field => $diffs) {
                $this->line("Field: {$field}");
                foreach ($diffs as $diff) {
                    $this->line("  Employee {$diff['employee_id']}: Legacy={$diff['legacy_value']}, New={$diff['new_value']}, Diff={$diff['difference']}");
                }
            }
        } else {
            $this->info("No differences found in calculations");
        }

        $this->newLine();
        $this->info("Field Accuracy:");
        foreach ($result['field_accuracy'] as $field => $accuracy) {
            $this->line("  {$field}: {$accuracy['matches']}/{$accuracy['total']} ({$accuracy['accuracy_percentage']}%)");
        }

        return 0;
    }
}
