<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdvanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentYear = date('Y');
        
        // Get sample users
        $userIds = DB::table('users')->pluck('id')->take(10)->toArray();

        if (empty($userIds)) {
            $this->command->warn('No users found in database. Skipping AdvanceSeeder.');
            return;
        }

        $offices = ['Abuja', 'Lagos', 'Port Harcourt', 'Kano', 'Enugu', 'Ibadan'];
        $budgetLines = [
            'administrative_expenses',
            'procurement',
            'training_development',
            'transportation',
            'communication',
            'maintenance',
            'other'
        ];
        $purposes = [
            'Staff welfare expenses',
            'Emergency equipment purchase',
            'Client meeting expenses',
            'Office maintenance',
            'Transport and logistics',
            'Training workshop materials',
            'Operational supplies',
            'Communication and utilities'
        ];

        $statuses = [
            'pending' => 30,
            'approved' => 25,
            'rejected' => 10,
            'disbursed' => 20,
            'retired' => 10,
            'overdue' => 5
        ];

        $advances = [];
        $statusLogs = [];
        $advanceCounter = 1;

        foreach ($statuses as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $userId = $userIds[array_rand($userIds)];
                $approverId = $userIds[array_rand($userIds)];
                $amount = rand(50000, 500000);
                $createdAt = Carbon::now()->subDays(rand(1, 90));
                
                $advance = [
                    'advance_code' => 'ADV-' . $currentYear . '-' . str_pad($advanceCounter++, 4, '0', STR_PAD_LEFT),
                    'user_id' => $userId,
                    'office' => $offices[array_rand($offices)],
                    'amount' => $amount,
                    'budget_line' => $budgetLines[array_rand($budgetLines)],
                    'purpose' => $purposes[array_rand($purposes)],
                    'justification' => 'Detailed justification for ' . strtolower($purposes[array_rand($purposes)]) . '. This expense is necessary for operational efficiency and meeting client deliverables.',
                    'status' => $status,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                // Add status-specific fields
                if (in_array($status, ['approved', 'rejected', 'disbursed', 'retired', 'overdue'])) {
                    $approvedAt = $createdAt->copy()->addDays(rand(1, 5));
                    $advance['approved_by'] = $approverId;
                    $advance['approved_at'] = $approvedAt;
                    $advance['approval_comments'] = 'Approved for operational needs';
                    $advance['updated_at'] = $approvedAt;
                }

                if ($status === 'rejected') {
                    $rejectedAt = $createdAt->copy()->addDays(rand(1, 5));
                    $advance['rejected_by'] = $approverId;
                    $advance['rejected_at'] = $rejectedAt;
                    $advance['rejection_reason'] = 'Insufficient budget allocation or incomplete justification';
                    $advance['updated_at'] = $rejectedAt;
                    unset($advance['approved_by'], $advance['approved_at'], $advance['approval_comments']);
                }

                if (in_array($status, ['disbursed', 'retired', 'overdue'])) {
                    $disbursedAt = $createdAt->copy()->addDays(rand(6, 10));
                    $advance['disbursed_by'] = $approverId;
                    $advance['disbursed_at'] = $disbursedAt;
                    $advance['retirement_due_date'] = $disbursedAt->copy()->addDays(14);
                    $advance['updated_at'] = $disbursedAt;
                }

                if ($status === 'retired') {
                    $retiredAt = $createdAt->copy()->addDays(rand(15, 20));
                    $advance['retired_at'] = $retiredAt;
                    $advance['updated_at'] = $retiredAt;
                }

                if ($status === 'overdue') {
                    $advance['is_overdue'] = true;
                    $advance['retirement_due_date'] = Carbon::now()->subDays(rand(1, 30));
                }

                $advanceId = DB::table('advances')->insertGetId($advance);

                // Create status log entry
                $statusLogs[] = [
                    'advance_id' => $advanceId,
                    'from_status' => null,
                    'to_status' => 'pending',
                    'changed_by' => $userId,
                    'comments' => 'Advance request created',
                    'created_at' => $createdAt,
                ];

                if (in_array($status, ['approved', 'disbursed', 'retired', 'overdue'])) {
                    $statusLogs[] = [
                        'advance_id' => $advanceId,
                        'from_status' => 'pending',
                        'to_status' => 'approved',
                        'changed_by' => $approverId,
                        'comments' => 'Approved for operational needs',
                        'created_at' => $advance['approved_at'],
                    ];
                }

                if ($status === 'rejected') {
                    $statusLogs[] = [
                        'advance_id' => $advanceId,
                        'from_status' => 'pending',
                        'to_status' => 'rejected',
                        'changed_by' => $approverId,
                        'comments' => $advance['rejection_reason'],
                        'created_at' => $advance['rejected_at'],
                    ];
                }

                if (in_array($status, ['disbursed', 'retired', 'overdue'])) {
                    $statusLogs[] = [
                        'advance_id' => $advanceId,
                        'from_status' => 'approved',
                        'to_status' => 'disbursed',
                        'changed_by' => $approverId,
                        'comments' => 'Funds disbursed',
                        'created_at' => $advance['disbursed_at'],
                    ];
                }

                if ($status === 'retired') {
                    $statusLogs[] = [
                        'advance_id' => $advanceId,
                        'from_status' => 'disbursed',
                        'to_status' => 'retired',
                        'changed_by' => $userId,
                        'comments' => 'Retirement submitted and approved',
                        'created_at' => $advance['retired_at'],
                    ];
                }

                if ($status === 'overdue') {
                    $statusLogs[] = [
                        'advance_id' => $advanceId,
                        'from_status' => 'disbursed',
                        'to_status' => 'overdue',
                        'changed_by' => $userId,
                        'comments' => 'Retirement overdue',
                        'created_at' => Carbon::now(),
                    ];
                }
            }
        }

        DB::table('advance_status_log')->insert($statusLogs);

        $this->command->info('✅ Created 100 advances with various statuses');
        $this->command->info('   - 30 pending');
        $this->command->info('   - 25 approved');
        $this->command->info('   - 10 rejected');
        $this->command->info('   - 20 disbursed');
        $this->command->info('   - 10 retired');
        $this->command->info('   - 5 overdue');
    }
}
