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
        // First, let's add the new service_type column
        Schema::table('client_contracts', function (Blueprint $table) {
            $table->enum('service_type', [
                'Recruitment Service',
                'Temporary Staff Service',
                'Managed Staff Service',
                'Payroll Services'
            ])->nullable()->after('client_id');
        });

        // Map existing contract_type values to new service_type values
        $mappings = [
            'Statutory contract' => 'Managed Staff Service',
            'Strategic Partnership' => 'Recruitment Service',
            'Service Agreement' => 'Recruitment Service',
            'Recruitment' => 'Recruitment Service',
            'Temporary' => 'Temporary Staff Service',
            'Managed' => 'Managed Staff Service',
            'Payroll' => 'Payroll Services'
        ];

        // Update existing records based on keywords in contract_type
        foreach ($mappings as $keyword => $serviceType) {
            DB::table('client_contracts')
                ->where('contract_type', 'LIKE', "%$keyword%")
                ->update(['service_type' => $serviceType]);
        }

        // Set default for any remaining null values
        DB::table('client_contracts')
            ->whereNull('service_type')
            ->update(['service_type' => 'Recruitment Service']);

        // Make service_type NOT NULL
        Schema::table('client_contracts', function (Blueprint $table) {
            $table->enum('service_type', [
                'Recruitment Service',
                'Temporary Staff Service',
                'Managed Staff Service',
                'Payroll Services'
            ])->nullable(false)->change();
        });

        // Finally, drop the old contract_type column
        Schema::table('client_contracts', function (Blueprint $table) {
            $table->dropColumn('contract_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the contract_type column
        Schema::table('client_contracts', function (Blueprint $table) {
            $table->string('contract_type', 100)->after('client_id');
        });

        // Map service_type values back to contract_type
        $reverseMappings = [
            'Recruitment Service' => 'Recruitment Service Agreement',
            'Temporary Staff Service' => 'Temporary Staff Contract',
            'Managed Staff Service' => 'Managed Staff Contract',
            'Payroll Services' => 'Payroll Services Contract'
        ];

        foreach ($reverseMappings as $serviceType => $contractType) {
            DB::table('client_contracts')
                ->where('service_type', $serviceType)
                ->update(['contract_type' => $contractType]);
        }

        // Drop the service_type column
        Schema::table('client_contracts', function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }
};
