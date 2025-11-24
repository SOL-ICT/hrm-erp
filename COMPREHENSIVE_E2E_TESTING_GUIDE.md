# Comprehensive End-to-End Testing Guide

## Overview

This guide covers two complementary testing approaches:

1. **Backend E2E Test** (`comprehensive_e2e_test.php`) - Full API and database validation
2. **Frontend Payload Validator** (`payload-validator.js`) - Real-time UI payload validation

Together, these ensure complete system integrity from frontend→backend→database.

---

## 1. Backend End-to-End Test

### Purpose

Validates the **complete data flow** through the entire system:

- Job Structure Setup
- Pay Grade Creation (Manual & Excel)
- Emolument Component Validation
- Staff Assignment
- Attendance Upload
- Payroll Calculation
- Database Integrity

### Prerequisites

```bash
# 1. Ensure Docker containers are running
docker-compose up -d

# 2. Verify Laravel API is accessible
curl http://localhost:8000/api/health

# 3. Update credentials in comprehensive_e2e_test.php
# Lines 24-25:
define('TEST_EMAIL', 'admin@example.com');    # Your email
define('TEST_PASSWORD', 'password');           # Your password
```

### Running the Test

```bash
# Navigate to backend directory
cd c:\Project\hrm-erp\backend

# Run comprehensive E2E test
php comprehensive_e2e_test.php
```

### Expected Output

```
================================================================================
PHASE 1: AUTHENTICATION
================================================================================

TEST #1: Login with credentials... ✓ PASS - Token received: eyJ0eXAiOiJKV1QiLCJh...

================================================================================
PHASE 2: CLIENT & JOB STRUCTURE SETUP
================================================================================

TEST #2: Get list of clients... ✓ PASS - Client found: ABC Corp (ID: 25)
TEST #3: Get job structures for client... ✓ PASS - Job structure: Driver (ID: 20)
TEST #4: Validate job structure has pay_structures... ✓ PASS - Pay structure types: Monthly Salary, Hourly Wage

================================================================================
PHASE 3: EMOLUMENT COMPONENTS VALIDATION
================================================================================

TEST #5: Get universal emolument components... ✓ PASS - 11 universal components found
TEST #6: Verify component categories... ✓ PASS - All categories present: salary, allowance, deduction, reimbursable

... (continues through all phases)

================================================================================
TEST EXECUTION SUMMARY
================================================================================

Total Tests:  35
Passed:       35
Failed:       0
Pass Rate:    100%

✓ ALL TESTS PASSED!
✓ End-to-end workflow validated successfully!
```

### What It Tests

#### Phase 1: Authentication

- ✓ User login with credentials
- ✓ Bearer token generation
- ✓ Token validation

#### Phase 2: Client & Job Structure

- ✓ Fetch clients list
- ✓ Get job structures for selected client
- ✓ Validate pay_structures configuration
- ✓ Verify job category data integrity

#### Phase 3: Emolument Components

- ✓ Fetch universal template components
- ✓ Validate all 11 required components exist
- ✓ Verify payroll categories (salary, allowance, deduction, reimbursable)
- ✓ Check component codes and names

#### Phase 4: Pay Grade Setup

- ✓ Create pay grade via API (manual method)
- ✓ Download Excel template
- ✓ Validate template generation
- ✓ Verify pay grade persisted in database
- ✓ Check grade-job structure relationship

#### Phase 5: Staff Assignment

- ✓ Fetch staff list
- ✓ Create test staff if needed
- ✓ Assign staff to job structure
- ✓ Link staff to pay grade
- ✓ Validate staff-pay grade-job relationships in DB

#### Phase 6: Attendance Upload

- ✓ Generate CSV attendance data
- ✓ Test attendance upload endpoint
- ✓ Validate CSV parsing logic
- ✓ Check attendance record creation

#### Phase 7: Payroll Settings

- ✓ Fetch payroll settings for client
- ✓ Validate PAYE tax configuration
- ✓ Check pension rates (employee & employer)
- ✓ Verify formula integrity

#### Phase 8: Payroll Run

- ✓ Create payroll run
- ✓ Calculate payroll (full calculation)
- ✓ Verify gross pay calculation
- ✓ Validate net pay (after deductions)
- ✓ Check payroll status transitions

#### Phase 9: Database Integrity

- ✓ Verify payroll_runs table
- ✓ Check payroll_details records
- ✓ Validate emolument breakdown JSON
- ✓ Confirm staff-paygrade-job relationships
- ✓ Test data consistency across all tables

#### Phase 10: Cleanup

- Optionally preserves test data for manual inspection
- Reports created record IDs for debugging

---

## 2. Frontend Payload Validator

### Purpose

Intercepts **frontend API calls in real-time** and validates payloads against expected backend schemas.

### Setup

#### Option A: Browser Console (Quick Test)

```javascript
// 1. Open browser to http://localhost:3000
// 2. Open Developer Console (F12)
// 3. Paste the following:

const script = document.createElement("script");
script.src = "/payload-validator.js";
document.head.appendChild(script);

// 4. Wait for console message: "✅ Payload validator initialized"
```

#### Option B: Automated Testing (Recommended)

Add to your test setup file:

```javascript
// frontend/cypress/support/e2e.js (if using Cypress)
// OR frontend/tests/setup.js (if using Jest)

import PayloadValidator from "../../public/payload-validator.js";

beforeEach(() => {
  window.payloadValidator = new PayloadValidator();
});

afterEach(() => {
  const report = window.payloadValidator.getReport();
  if (report.invalid > 0) {
    throw new Error(`${report.invalid} invalid payloads detected!`);
  }
});
```

### Usage

Once activated, the validator **automatically intercepts** all API calls. Simply use the application:

#### Test Scenario 1: Create Pay Grade

```
1. Navigate to: Salary Structure → Select Client → Select Job Category
2. Click "Add Pay Grade" button
3. Fill form:
   - Grade Name: "Senior Developer"
   - Grade Code: "DEV-SR"
   - Pay Structure Type: "Monthly Salary"
4. Click Save

Console Output:
🔍 API Call: POST /salary-structure/pay-grades
  ✓ Payload Valid
  Payload: {
    client_id: 25,
    job_structure_id: 20,
    grade_name: "Senior Developer",
    grade_code: "DEV-SR",
    pay_structure_type: "Monthly Salary",
    currency: "NGN",
    is_active: true,
    emoluments: {}
  }
```

#### Test Scenario 2: Excel Upload

```
1. Click "Excel Upload" button
2. Download template
3. Fill amounts and upload

Console Output:
🔍 API Call: POST /salary-structure/pay-grades/bulk-upload
  ✓ Payload Valid
  Payload: {
    client_id: 25,
    job_structure_id: 20,
    file: File { name: "pay_grades.xlsx", size: 12345 }
  }

🔍 API Call: POST /salary-structure/pay-grades/bulk-confirm
  ✓ Payload Valid
  Payload: {
    client_id: 25,
    job_structure_id: 20,
    data: [
      { grade_code: "DRV-L1", BASIC_SALARY: 50000, HOUSING: 15000, ... },
      { grade_code: "DRV-L2", BASIC_SALARY: 60000, HOUSING: 18000, ... }
    ]
  }
```

#### Test Scenario 3: Payroll Run

```
1. Navigate to: Payroll Processing → Create Payroll Run
2. Select pay period
3. Click Calculate
4. Approve payroll

Console Output:
🔍 API Call: POST /payroll/runs
  ✓ Payload Valid
  Payload: {
    client_id: 25,
    pay_period_start: "2025-11-01",
    pay_period_end: "2025-11-30",
    payment_date: "2025-12-05",
    description: "November 2025 Payroll"
  }

🔍 API Call: POST /payroll/runs/15/calculate
  ✓ Payload Valid
  Payload: {}
```

### Validation Errors Example

If frontend sends incorrect payload:

```javascript
Console Output:
🔍 API Call: POST /salary-structure/pay-grades
  ✗ Payload Invalid
  Errors:
    - Missing required field: job_structure_id
    - Field 'client_id' should be number, got string
    - Unknown field: invalid_field
  Payload: {
    client_id: "25",           // ❌ Should be number
    grade_name: "Test",
    // ❌ Missing job_structure_id
    invalid_field: "test"      // ❌ Not in schema
  }
```

### Generate Report

```javascript
// In browser console:
payloadValidator.getReport()

// Output:
{
  total: 15,
  valid: 14,
  invalid: 1,
  results: [...]
}

// Export to JSON file:
payloadValidator.exportResults()
// Downloads: payload-validation-1732456789.json
```

---

## 3. Complete Testing Workflow

### Step-by-Step System Validation

#### Day 1: Backend Validation

```bash
# 1. Run comprehensive E2E test
cd backend
php comprehensive_e2e_test.php

# Expected: All tests pass (100%)

# 2. Review test data in database
# Access phpMyAdmin: http://localhost:8081
# Check tables:
#   - pay_grade_structures
#   - payroll_runs
#   - payroll_details
#   - staff
```

#### Day 2: Frontend Validation

```bash
# 1. Start frontend
cd frontend
npm run dev

# 2. Open browser: http://localhost:3000

# 3. Load payload validator
# (paste script from Option A above)

# 4. Perform UI actions:
#    - Create job structure
#    - Create pay grade
#    - Upload Excel
#    - Create staff
#    - Upload attendance
#    - Run payroll

# 5. Check console for validation results
payloadValidator.getReport()

# Expected: 0 invalid payloads
```

#### Day 3: Integration Testing

```bash
# Combine both approaches:

# Terminal 1: Run backend test
cd backend
php comprehensive_e2e_test.php

# Terminal 2: Monitor Laravel logs
docker-compose exec laravel-api tail -f storage/logs/laravel.log

# Browser: Validate frontend
# (with payload validator active)
# Perform same actions as backend test manually in UI

# Compare:
# - Backend test creates data via API
# - Frontend should send identical payloads
# - Database should have matching records
```

---

## 4. Validation Schemas

### Pay Grade Creation

```javascript
{
  client_id: number,              // Required
  job_structure_id: number,       // Required
  grade_name: string,             // Required
  grade_code: string,             // Required (unique)
  pay_structure_type: string,     // Required
  emoluments: object,             // Optional (can be empty {})
  currency: string,               // Optional (default: "NGN")
  is_active: boolean              // Optional (default: true)
}
```

### Excel Bulk Upload

```javascript
{
  client_id: number,              // Required
  job_structure_id: number,       // Required
  file: File                      // Required (.xlsx or .xls)
}
```

### Excel Bulk Confirm

```javascript
{
  client_id: number,              // Required
  job_structure_id: number,       // Required
  data: [                         // Required (array of grade emoluments)
    {
      grade_code: string,         // Must match existing grade
      BASIC_SALARY: number,
      HOUSING: number,
      TRANSPORT: number,
      MEAL_ALLOWANCE: number,
      OTHER_ALLOWANCES: number,
      CLIENT_OP_FUND: number,
      OTJ_TELEPHONE: number,
      OTJ_TRANSPORT: number,
      UNIFORM: number,
      LEAVE_ALLOWANCE: number,
      THIRTEENTH_MONTH: number
    }
  ]
}
```

### Attendance Upload

```javascript
{
  client_id: number,              // Required
  file: File,                     // Required (CSV or Excel)
  pay_period_start: string,       // Required (YYYY-MM-DD)
  pay_period_end: string,         // Required (YYYY-MM-DD)
  description: string             // Optional
}
```

### Payroll Run Creation

```javascript
{
  client_id: number,              // Required
  pay_period_start: string,       // Required (YYYY-MM-DD)
  pay_period_end: string,         // Required (YYYY-MM-DD)
  payment_date: string,           // Required (YYYY-MM-DD)
  description: string             // Optional
}
```

### Payroll Calculation

```javascript
{
  force: boolean; // Optional (re-calculate even if already done)
}
```

---

## 5. Troubleshooting

### Backend Test Fails

**Issue:** Authentication failed

```bash
# Solution: Update credentials in comprehensive_e2e_test.php
define('TEST_EMAIL', 'your-email@example.com');
define('TEST_PASSWORD', 'your-password');
```

**Issue:** No clients found

```bash
# Solution: Seed database
docker-compose exec laravel-api php artisan db:seed --class=ClientSeeder
```

**Issue:** 500 Internal Server Error

```bash
# Solution: Check Laravel logs
docker-compose exec laravel-api tail -f storage/logs/laravel.log
```

### Frontend Validator Issues

**Issue:** Validator not initializing

```javascript
// Clear cache and reload
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Issue:** False positives (valid payloads marked invalid)

```javascript
// Update schema in payload-validator.js
// Add new fields to schemas object
```

**Issue:** Can't see console output

```javascript
// Ensure console log level is set to "Verbose" or "All"
// Chrome DevTools: Console → Log Levels dropdown
```

---

## 6. Success Criteria

### Backend Test: ✅ Pass Conditions

- [ ] All 35+ tests pass
- [ ] Pass rate: 100%
- [ ] No database errors
- [ ] Payroll calculations accurate
- [ ] All relationships validated

### Frontend Validator: ✅ Pass Conditions

- [ ] 0 invalid payloads
- [ ] All required fields present
- [ ] Correct data types
- [ ] No unknown fields (warnings only)

### Integration: ✅ Complete Validation

- [ ] Backend test creates data successfully
- [ ] Frontend sends identical payloads to backend test
- [ ] Manual UI actions produce same database state as automated test
- [ ] Excel upload works for 1, 5, 10+ pay grades
- [ ] Payroll calculation matches manual verification

---

## 7. Continuous Integration

### Add to CI/CD Pipeline

```yaml
# .github/workflows/test.yml (GitHub Actions example)
name: E2E Tests

on: [push, pull_request]

jobs:
  backend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start Docker services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 30
      - name: Run E2E test
        run: docker-compose exec -T laravel-api php comprehensive_e2e_test.php
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: e2e-results
          path: backend/test-results.json
```

---

## 8. Next Steps

1. **Run Backend Test First**

   ```bash
   cd backend
   php comprehensive_e2e_test.php
   ```

2. **Activate Frontend Validator**

   - Open http://localhost:3000
   - Load payload-validator.js
   - Perform UI actions

3. **Compare Results**

   - Backend test output
   - Frontend validation report
   - Database inspection via phpMyAdmin

4. **Document Issues**

   - Save payload validation JSON
   - Screenshot any errors
   - Note test IDs that failed

5. **Iterate and Fix**
   - Address any failed tests
   - Update schemas if needed
   - Re-run until 100% pass rate

---

## Files Created

1. **`backend/comprehensive_e2e_test.php`** - Full backend API & DB test
2. **`frontend/public/payload-validator.js`** - Frontend payload interceptor
3. **This guide** - Complete testing documentation

**Ready to validate your entire system! 🚀**
