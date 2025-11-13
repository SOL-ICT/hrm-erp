<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CalculationTemplate;

class DebugCalculationTemplate extends Command
{
    protected $signature = 'debug:calc-template {--id=}';
    protected $description = 'Debug calculation template structure';

    public function handle()
    {
        $templateId = $this->option('id');

        if ($templateId) {
            $template = CalculationTemplate::find($templateId);
        } else {
            $template = CalculationTemplate::where('is_active', true)->first();
        }

        if (!$template) {
            $this->error("No template found");
            return 1;
        }

        $this->info("🔍 Template: {$template->name}");
        $this->line("ID: {$template->id}");
        $this->line("Pay Grade: {$template->pay_grade_code}");

        $this->info("\n📊 Allowance Components:");
        foreach ($template->allowance_components as $key => $component) {
            $formula = $component['formula'] ?? 'NULL';
            $description = $component['description'] ?? 'No description';
            $this->line("• {$key}: {$description}");
            $this->line("  Formula: {$formula}");
        }

        $this->info("\n💰 Salary Components:");
        foreach ($template->salary_components as $key => $component) {
            $formula = $component['formula'] ?? 'NULL';
            $description = $component['description'] ?? 'No description';
            $this->line("• {$key}: {$description}");
            $this->line("  Formula: {$formula}");
        }

        $this->info("\n📉 Deduction Components:");
        foreach ($template->deduction_components as $key => $component) {
            $formula = $component['formula'] ?? 'NULL';
            $description = $component['description'] ?? 'No description';
            $this->line("• {$key}: {$description}");
            $this->line("  Formula: {$formula}");
        }

        $this->info("\n🏛️ Statutory Components:");
        foreach ($template->statutory_components as $key => $component) {
            $formula = $component['formula'] ?? 'NULL';
            $description = $component['description'] ?? 'No description';
            $this->line("• {$key}: {$description}");
            $this->line("  Formula: {$formula}");
        }

        return 0;
    }
}
