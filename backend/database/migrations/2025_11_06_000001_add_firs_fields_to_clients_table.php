<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add FIRS e-invoicing related fields to clients table
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // FIRS e-invoicing fields
            $table->string('tin', 50)->nullable()->after('contact_person_address')
                ->comment('Tax Identification Number for FIRS e-invoicing');

            $table->text('business_description')->nullable()->after('tin')
                ->comment('Business description for FIRS e-invoicing');

            $table->string('city', 100)->nullable()->after('business_description')
                ->comment('City for FIRS postal address');

            $table->string('postal_zone', 20)->nullable()->after('city')
                ->comment('Postal zone/code for FIRS address');

            $table->string('country', 3)->default('NG')->after('postal_zone')
                ->comment('Country code for FIRS address (ISO 3166-1 alpha-2)');

            $table->string('contact_person_email')->nullable()->after('country')
                ->comment('Contact person email for FIRS communication');

            $table->string('contact_person_phone', 20)->nullable()->after('contact_person_email')
                ->comment('Contact person phone for FIRS communication');

            // Add index for TIN lookups
            $table->index('tin', 'clients_tin_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_tin_index');
            $table->dropColumn([
                'tin',
                'business_description',
                'city',
                'postal_zone',
                'country',
                'contact_person_email',
                'contact_person_phone'
            ]);
        });
    }
};
