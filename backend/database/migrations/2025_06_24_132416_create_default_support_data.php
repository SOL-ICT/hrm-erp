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
        // Create default client if clients table is empty
        if (DB::table('clients')->count() === 0) {
            DB::table('clients')->insert([
                'id' => 1,
                'client_name' => 'Strategic Outsourcing Limited',
                'client_code' => 'SOL001',
                'status' => 'active',
                'contact_email' => 'info@strategicoutsourcing.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Create default staff type if client_staff_types table is empty
        if (DB::table('client_staff_types')->count() === 0) {
            DB::table('client_staff_types')->insert([
                'id' => 1,
                'client_id' => 1,
                'type_name' => 'General Staff',
                'description' => 'General staff member',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('clients')->where('id', 1)->delete();
        DB::table('client_staff_types')->where('id', 1)->delete();
    }
};
