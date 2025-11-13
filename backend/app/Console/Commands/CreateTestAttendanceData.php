<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AttendanceUpload;
use App\Models\AttendanceRecord;
use App\Models\Client;
use Carbon\Carbon;

class CreateTestAttendanceData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:create-attendance-data';

    /**
     * The console command description.
     */
    protected $description = 'Create test attendance data for Phase 1.3 testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏗️  Creating test attendance data for Phase 1.3...');

        try {
            // Get the first available client
            $client = Client::first();

            if (!$client) {
                $this->error('No clients found. Please ensure clients exist in the database.');
                return;
            }

            $this->info("Using client: {$client->organisation_name}");

            // Create an attendance upload
            $upload = AttendanceUpload::create([
                'client_id' => $client->id,
                'file_name' => 'test_attendance_phase13_' . date('Y_m_d_His') . '.xlsx',
                'file_path' => '/storage/attendance/test_data/',
                'file_type' => 'xlsx',
                'total_records' => 5,
                'processed_records' => 5,
                'failed_records' => 0,
                'processing_status' => 'completed',
                'payroll_month' => Carbon::now()->format('Y-m-d'),
                'uploaded_by' => 1,
                'processed_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $this->info("Created attendance upload with ID: {$upload->id}");

            // Create test attendance records 
            $testRecords = [
                [
                    'employee_id' => 'EMP001',
                    'employee_code' => 'EMP001', // Phase 1.3
                    'employee_name' => 'John Smith',
                    'designation' => 'Software Engineer',
                    'days_worked' => 22,
                    'pay_grade_structure_id' => 1001 // Phase 1.3
                ],
                [
                    'employee_id' => 'EMP002',
                    'employee_code' => 'EMP002', // Phase 1.3
                    'employee_name' => 'Jane Doe',
                    'designation' => 'Project Manager',
                    'days_worked' => 20,
                    'pay_grade_structure_id' => 1002 // Phase 1.3
                ],
                [
                    'employee_id' => 'EMP003',
                    'employee_code' => 'EMP003', // Phase 1.3
                    'employee_name' => 'Mike Johnson',
                    'designation' => 'Senior Developer',
                    'days_worked' => 21,
                    'pay_grade_structure_id' => 1001 // Phase 1.3
                ],
                [
                    'employee_id' => 'EMP004',
                    'employee_code' => 'EMP004', // Phase 1.3
                    'employee_name' => 'Sarah Wilson',
                    'designation' => 'Business Analyst',
                    'days_worked' => 19,
                    'pay_grade_structure_id' => 1003 // Phase 1.3
                ],
                [
                    'employee_id' => 'EMP005',
                    'employee_code' => 'EMP005', // Phase 1.3
                    'employee_name' => 'David Brown',
                    'designation' => 'DevOps Engineer',
                    'days_worked' => 23,
                    'pay_grade_structure_id' => 1002 // Phase 1.3
                ]
            ];

            foreach ($testRecords as $record) {
                AttendanceRecord::create([
                    'attendance_upload_id' => $upload->id,
                    'client_id' => $client->id,
                    'employee_id' => $record['employee_id'],
                    'employee_name' => $record['employee_name'],
                    'designation' => $record['designation'],
                    'payroll_month' => Carbon::now()->format('Y-m-d'),
                    'days_worked' => $record['days_worked'],
                    'status' => 'pending',

                    // Phase 1.3: Enhanced attendance upload fields
                    'employee_code' => $record['employee_code'],
                    'pay_grade_structure_id' => $record['pay_grade_structure_id'],
                    'direct_id_matched' => false,
                    'record_status' => 'pending_review',
                    'template_available' => false,
                    'ready_for_calculation' => false,

                    // Calculation tracking
                    'total_expected_days' => 25,
                    'actual_working_days' => $record['days_worked'],
                    'prorated_percentage' => ($record['days_worked'] / 25) * 100,
                    'calculation_method' => 'working_days',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            $this->newLine();
            $this->info('✅ Test attendance data created successfully!');
            $this->info("   Upload ID: {$upload->id}");
            $this->info("   Records created: " . count($testRecords));
            $this->info("   Client: {$client->organisation_name}");
            $this->newLine();
            $this->info('🧪 You can now test Phase 1.3 with:');
            $this->info("   php artisan test:phase-1-3 {$upload->id}");
        } catch (\Exception $e) {
            $this->error('Failed to create test data: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
        }
    }
}
