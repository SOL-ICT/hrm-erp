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
        Schema::table('offer_letter_templates', function (Blueprint $table) {
            $table->longText('content')->nullable()->after('header_config');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offer_letter_templates', function (Blueprint $table) {
            $table->dropColumn('content');
        });
    }
};
