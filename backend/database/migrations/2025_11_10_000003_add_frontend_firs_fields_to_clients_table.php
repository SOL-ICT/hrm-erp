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
        Schema::table('clients', function (Blueprint $table) {
            // Add the frontend FIRS fields that are missing
            $table->string('firs_business_description')->nullable()->comment('Business description for FIRS');
            $table->string('firs_city')->nullable()->comment('City for FIRS address');
            $table->string('firs_postal_zone')->nullable()->comment('Postal zone for FIRS');
            $table->string('firs_country')->default('NG')->comment('Country code for FIRS');
            $table->string('firs_contact_telephone')->nullable()->comment('Contact telephone for FIRS');
            $table->string('firs_contact_email')->nullable()->comment('Contact email for FIRS');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'firs_business_description',
                'firs_city',
                'firs_postal_zone',
                'firs_country',
                'firs_contact_telephone',
                'firs_contact_email'
            ]);
        });
    }
};
