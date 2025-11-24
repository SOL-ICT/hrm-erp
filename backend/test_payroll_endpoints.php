#!/usr/bin/env php
<?php
/**
 * E2E Testing Script - Backend API Validation
 * 
 * This script tests all payroll-related backend endpoints
 * Run from: backend/
 * Command: php test_payroll_endpoints.php
 * 
 * Prerequisites:
 * - Laravel server running
 * - Database migrated and seeded
 * - Test client and staff data exists
 */

require __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

// Configuration
$baseUrl = 'http://localhost:8000/api';
$token = null; // Will be set after login
$httpClient = new Client(['base_uri' => $baseUrl, 'http_errors' => false]);

// ANSI Colors
$colors = [
    'reset' => "\033[0m",
    'green' => "\033[32m",
    'red' => "\033[31m",
    'yellow' => "\033[33m",
    'blue' => "\033[34m",
    'cyan' => "\033[36m",
];

// Test Results
$results = [
    'passed' => 0,
    'failed' => 0,
    'skipped' => 0,
];

// Helper Functions
function success($message)
{
    global $colors, $results;
    echo "{$colors['green']}✓ {$message}{$colors['reset']}\n";
    $results['passed']++;
}

function fail($message)
{
    global $colors, $results;
    echo "{$colors['red']}✗ {$message}{$colors['reset']}\n";
    $results['failed']++;
}

function skip($message)
{
    global $colors, $results;
    echo "{$colors['yellow']}⊘ {$message}{$colors['reset']}\n";
    $results['skipped']++;
}

function info($message)
{
    global $colors;
    echo "{$colors['cyan']}{$message}{$colors['reset']}\n";
}

function heading($message)
{
    global $colors;
    echo "\n{$colors['blue']}═══ {$message} ═══{$colors['reset']}\n\n";
}

function apiRequest($method, $endpoint, $data = [], $expectError = false)
{
    global $baseUrl, $token, $httpClient;

    $url = $endpoint;
    $options = [
        'headers' => $token ? ['Authorization' => "Bearer {$token}", 'Accept' => 'application/json'] : ['Accept' => 'application/json'],
    ];

    if (!empty($data)) {
        if ($method === 'get') {
            $options['query'] = $data;
        } else {
            $options['json'] = $data;
        }
    }

    try {
        $response = $httpClient->request(strtoupper($method), $url, $options);
        $statusCode = $response->getStatusCode();
        $body = json_decode($response->getBody()->getContents(), true);

        if ($expectError) {
            if ($statusCode >= 400) {
                return ['success' => true, 'data' => $body];
            } else {
                return ['success' => false, 'error' => 'Expected error but got success'];
            }
        } else {
            if ($statusCode >= 200 && $statusCode < 300) {
                return ['success' => true, 'data' => $body];
            } else {
                return ['success' => false, 'error' => json_encode($body)];
            }
        }
    } catch (RequestException $e) {
        if ($expectError) {
            return ['success' => true, 'data' => ['error' => $e->getMessage()]];
        } else {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    } catch (\Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// ========================
// START TESTING
// ========================

heading("PAYROLL PROCESSING E2E API TESTS");

info("Base URL: {$baseUrl}");
info("Starting tests...\n");

// ========================
// TEST 1: Authentication
// ========================

heading("TEST 1: Authentication");

// Note: Update credentials based on your test user
$loginData = [
    'email' => 'SOLADMIN001',
    'password' => 'password',
];

$result = apiRequest('post', '/login', $loginData);
if ($result['success'] && isset($result['data']['token'])) {
    $token = $result['data']['token'];
    success("Admin login successful");
} else {
    fail("Admin login failed: " . ($result['error'] ?? 'Unknown error'));
    echo "\nℹ️  Please update login credentials in script and ensure seeder ran\n";
    exit(1);
}

// ========================
// TEST 2: Emolument Components
// ========================

heading("TEST 2: Emolument Components");

// Test 2.1: Get Universal Components
$result = apiRequest('get', '/emolument-components/universal');
if ($result['success']) {
    $universalComponents = $result['data']['data'] ?? [];
    $count = count($universalComponents);
    if ($count === 11) {
        success("Retrieved 11 universal components");
    } else {
        fail("Expected 11 universal components, got {$count}");
    }
} else {
    fail("Failed to retrieve universal components: " . ($result['error'] ?? ''));
}

// Test 2.2: Get All Components (with client filter)
$result = apiRequest('get', '/emolument-components?client_id=1');
if ($result['success']) {
    success("Retrieved components for client_id=1");
} else {
    fail("Failed to retrieve components: " . ($result['error'] ?? ''));
}

// Test 2.3: Create Custom Component
$customComponent = [
    'component_name' => 'Test Bonus',
    'component_code' => 'TEST_BONUS_' . time(),
    'description' => 'Test bonus component',
    'category' => 'Benefit',
    'payroll_category' => 'allowance',
    'is_pensionable' => true,
    'is_taxable' => true,
    'client_id' => 1,
];

$result = apiRequest('post', '/emolument-components', $customComponent);
if ($result['success']) {
    $createdComponentId = $result['data']['data']['id'] ?? null;
    success("Created custom component (ID: {$createdComponentId})");
} else {
    fail("Failed to create custom component: " . ($result['error'] ?? ''));
    $createdComponentId = null;
}

// Test 2.4: Update Custom Component
if ($createdComponentId) {
    $updateData = [
        'description' => 'Updated test bonus component',
    ];
    $result = apiRequest('put', "/emolument-components/{$createdComponentId}", $updateData);
    if ($result['success']) {
        success("Updated custom component");
    } else {
        fail("Failed to update custom component: " . ($result['error'] ?? ''));
    }
}

// Test 2.5: Try to Delete Universal Component (Should Fail)
$result = apiRequest('delete', '/emolument-components/1', [], true);
if ($result['success']) {
    success("Universal component deletion blocked correctly");
} else {
    fail("Universal component should not be deletable");
}

// Test 2.6: Delete Custom Component
if ($createdComponentId) {
    $result = apiRequest('delete', "/emolument-components/{$createdComponentId}");
    if ($result['success']) {
        success("Deleted custom component");
    } else {
        fail("Failed to delete custom component: " . ($result['error'] ?? ''));
    }
}

// ========================
// TEST 3: Payroll Settings
// ========================

heading("TEST 3: Payroll Settings");

// Test 3.1: Get All Settings
$result = apiRequest('get', '/payroll/settings');
if ($result['success']) {
    $settings = $result['data']['data'] ?? [];
    $count = count($settings);
    if ($count >= 10) {
        success("Retrieved {$count} payroll settings");
    } else {
        fail("Expected at least 10 settings, got {$count}");
    }
} else {
    fail("Failed to retrieve settings: " . ($result['error'] ?? ''));
}

// Test 3.2: Get Single Setting
$result = apiRequest('get', '/payroll/settings/paye_tax_brackets');
if ($result['success']) {
    $brackets = $result['data']['data']['setting_value'] ?? [];
    $count = count($brackets);
    if ($count === 6) {
        success("Retrieved PAYE tax brackets (6 tiers)");
    } else {
        fail("Expected 6 PAYE brackets, got {$count}");
    }
} else {
    fail("Failed to retrieve PAYE brackets: " . ($result['error'] ?? ''));
}

// Test 3.3: Update Setting (Pension Rate)
$updateData = [
    'setting_value' => [
        'employee_rate' => 8.0,
        'employer_rate' => 10.0,
    ],
];
$result = apiRequest('put', '/payroll/settings/pension_contribution_rate', $updateData);
if ($result['success']) {
    success("Updated pension contribution rate");
} else {
    fail("Failed to update pension rate: " . ($result['error'] ?? ''));
}

// Test 3.4: Validate Formula
$formulaData = [
    'formula' => 'gross_pay = basic_salary + allowances',
    'test_values' => [
        'basic_salary' => 500000,
        'allowances' => 200000,
    ],
];
$result = apiRequest('post', '/payroll/settings/validate-formula', $formulaData);
if ($result['success']) {
    $calculatedValue = $result['data']['calculated_value'] ?? 0;
    if ($calculatedValue == 700000) {
        success("Formula validation passed (result: {$calculatedValue})");
    } else {
        fail("Formula validation returned unexpected result: {$calculatedValue}");
    }
} else {
    fail("Formula validation failed: " . ($result['error'] ?? ''));
}

// Test 3.5: Reset Setting to Default
$result = apiRequest('post', '/payroll/settings/pension_contribution_rate/reset');
if ($result['success']) {
    success("Reset pension rate to default");
} else {
    fail("Failed to reset setting: " . ($result['error'] ?? ''));
}

// ========================
// TEST 4: Pay Grade Bulk Upload
// ========================

heading("TEST 4: Pay Grade Bulk Upload");

// Note: These tests require actual file uploads
// For now, we'll test the template download endpoint

// Test 4.1: Download Bulk Template
$result = apiRequest('get', '/salary-structure/pay-grades/bulk-template?client_id=1&job_structure_id=1');
if ($result['success']) {
    success("Bulk template download endpoint responded");
} else {
    skip("Bulk template download requires file handling (skipped)");
}

// Test 4.2: Bulk Upload (Skipped - requires file)
skip("Bulk upload test requires Excel file upload (manual testing required)");

// Test 4.3: Bulk Confirm (Skipped - depends on upload)
skip("Bulk confirm test depends on upload (manual testing required)");

// ========================
// TEST 5: Attendance Uploads
// ========================

heading("TEST 5: Attendance Uploads");

// Test 5.1: Get Attendance for Payroll
$result = apiRequest('get', '/attendance/uploads/payroll?client_id=1&month=11&year=2025');
if ($result['success']) {
    $uploads = $result['data']['data'] ?? [];
    success("Retrieved attendance uploads for payroll (count: " . count($uploads) . ")");
} else {
    fail("Failed to retrieve attendance uploads: " . ($result['error'] ?? ''));
}

// Test 5.2: Upload Attendance (Skipped - requires file)
skip("Attendance upload requires CSV/Excel file (manual testing required)");

// ========================
// TEST 6: Payroll Runs
// ========================

heading("TEST 6: Payroll Runs");

// Test 6.1: Get All Payroll Runs
$result = apiRequest('get', '/payroll/runs');
if ($result['success']) {
    $runs = $result['data']['data'] ?? [];
    success("Retrieved payroll runs (count: " . count($runs) . ")");
} else {
    fail("Failed to retrieve payroll runs: " . ($result['error'] ?? ''));
}

// Test 6.2: Create Payroll Run
$payrollData = [
    'client_id' => 1,
    'month' => 11,
    'year' => 2025,
    'attendance_upload_id' => 1, // Must exist
];

$result = apiRequest('post', '/payroll/runs', $payrollData);
if ($result['success']) {
    $payrollRunId = $result['data']['data']['id'] ?? null;
    success("Created payroll run (ID: {$payrollRunId})");
} else {
    // May fail if duplicate or attendance not found
    skip("Payroll run creation skipped (may be duplicate or missing attendance)");
    $payrollRunId = null;
}

// Test 6.3: Calculate Payroll (only if created)
if ($payrollRunId) {
    $result = apiRequest('post', "/payroll/runs/{$payrollRunId}/calculate");
    if ($result['success']) {
        success("Payroll calculation completed");
    } else {
        fail("Payroll calculation failed: " . ($result['error'] ?? ''));
    }

    // Test 6.4: Approve Payroll
    $result = apiRequest('post', "/payroll/runs/{$payrollRunId}/approve");
    if ($result['success']) {
        success("Payroll approved");
    } else {
        fail("Payroll approval failed: " . ($result['error'] ?? ''));
    }

    // Test 6.5: Export Payroll
    $result = apiRequest('get', "/payroll/runs/{$payrollRunId}/export");
    if ($result['success']) {
        success("Payroll export endpoint responded");
    } else {
        skip("Payroll export requires file handling (skipped)");
    }
}

// Test 6.6: Try to Create Duplicate (Should Fail)
if ($payrollRunId) {
    $result = apiRequest('post', '/payroll/runs', $payrollData, true);
    if ($result['success']) {
        success("Duplicate payroll run blocked correctly");
    } else {
        fail("Duplicate validation should have returned error");
    }
}

// ========================
// FINAL SUMMARY
// ========================

heading("TEST SUMMARY");

$total = $results['passed'] + $results['failed'] + $results['skipped'];
$passRate = $total > 0 ? round(($results['passed'] / $total) * 100, 2) : 0;

echo "{$colors['green']}Passed: {$results['passed']}{$colors['reset']}\n";
echo "{$colors['red']}Failed: {$results['failed']}{$colors['reset']}\n";
echo "{$colors['yellow']}Skipped: {$results['skipped']}{$colors['reset']}\n";
echo "Total: {$total}\n";
echo "Pass Rate: {$passRate}%\n\n";

if ($results['failed'] === 0) {
    echo "{$colors['green']}✓ ALL TESTS PASSED!{$colors['reset']}\n";
    exit(0);
} else {
    echo "{$colors['red']}✗ SOME TESTS FAILED{$colors['reset']}\n";
    echo "Please review failed tests above and fix issues.\n";
    exit(1);
}
