<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class InspectTemplateData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspect:templates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Inspect current invoice template data before migration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Current Invoice Templates Data:');
        $this->info('==============================');

        $templates = DB::table('invoice_templates')->get();

        $this->info("Total templates: " . $templates->count());

        foreach ($templates as $template) {
            $this->info("\n--- Template ID: {$template->id} ---");
            $this->info("Name: {$template->template_name}");
            $this->info("Client ID: {$template->client_id}");
            $this->info("Annual Division Factor: " . ($template->annual_division_factor ?? 'NULL'));
            $this->info("Template Version: " . ($template->template_version ?? 'NULL'));

            if ($template->custom_components) {
                $customComponents = json_decode($template->custom_components, true);
                $this->info("Custom Components (Raw DB Values):");
                foreach ($customComponents as $index => $component) {
                    $dbValue = $component['rate'];
                    $this->info("  - {$component['name']}: ₦" . number_format($dbValue, 2) . " (raw DB value)");
                }
            }

            if ($template->statutory_components) {
                $statutoryComponents = json_decode($template->statutory_components, true);
                $this->info("Statutory Components:");
                foreach ($statutoryComponents as $index => $component) {
                    $name = $component['name'] ?? $component['deduction_name'] ?? "Component $index";
                    $rate = $component['rate'] ?? $component['percentage'] ?? 'N/A';
                    $this->info("  - {$name}: {$rate}");
                }
            }
        }

        return 0;
    }
}
