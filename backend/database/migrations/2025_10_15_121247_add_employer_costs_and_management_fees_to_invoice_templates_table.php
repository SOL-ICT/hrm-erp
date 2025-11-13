<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoice_templates', function (Blueprint $table) {
            // Add employer_costs column after custom_components
            $table->json('employer_costs')->nullable()->after('custom_components')
                ->comment('Employer statutory costs: Medical Insurance, ITF, ECA, Fidelity, etc.');

            // Add management_fees column after statutory_components  
            $table->json('management_fees')->nullable()->after('statutory_components')
                ->comment('Management/Service fees: Service fee, VAT on management fee, WHT, etc.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_templates', function (Blueprint $table) {
            $table->dropColumn(['employer_costs', 'management_fees']);
        });
    }
};
