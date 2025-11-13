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
        Schema::table('generated_invoices', function (Blueprint $table) {
            $table->json('export_line_items')->nullable()->after('calculation_breakdown')->comment('Export template line items (Management Fee, VAT, etc.)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generated_invoices', function (Blueprint $table) {
            $table->dropColumn('export_line_items');
        });
    }
};
