<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalculationTemplate;
use App\Models\Client;

class VerifyUploadedTemplates extends Command
{
    protected $signature = 'templates:verify-upload';
    protected $description = 'Verify the uploaded calculation templates';

    public function handle()
    {
        $this->info("🔍 Verifying uploaded calculation templates...");

        // Get recently created templates
        $templates = CalculationTemplate::where('created_by', 'excel_upload')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        if ($templates->isEmpty()) {
            $this->warn("No uploaded templates found.");
            return 0;
        }

        $this->info("📊 Found {$templates->count()} uploaded templates:");
        $this->line("");

        foreach ($templates as $template) {
            $this->displayTemplateInfo($template);
            $this->line("----------------------------------------");
        }

        return 0;
    }

    private function displayTemplateInfo(CalculationTemplate $template)
    {
        $this->line("🎯 Template ID: {$template->id}");
        $this->line("📝 Name: {$template->name}");
        $this->line("🏢 Pay Grade: {$template->pay_grade_code}");
        $this->line("📅 Created: {$template->created_at}");

        // Count components
        $salaryCount = count($template->salary_components ?? []);
        $allowanceCount = count($template->allowance_components ?? []);
        $deductionCount = count($template->deduction_components ?? []);
        $statutoryCount = count($template->statutory_components ?? []);

        $this->line("📊 Components:");
        $this->line("   • Salary: {$salaryCount}");
        $this->line("   • Allowances: {$allowanceCount}");
        $this->line("   • Deductions: {$deductionCount}");
        $this->line("   • Statutory: {$statutoryCount}");

        // Show formulas
        $formulas = $template->formulas;
        $formulaCount = count($formulas);
        $this->line("🔢 Formulas ({$formulaCount}):");
        foreach ($formulas as $name => $formula) {
            $this->line("   • {$name}: {$formula}");
        }

        $this->line("");
    }
}
