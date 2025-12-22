<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BudgetAllocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentYear = date('Y');
        $nextYear = $currentYear + 1;

        // Get sample users (assuming IDs 1-10 exist)
        $userIds = DB::table('users')->pluck('id')->take(10)->toArray();

        if (empty($userIds)) {
            $this->command->warn('No users found in database. Skipping BudgetAllocationSeeder.');
            return;
        }

        $budgetAllocations = [];

        // Get an allocator user (first user will be the allocator)
        $allocatorId = $userIds[0];

        foreach ($userIds as $index => $userId) {
            // Different budget amounts based on user role
            $baseAmount = 500000 + ($index * 100000); // 500k to 1.4M
            $utilized = rand(0, (int)($baseAmount * 0.6)); // 0-60% utilized
            $available = $baseAmount - $utilized;

            $budgetAllocations[] = [
                'user_id' => $userId,
                'fiscal_year' => $currentYear,
                'budget_period' => 'annual',
                'allocated_amount' => $baseAmount,
                'utilized_amount' => $utilized,
                'available_amount' => $available,
                'is_active' => true,
                'allocated_by' => $allocatorId,
                'created_at' => Carbon::now()->subMonths(rand(1, 6)),
                'updated_at' => Carbon::now()->subDays(rand(1, 30)),
            ];

            // Add next year allocation for some users
            if ($index % 2 === 0) {
                $nextYearAmount = $baseAmount + 200000;
                $budgetAllocations[] = [
                    'user_id' => $userId,
                    'fiscal_year' => $nextYear,
                    'budget_period' => 'annual',
                    'allocated_amount' => $nextYearAmount,
                    'utilized_amount' => 0,
                    'available_amount' => $nextYearAmount,
                    'is_active' => true,
                    'allocated_by' => $allocatorId,
                    'created_at' => Carbon::now()->subDays(rand(1, 30)),
                    'updated_at' => Carbon::now()->subDays(rand(1, 15)),
                ];
            }
        }

        DB::table('budget_allocations')->insert($budgetAllocations);

        $this->command->info('✅ Created ' . count($budgetAllocations) . ' budget allocations');
    }
}
