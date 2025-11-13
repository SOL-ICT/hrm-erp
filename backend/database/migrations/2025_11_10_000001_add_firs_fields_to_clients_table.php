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
            // FIRS Tax Identification Fields
            $table->string('firs_tin')->nullable()->comment('FIRS Tax Identification Number');
            $table->string('firs_registration_number')->nullable()->comment('FIRS Business Registration Number');
            $table->string('firs_vat_number')->nullable()->comment('FIRS VAT Registration Number');

            // Additional FIRS Compliance Fields
            $table->string('firs_business_type')->nullable()->comment('Business Type for FIRS classification');
            $table->string('firs_sector')->nullable()->comment('Business sector for FIRS reporting');
            $table->boolean('firs_vat_registered')->default(false)->comment('Whether client is VAT registered with FIRS');

            // FIRS Address Information (for e-invoicing)
            $table->text('firs_registered_address')->nullable()->comment('FIRS registered business address');
            $table->string('firs_state_code')->nullable()->comment('FIRS state code for tax jurisdiction');
            $table->string('firs_lga_code')->nullable()->comment('FIRS Local Government Area code');

            // Timestamps for FIRS data
            $table->timestamp('firs_data_updated_at')->nullable()->comment('Last update of FIRS information');

            // Add index for faster FIRS TIN lookups
            $table->index('firs_tin', 'clients_firs_tin_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex('clients_firs_tin_index');
            $table->dropColumn([
                'firs_tin',
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
        });
    }
};
