<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AttendanceUpload;
use App\Models\AttendanceRecord;
use App\Models\Client;
use App\Services\DirectIDMatchingService;

class TestPhase13Implementation extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:phase-1-3 {upload_id?}';

    /**
     * The console command description.
     */
    protected $description = 'Test Phase 1.3 Enhanced Attendance Upload Process implementation';

    protected $directMatchingService;

    public function __construct(DirectIDMatchingService $directMatchingService)
    {
        parent::__construct();
        $this->directMatchingService = $directMatchingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Phase 1.3: Enhanced Attendance Upload Process');
        $this->newLine();

        $uploadId = $this->argument('upload_id');

        if (!$uploadId) {
            // Show available uploads
            $this->showAvailableUploads();
            return;
        }

        $this->testEnhancedUploadProcess($uploadId);
    }

    private function showAvailableUploads()
    {
        $this->info('Available attendance uploads for testing:');
        $this->newLine();

        $uploads = AttendanceUpload::with('client')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        if ($uploads->isEmpty()) {
            $this->warn('No attendance uploads found. Please upload attendance data first.');
            return;
        }

        $this->table(
            ['ID', 'Client', 'Filename', 'Records', 'Created'],
            $uploads->map(function ($upload) {
                $recordCount = AttendanceRecord::where('attendance_upload_id', $upload->id)->count();
                return [
                    $upload->id,
                    $upload->client->organisation_name ?? 'Unknown',
                    $upload->filename,
                    $recordCount,
                    $upload->created_at->format('Y-m-d H:i')
                ];
            })
        );

        $this->newLine();
        $this->info('Run: php artisan test:phase-1-3 <upload_id>');
    }

    private function testEnhancedUploadProcess(int $uploadId)
    {
        try {
            $upload = AttendanceUpload::with('client')->findOrFail($uploadId);

            $this->info("Testing Enhanced Upload Process for Upload ID: {$uploadId}");
            $this->info("Client: {$upload->client->organisation_name}");
            $this->info("Filename: {$upload->filename}");
            $this->newLine();

            // Test 1: Format Validation
            $this->info('🔍 Test 1: Attendance Format Validation');
            $formatValidation = $this->directMatchingService->validateAttendanceFormat($uploadId);

            if ($formatValidation['success']) {
                $data = $formatValidation['data'];
                $this->info("✅ Format validation completed");
                $this->info("   Total records: {$data['total_records']}");
                $this->info("   Valid format: {$data['valid_format']}");
                $this->info("   Invalid format: {$data['invalid_format']}");

                if ($data['invalid_format'] > 0) {
                    $this->warn("   Format errors found:");
                    foreach (array_slice($data['format_errors'], 0, 3) as $error) {
                        $this->warn("   - {$error['employee_code']}: " . implode(', ', $error['errors']));
                    }
                }
            } else {
                $this->error("❌ Format validation failed: {$formatValidation['message']}");
                return;
            }

            $this->newLine();

            // Test 2: Direct ID Matching
            $this->info('🎯 Test 2: Direct ID Matching Process');
            $matchingResults = $this->directMatchingService->processDirectIDMatching($uploadId);

            if ($matchingResults['success']) {
                $data = $matchingResults['data'];
                $this->info("✅ Direct ID matching completed");
                $this->info("   Successfully matched: {$data['successfully_matched']}");
                $this->info("   Failed matches: {$data['failed_matches']}");

                if ($data['failed_matches'] > 0) {
                    $this->warn("   Matching errors found:");
                    foreach (array_slice($data['matching_errors'], 0, 3) as $error) {
                        $this->warn("   - {$error['employee_code']}: " . implode(', ', $error['errors']));
                    }
                }
            } else {
                $this->error("❌ Direct ID matching failed: {$matchingResults['message']}");
                return;
            }

            $this->newLine();

            // Test 3: Template Coverage
            $this->info('📋 Test 3: Template Coverage Analysis');
            if (!empty($matchingResults['data']['template_coverage'])) {
                foreach ($matchingResults['data']['template_coverage'] as $template) {
                    $status = $template['has_template'] ? '✅' : '❌';
                    $completeness = $template['template_complete'] ? '(Complete)' : '(Incomplete)';

                    $this->info("   {$status} Pay Grade ID {$template['pay_grade_structure_id']}: " .
                        ($template['has_template'] ? $template['template_name'] . " {$completeness}" : 'No template'));
                }
            } else {
                $this->warn("   No template coverage data available");
            }

            $this->newLine();

            // Test 4: Validation Report
            $this->info('📊 Test 4: Comprehensive Validation Report');
            $validationReport = $this->directMatchingService->getValidationReport($uploadId);

            if ($validationReport['success']) {
                $report = $validationReport['data'];
                $this->info("✅ Validation report generated");
                $this->info("   Overall Status: " . strtoupper($report['overall_status']));

                $statusEmoji = match ($report['overall_status']) {
                    'ready_for_processing' => '🟢',
                    'partial_success' => '🟡',
                    'failed' => '🔴',
                    default => '⚪'
                };

                $this->info("   Status: {$statusEmoji} " . str_replace('_', ' ', $report['overall_status']));

                // Show recommendations
                if (!empty($report['recommendations'])) {
                    $this->info("   Recommendations:");
                    foreach ($report['recommendations'] as $rec) {
                        $icon = match ($rec['type']) {
                            'success' => '✅',
                            'warning' => '⚠️',
                            'error' => '❌',
                            default => '💡'
                        };
                        $this->info("     {$icon} {$rec['message']}");
                    }
                }
            } else {
                $this->error("❌ Validation report failed: {$validationReport['message']}");
            }

            $this->newLine();

            // Summary
            $this->info('🎉 Phase 1.3 Enhanced Upload Process Test Completed!');

            if ($matchingResults['success'] && $formatValidation['success']) {
                $totalRecords = $formatValidation['data']['total_records'];
                $successfulMatches = $matchingResults['data']['successfully_matched'];
                $percentage = $totalRecords > 0 ? round(($successfulMatches / $totalRecords) * 100, 2) : 0;

                $this->info("📈 Success Rate: {$percentage}% ({$successfulMatches}/{$totalRecords} records)");

                if ($percentage === 100) {
                    $this->info("🎯 Perfect! All records ready for invoice generation");
                } elseif ($percentage > 80) {
                    $this->warn("⚠️  Most records ready, some manual review needed");
                } else {
                    $this->error("⚠️  Significant issues found, review required before processing");
                }
            }
        } catch (\Exception $e) {
            $this->error("❌ Test failed with exception: " . $e->getMessage());
            $this->error("Stack trace: " . $e->getTraceAsString());
        }
    }
}
