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
            // Check if we need to make any changes - most fields already exist correctly
            
            // Only remove client_code if it exists (since we want to remove it)
            if (Schema::hasColumn('clients', 'client_code')) {
                $table->dropColumn('client_code');
            }
            
            // Remove configuration column (client configuration) if it exists
            if (Schema::hasColumn('clients', 'configuration')) {
                $table->dropColumn('configuration');
            }
            
            // The following columns already exist with correct names:
            // - organisation_name
            // - head_office_address 
            // - cac_registration_number
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // Add back the removed columns
            $table->string('client_code', 20)->unique()->nullable();
            $table->json('configuration')->nullable();
        });
    }
};
