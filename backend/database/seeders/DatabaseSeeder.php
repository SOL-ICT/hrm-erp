<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Procurement & Advance Management Seeders
        $this->call([
            LeaveManagementPermissionsSeeder::class,
            BudgetAllocationSeeder::class,
            AdvanceSeeder::class,
            RetirementSeeder::class,
            PurchaseRequestSeeder::class,
            ProcurementLogSeeder::class,
        ]);
    }
}
