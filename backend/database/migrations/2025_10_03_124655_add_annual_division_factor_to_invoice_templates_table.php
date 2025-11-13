<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoice_templates', function (Blueprint $table) {
            // Add annual division factor field (default 12 for monthly calculation)
            $table->decimal('annual_division_factor', 4, 2)->default(12.00)->after('calculation_rules');

            // Add template version for tracking migration status
            $table->string('template_version', 10)->default('2.0')->after('annual_division_factor');
        });

        // Convert existing monthly templates to annual equivalents
        $this->convertExistingTemplatestoAnnual();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_templates', function (Blueprint $table) {
            $table->dropColumn(['annual_division_factor', 'template_version']);
        });
    }

    /**
     * Convert existing monthly template values to annual equivalents
     */
    private function convertExistingTemplatestoAnnual(): void
    {
        // Get all existing templates
        $templates = DB::table('invoice_templates')->get();

        foreach ($templates as $template) {
            $customComponents = json_decode($template->custom_components, true) ?? [];
            $statutoryComponents = json_decode($template->statutory_components, true) ?? [];

            // Convert custom components (allowances) to annual
            foreach ($customComponents as $key => $component) {
                if (isset($component['rate']) && is_numeric($component['rate'])) {
                    $customComponents[$key]['rate'] = $component['rate'] * 12;
                }
            }

            // Convert statutory components to annual where applicable
            foreach ($statutoryComponents as $key => $component) {
                if (isset($component['rate']) && is_numeric($component['rate'])) {
                    $statutoryComponents[$key]['rate'] = $component['rate'] * 12;
                }
                if (isset($component['amount']) && is_numeric($component['amount'])) {
                    $statutoryComponents[$key]['amount'] = $component['amount'] * 12;
                }
            }

            // Update the template with annual values
            DB::table('invoice_templates')
                ->where('id', $template->id)
                ->update([
                    'custom_components' => json_encode($customComponents),
                    'statutory_components' => json_encode($statutoryComponents),
                    'template_version' => '2.0',
                    'updated_at' => now()
                ]);
        }
    }
};
