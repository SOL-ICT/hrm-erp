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
            // Remove unused FIRS fields that don't match the frontend
            $table->dropColumn([
                'firs_registration_number',
                'firs_vat_number',
                'firs_business_type',
                'firs_sector',
                'firs_vat_registered',
                'firs_registered_address',
                'firs_state_code',
                'firs_lga_code',
                'firs_data_updated_at'
            ]);

            // Add the frontend FIRS fields that are actually being used
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
            // Remove the frontend fields
            $table->dropColumn([
                'firs_business_description',
                'firs_city',
                'firs_postal_zone',
                'firs_country',
                'firs_contact_telephone',
                'firs_contact_email'
            ]);

            // Add back the removed fields
            $table->string('firs_registration_number')->nullable()->comment('FIRS Business Registration Number');
            $table->string('firs_vat_number')->nullable()->comment('FIRS VAT Registration Number');
            $table->string('firs_business_type')->nullable()->comment('Business Type for FIRS classification');
            $table->string('firs_sector')->nullable()->comment('Business sector for FIRS reporting');
            $table->boolean('firs_vat_registered')->default(false)->comment('Whether client is VAT registered with FIRS');
            $table->text('firs_registered_address')->nullable()->comment('FIRS registered business address');
            $table->string('firs_state_code')->nullable()->comment('FIRS state code for tax jurisdiction');
            $table->string('firs_lga_code')->nullable()->comment('FIRS Local Government Area code');
            $table->timestamp('firs_data_updated_at')->nullable()->comment('Last update of FIRS information');
        });
    }
};
