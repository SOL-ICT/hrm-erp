<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RetirementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentYear = date('Y');

        // Get disbursed and retired advances
        $advances = DB::table('advances')
            ->whereIn('status', ['disbursed', 'retired'])
            ->get();

        if ($advances->isEmpty()) {
            $this->command->warn('No disbursed/retired advances found. Run AdvanceSeeder first.');
            return;
        }

        // Get the max existing retirement code to avoid duplicates
        $maxCode = DB::table('retirements')
            ->where('retirement_code', 'like', 'RET-' . $currentYear . '-%')
            ->max('retirement_code');
        
        $retirementCounter = $maxCode ? ((int)substr($maxCode, -4)) + 1 : 1;

        $retirements = [];
        $retirementItems = [];

        $expenseCategories = [
            'Transport',
            'Accommodation',
            'Meals',
            'Materials',
            'Equipment',
            'Utilities',
            'Services',
            'Miscellaneous'
        ];

        $statuses = ['submitted', 'under_review', 'queried', 'approved', 'rejected'];

        foreach ($advances as $advance) {
            $submittedAt = Carbon::parse($advance->disbursed_at)->addDays(rand(7, 20));
            $totalExpenditure = $advance->amount - rand(0, (int)($advance->amount * 0.15)); // 85-100% spent
            $balance = $advance->amount - $totalExpenditure;

            // Select status based on advance status
            if ($advance->status === 'retired') {
                $status = 'approved';
            } else {
                $status = $statuses[array_rand($statuses)];
            }

            $retirement = [
                'retirement_code' => 'RET-' . $currentYear . '-' . str_pad($retirementCounter++, 4, '0', STR_PAD_LEFT),
                'advance_id' => $advance->id,
                'advance_amount' => $advance->amount,
                'total_spent' => $totalExpenditure,
                'balance' => $balance,
                'retirement_summary' => 'Detailed breakdown of all expenses incurred during the operational period. All receipts and supporting documents attached.',
                'status' => $status === 'pending' ? 'submitted' : $status,
                'created_at' => $submittedAt,
                'updated_at' => $submittedAt,
            ];

            if (in_array($status, ['under_review', 'queried', 'approved'])) {
                $reviewedAt = $submittedAt->copy()->addDays(rand(1, 3));
                $reviewerId = DB::table('users')->inRandomOrder()->value('id');
                $retirement['reviewed_by'] = $reviewerId;
                $retirement['reviewed_at'] = $reviewedAt;
                $retirement['review_comments'] = 'Reviewed all supporting documents';
                $retirement['updated_at'] = $reviewedAt;
            }

            if ($status === 'queried') {
                $retirement['query_reason'] = 'Please provide additional receipts for transport expenses totaling ₦50,000';
            }

            if ($status === 'rejected') {
                $retirement['rejection_reason'] = 'Missing receipts and insufficient documentation';
            }

            $retirementId = DB::table('retirements')->insertGetId($retirement);

            // Create 3-8 retirement items per retirement
            $itemCount = rand(3, 8);
            $remainingAmount = $totalExpenditure;

            for ($i = 0; $i < $itemCount; $i++) {
                $isLast = ($i === $itemCount - 1);
                
                if ($isLast) {
                    $itemAmount = $remainingAmount;
                } else {
                    $itemAmount = rand(5000, (int)($remainingAmount / ($itemCount - $i)));
                }

                $category = $expenseCategories[array_rand($expenseCategories)];
                $retirementItems[] = [
                    'retirement_id' => $retirementId,
                    'description' => $category . ' expense for operational activities',
                    'amount' => $itemAmount,
                    'receipt_reference' => 'RCP-' . date('Y') . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'transaction_date' => $submittedAt->copy()->subDays(rand(1, 7))->format('Y-m-d'),
                    'created_at' => $submittedAt,
                    'updated_at' => $submittedAt,
                ];

                $remainingAmount -= $itemAmount;
            }
        }

        DB::table('retirements')->insert($retirements);
        DB::table('retirement_items')->insert($retirementItems);

        $this->command->info('✅ Created ' . count($retirements) . ' retirements with ' . count($retirementItems) . ' items');
    }
}
