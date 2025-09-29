<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ServiceIntegrationMonitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Phase 4.1 Service Integration Controller
 * Provides endpoints for monitoring service health and integration status
 */
class ServiceIntegrationController extends Controller
{
    private $monitor;

    public function __construct(ServiceIntegrationMonitor $monitor)
    {
        $this->monitor = $monitor;
    }

    /**
     * Get comprehensive service health status
     */
    public function healthCheck(): JsonResponse
    {
        try {
            Log::info('Phase 4.1: Health check endpoint accessed');

            $healthData = $this->monitor->performHealthCheck();

            $httpStatus = match ($healthData['overall_status']) {
                'healthy' => 200,
                'warning' => 206, // Partial Content
                'error' => 503,   // Service Unavailable
                default => 200
            };

            return response()->json([
                'success' => $healthData['overall_status'] !== 'error',
                'status' => $healthData['overall_status'],
                'data' => $healthData,
                'message' => 'Service health check completed'
            ], $httpStatus);
        } catch (\Exception $e) {
            Log::error('Phase 4.1: Health check endpoint failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Health check failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service performance metrics
     */
    public function performanceMetrics(): JsonResponse
    {
        try {
            $metrics = $this->monitor->getPerformanceMetrics();

            return response()->json([
                'success' => true,
                'data' => $metrics,
                'message' => 'Performance metrics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Phase 4.1: Performance metrics endpoint failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve performance metrics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get service integration status summary
     */
    public function integrationStatus(): JsonResponse
    {
        try {
            $healthData = $this->monitor->performHealthCheck();

            // Create summary data
            $summary = [
                'overall_status' => $healthData['overall_status'],
                'services_healthy' => count(array_filter($healthData['services'], fn($s) => $s['status'] === 'healthy')),
                'total_services' => count($healthData['services']),
                'integration_tests_passed' => count(array_filter($healthData['integration_tests'], fn($t) => $t['status'] === 'passed')),
                'total_integration_tests' => count($healthData['integration_tests']),
                'last_check' => $healthData['timestamp'],
                'recommendations_count' => count($healthData['recommendations'])
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'message' => 'Integration status summary retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Phase 4.1: Integration status endpoint failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve integration status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test specific service integration
     */
    public function testServiceIntegration(Request $request): JsonResponse
    {
        $request->validate([
            'service' => 'required|in:attendance_payroll,invoice_generation,file_processing',
            'test_type' => 'required|in:basic,performance,error_handling'
        ]);

        try {
            $serviceName = $request->service;
            $testType = $request->test_type;

            Log::info('Phase 4.1: Service integration test requested', [
                'service' => $serviceName,
                'test_type' => $testType
            ]);

            $result = $this->runSpecificTest($serviceName, $testType);

            return response()->json([
                'success' => $result['success'] ?? true,
                'data' => $result,
                'message' => "Service integration test completed for {$serviceName}"
            ]);
        } catch (\Exception $e) {
            Log::error('Phase 4.1: Service integration test failed', [
                'service' => $request->service,
                'test_type' => $request->test_type,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Service integration test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Run specific integration test
     */
    private function runSpecificTest(string $serviceName, string $testType): array
    {
        $startTime = microtime(true);

        try {
            switch ($serviceName) {
                case 'attendance_payroll':
                    $result = $this->testAttendancePayrollService($testType);
                    break;
                case 'invoice_generation':
                    $result = $this->testInvoiceGenerationService($testType);
                    break;
                case 'file_processing':
                    $result = $this->testFileProcessingService($testType);
                    break;
                default:
                    throw new \InvalidArgumentException("Unknown service: {$serviceName}");
            }

            $result['execution_time_ms'] = round((microtime(true) - $startTime) * 1000, 2);
            $result['success'] = true;

            return $result;
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
            ];
        }
    }

    /**
     * Test AttendanceBasedPayrollService
     */
    private function testAttendancePayrollService(string $testType): array
    {
        $service = app(\App\Services\AttendanceBasedPayrollService::class);
        $staff = \App\Models\Staff::first();

        if (!$staff) {
            throw new \Exception('No staff data available for testing');
        }

        switch ($testType) {
            case 'basic':
                $result = $service->calculateAdjustedSalary($staff, 20, 'working_days');
                return [
                    'test_type' => 'basic_calculation',
                    'result' => 'Calculation successful',
                    'gross_salary' => $result['gross_salary'],
                    'attendance_factor' => $result['attendance_factor']
                ];

            case 'performance':
                $startTime = microtime(true);
                for ($i = 0; $i < 10; $i++) {
                    $service->calculateAdjustedSalary($staff, 20, 'working_days');
                }
                $avgTime = ((microtime(true) - $startTime) / 10) * 1000;

                return [
                    'test_type' => 'performance',
                    'result' => 'Performance test completed',
                    'average_calculation_time_ms' => round($avgTime, 2),
                    'calculations_per_second' => round(1000 / $avgTime, 2)
                ];

            case 'error_handling':
                try {
                    $fakeStaff = new \App\Models\Staff();
                    $service->calculateAdjustedSalary($fakeStaff, 20, 'working_days');
                    return [
                        'test_type' => 'error_handling',
                        'result' => 'Error handling needs improvement - no exception thrown'
                    ];
                } catch (\Exception $e) {
                    return [
                        'test_type' => 'error_handling',
                        'result' => 'Error handling working correctly',
                        'error_caught' => $e->getMessage()
                    ];
                }

            default:
                throw new \InvalidArgumentException("Unknown test type: {$testType}");
        }
    }

    /**
     * Test InvoiceGenerationService
     */
    private function testInvoiceGenerationService(string $testType): array
    {
        $service = app(\App\Services\InvoiceGenerationService::class);

        switch ($testType) {
            case 'basic':
                return [
                    'test_type' => 'basic_instantiation',
                    'result' => 'Service instantiation successful',
                    'service_class' => get_class($service)
                ];

            case 'performance':
                $startTime = microtime(true);
                for ($i = 0; $i < 5; $i++) {
                    app(\App\Services\InvoiceGenerationService::class);
                }
                $avgTime = ((microtime(true) - $startTime) / 5) * 1000;

                return [
                    'test_type' => 'performance',
                    'result' => 'Performance test completed',
                    'average_instantiation_time_ms' => round($avgTime, 2)
                ];

            case 'error_handling':
                return [
                    'test_type' => 'error_handling',
                    'result' => 'Error handling test not applicable for this service'
                ];

            default:
                throw new \InvalidArgumentException("Unknown test type: {$testType}");
        }
    }

    /**
     * Test AttendanceFileProcessingService
     */
    private function testFileProcessingService(string $testType): array
    {
        $service = app(\App\Services\AttendanceFileProcessingService::class);

        switch ($testType) {
            case 'basic':
                return [
                    'test_type' => 'basic_instantiation',
                    'result' => 'Service instantiation successful',
                    'service_class' => get_class($service)
                ];

            case 'performance':
                $startTime = microtime(true);
                for ($i = 0; $i < 5; $i++) {
                    app(\App\Services\AttendanceFileProcessingService::class);
                }
                $avgTime = ((microtime(true) - $startTime) / 5) * 1000;

                return [
                    'test_type' => 'performance',
                    'result' => 'Performance test completed',
                    'average_instantiation_time_ms' => round($avgTime, 2)
                ];

            case 'error_handling':
                return [
                    'test_type' => 'error_handling',
                    'result' => 'Error handling test not applicable for this service'
                ];

            default:
                throw new \InvalidArgumentException("Unknown test type: {$testType}");
        }
    }
}
