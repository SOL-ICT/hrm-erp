<?php

namespace App\Console\Commands;

use App\Models\InvoiceTemplate;
use Illuminate\Console\Command;

class ExtractLegacyFormulas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'templates:extract-legacy-formulas {--template=* : Specific template IDs to extract}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Extract formulas from preserved legacy templates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $templateIds = $this->option('template') ?: [22, 13, 17];

        $this->info('🔍 Extracting Legacy Template Formulas...');
        $this->newLine();

        foreach ($templateIds as $templateId) {
            $this->extractFormulasFromTemplate($templateId);
        }

        return 0;
    }

    private function extractFormulasFromTemplate($templateId)
    {
        $template = InvoiceTemplate::with('payGradeStructure')->find($templateId);

        if (!$template) {
            $this->error("Template {$templateId} not found");
            return;
        }

        $gradeCode = $template->payGradeStructure->grade_code;
        $this->info("Template {$templateId} - {$template->template_name} (Grade: {$gradeCode})");
        $this->line(str_repeat('=', 80));

        $fields = $template->toArray();
        $formulaFields = [];
        $nonFormulaFields = [];

        foreach ($fields as $key => $value) {
            if (strpos($key, '_formula') !== false) {
                if (!empty($value)) {
                    $formulaFields[$key] = $value;
                }
            } elseif (!in_array($key, ['id', 'client_id', 'pay_grade_structure_id', 'template_name', 'description', 'created_at', 'updated_at', 'created_by', 'updated_by', 'last_used_at', 'is_active', 'is_default', 'use_credit_to_bank_model', 'service_fee_percentage', 'attendance_calculation_method', 'prorate_salary', 'minimum_attendance_factor', 'custom_components', 'statutory_components', 'calculation_rules'])) {
                if (!empty($value) && is_numeric($value)) {
                    $nonFormulaFields[$key] = $value;
                }
            }
        }

        if (!empty($formulaFields)) {
            $this->info("📊 Formula Fields Found:");
            foreach ($formulaFields as $field => $formula) {
                $cleanField = str_replace('_formula', '', $field);
                $this->line("  {$cleanField}: {$formula}");
            }
        } else {
            $this->warn("❌ No formula fields found");
        }

        if (!empty($nonFormulaFields)) {
            $this->info("💰 Numeric Value Fields:");
            foreach ($nonFormulaFields as $field => $value) {
                $this->line("  {$field}: " . number_format($value, 2));
            }
        }

        // Show custom components if they exist
        if (!empty($template->custom_components)) {
            $this->info("🧩 Custom Components:");
            $components = is_string($template->custom_components) ?
                json_decode($template->custom_components, true) :
                $template->custom_components;

            if (is_array($components)) {
                foreach ($components as $component => $config) {
                    $this->line("  {$component}: " . json_encode($config));
                }
            }
        }

        // Show statutory components if they exist
        if (!empty($template->statutory_components)) {
            $this->info("⚖️ Statutory Components:");
            $components = is_string($template->statutory_components) ?
                json_decode($template->statutory_components, true) :
                $template->statutory_components;

            if (is_array($components)) {
                foreach ($components as $component => $config) {
                    $this->line("  {$component}: " . json_encode($config));
                }
            }
        }

        $this->newLine();
    }
}
