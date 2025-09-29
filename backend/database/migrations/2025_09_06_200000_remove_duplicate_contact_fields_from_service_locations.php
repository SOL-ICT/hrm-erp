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
        Schema::table('service_locations', function (Blueprint $table) {
            // Drop duplicate contact fields (keeping contact_person_* fields)
            $table->dropColumn([
                'contact_name',
                'contact_phone',
                'contact_email'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_locations', function (Blueprint $table) {
            // Re-add the dropped contact fields
            $table->string('contact_name')->nullable()->after('contact_person_email');
            $table->string('contact_phone', 20)->nullable()->after('contact_name');
            $table->string('contact_email')->nullable()->after('contact_phone');
        });
    }
};
