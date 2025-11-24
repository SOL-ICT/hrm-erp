# Payroll Runs API Specification

## Overview

Complete API specification for Payroll Runs functionality - production-ready implementation.

## Database Schema

### payroll_runs Table (Already Exists)

- `id` - Primary key
- `client_id` - Foreign key to clients
- `run_name` - String (e.g., "November 2025 Payroll")
- `pay_period_start` - Date (work period start)
- `pay_period_end` - Date (work period end)
- `status` - ENUM('draft', 'calculated', 'approved', 'paid', 'cancelled')
- `employee_count` - Integer
- `total_gross` - Decimal(15,2)
- `total_deductions` - Decimal(15,2)
- `total_net` - Decimal(15,2)
- `calculation_metadata` - JSON (detailed breakdown)
- `created_by` - Foreign key to users
- `updated_by` - Foreign key to users
- `calculated_at` - Timestamp
- `approved_at` - Timestamp
- `approved_by` - Foreign key to users
- `timestamps` - created_at, updated_at

### payroll_run_details Table (Already Exists)

- `id` - Primary key
- `payroll_run_id` - Foreign key to payroll_runs
- `staff_id` - Foreign key to staff
- `basic_salary` - Decimal(12,2)
- `gross_pay` - Decimal(12,2)
- `taxable_income` - Decimal(12,2)
- `paye_tax` - Decimal(12,2)
- `pension_employee` - Decimal(12,2)
- `pension_employer` - Decimal(12,2)
- `nhf` - Decimal(12,2)
- `total_deductions` - Decimal(12,2)
- `net_pay` - Decimal(12,2)
- `emoluments_breakdown` - JSON (all allowances/deductions)
- `calculation_notes` - TEXT
- `timestamps` - created_at, updated_at

## API Endpoints

### 1. GET /api/payroll/runs

**Purpose:** List all payroll runs with filters

**Query Parameters:**

- `client_id` (required) - Filter by client
- `status` (optional) - Filter by status
- `pay_period_start` (optional) - Filter by date range
- `pay_period_end` (optional) - Filter by date range
- `per_page` (optional, default: 15) - Pagination

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "run_name": "November 2025 Payroll",
      "pay_period_start": "2025-11-01",
      "pay_period_end": "2025-11-30",
      "status": "approved",
      "employee_count": 45,
      "total_gross": 12500000.0,
      "total_deductions": 2100000.0,
      "total_net": 10400000.0,
      "created_by": "Admin User",
      "created_at": "2025-11-20 10:30:00",
      "calculated_at": "2025-11-20 14:15:00",
      "approved_at": "2025-11-21 09:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 42
  }
}
```

### 2. POST /api/payroll/runs

**Purpose:** Create new payroll run

**Request Body:**

```json
{
  "client_id": 25,
  "run_name": "December 2025 Payroll",
  "pay_period_start": "2025-12-01",
  "pay_period_end": "2025-12-31"
}
```

**Validation Rules:**

- `client_id` - required, exists:clients,id
- `run_name` - required, string, max:255
- `pay_period_start` - required, date
- `pay_period_end` - required, date, after:pay_period_start

**Business Rules:**

- Prevent duplicate: No overlapping pay periods for same client
- Auto-generate run_name if not provided: "Month YYYY Payroll"
- Initial status: 'draft'
- Set created_by to authenticated user

**Response:**

```json
{
  "success": true,
  "message": "Payroll run created successfully",
  "data": {
    "id": 5,
    "run_name": "December 2025 Payroll",
    "status": "draft",
    "pay_period_start": "2025-12-01",
    "pay_period_end": "2025-12-31",
    "client_id": 25
  }
}
```

### 3. POST /api/payroll/runs/{id}/calculate

**Purpose:** Calculate payroll for all employees

**Process:**

1. Validate run status is 'draft'
2. Get all active staff for the client
3. Get attendance data for the pay period (if exists)
4. Load pay grade emoluments for each staff
5. Load payroll settings (PAYE, pension, etc.)
6. For each employee:
   - Calculate gross pay from emoluments
   - Calculate taxable income
   - Calculate PAYE using brackets
   - Calculate pension (employee + employer)
   - Calculate NHF, NSITF, ITF
   - Calculate total deductions
   - Calculate net pay
7. Store results in payroll_run_details
8. Update payroll_runs totals
9. Set status to 'calculated'
10. Set calculated_at timestamp

**Response:**

```json
{
  "success": true,
  "message": "Payroll calculated successfully for 45 employees",
  "data": {
    "id": 5,
    "status": "calculated",
    "employee_count": 45,
    "total_gross": 12500000.0,
    "total_deductions": 2100000.0,
    "total_net": 10400000.0,
    "calculated_at": "2025-11-22 15:30:00"
  }
}
```

### 4. GET /api/payroll/runs/{id}

**Purpose:** Get payroll run details with employee breakdown

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "run_name": "November 2025 Payroll",
    "pay_period_start": "2025-11-01",
    "pay_period_end": "2025-11-30",
    "status": "calculated",
    "employee_count": 45,
    "total_gross": 12500000.0,
    "total_deductions": 2100000.0,
    "total_net": 10400000.0,
    "employees": [
      {
        "id": 1,
        "staff_id": 123,
        "staff_name": "John Doe",
        "employee_number": "EMP001",
        "pay_grade": "Grade 7",
        "basic_salary": 250000.0,
        "gross_pay": 350000.0,
        "taxable_income": 310000.0,
        "paye_tax": 45000.0,
        "pension_employee": 20000.0,
        "pension_employer": 25000.0,
        "nhf": 8750.0,
        "total_deductions": 73750.0,
        "net_pay": 276250.0,
        "emoluments_breakdown": {
          "allowances": [
            { "code": "HRA", "name": "Housing Allowance", "amount": 50000.0 },
            { "code": "TRA", "name": "Transport Allowance", "amount": 50000.0 }
          ],
          "deductions": [
            { "code": "PAYE", "name": "PAYE Tax", "amount": 45000.0 },
            {
              "code": "PEN_EE",
              "name": "Pension (Employee)",
              "amount": 20000.0
            }
          ]
        }
      }
    ]
  }
}
```

### 5. POST /api/payroll/runs/{id}/approve

**Purpose:** Approve calculated payroll

**Validation:**

- Run status must be 'calculated'
- User must have 'payroll.runs.approve' permission

**Process:**

1. Validate status
2. Set status to 'approved'
3. Set approved_at timestamp
4. Set approved_by to authenticated user

**Response:**

```json
{
  "success": true,
  "message": "Payroll run approved successfully",
  "data": {
    "id": 5,
    "status": "approved",
    "approved_at": "2025-11-22 16:00:00",
    "approved_by": "Manager Name"
  }
}
```

### 6. GET /api/payroll/runs/{id}/export

**Purpose:** Export payroll to Excel

**Format:**

- Sheet 1: Summary (totals, metadata)
- Sheet 2: Employee Details (all emoluments)
- Sheet 3: Statutory Deductions Summary
- Sheet 4: Bank Transfer List (account numbers, net pay)

**Response:** Binary file download (application/vnd.ms-excel)

### 7. POST /api/payroll/runs/{id}/cancel

**Purpose:** Cancel payroll run

**Validation:**

- Run status must be 'draft' or 'calculated'
- Cannot cancel 'approved' or 'paid' runs

**Response:**

```json
{
  "success": true,
  "message": "Payroll run cancelled",
  "data": {
    "id": 5,
    "status": "cancelled"
  }
}
```

### 8. DELETE /api/payroll/runs/{id}

**Purpose:** Delete payroll run

**Validation:**

- Run status must be 'draft' or 'cancelled'
- Cannot delete 'calculated', 'approved', or 'paid' runs

**Response:**

```json
{
  "success": true,
  "message": "Payroll run deleted successfully"
}
```

## Calculation Logic

### Step 1: Get Basic Salary

```php
$basicSalary = $staff->payGrade->basic_salary; // From pay_grade_structures
```

### Step 2: Calculate Gross Pay

```php
$grossPay = 0;
foreach ($staff->payGrade->emoluments as $emolument) {
    if ($emolument->category === 'allowance') {
        $grossPay += $emolument->amount;
    }
}
$grossPay += $basicSalary;
```

### Step 3: Calculate Taxable Income

```php
// From payroll_settings: TAX_EXEMPTION (₦840,000 annually = ₦70,000 monthly)
$taxExemption = 70000;
$taxableIncome = max(0, $grossPay - $taxExemption);
```

### Step 4: Calculate PAYE Tax

```php
// From payroll_settings: PAYE_BRACKETS
$payeBrackets = [
    ['tier' => 1, 'min' => 0, 'max' => 300000, 'rate' => 7],
    ['tier' => 2, 'min' => 300000, 'max' => 600000, 'rate' => 11],
    // ... etc
];

$payeTax = 0;
foreach ($payeBrackets as $bracket) {
    if ($taxableIncome > $bracket['min']) {
        $taxableInBracket = min($taxableIncome, $bracket['max'] ?? PHP_INT_MAX) - $bracket['min'];
        $payeTax += ($taxableInBracket * $bracket['rate']) / 100;
    }
}
```

### Step 5: Calculate Pension

```php
// From payroll_settings: PENSION_EMPLOYEE_RATE (8%), PENSION_EMPLOYER_RATE (10%)
$pensionEmployee = ($grossPay * 8) / 100;
$pensionEmployer = ($grossPay * 10) / 100;
```

### Step 6: Calculate NHF

```php
// From payroll_settings: NHF_RATE (2.5%)
$nhf = ($basicSalary * 2.5) / 100;
```

### Step 7: Calculate Total Deductions

```php
$totalDeductions = $payeTax + $pensionEmployee + $nhf;
// Add any custom deductions from emoluments
```

### Step 8: Calculate Net Pay

```php
$netPay = $grossPay - $totalDeductions;
```

## Status Transitions

```
draft → calculated → approved → paid
  ↓         ↓
cancelled  cancelled
```

**Rules:**

- Draft can be: calculated, cancelled, deleted
- Calculated can be: approved, cancelled (recalculate = new draft)
- Approved can be: paid (cannot be cancelled or deleted)
- Paid cannot change status
- Cancelled can be: deleted

## Error Handling

### 409 Conflict

- Duplicate pay period for client
- Invalid status transition

### 422 Validation Error

- Missing required fields
- Invalid date ranges
- Pay period end before start

### 404 Not Found

- Payroll run ID doesn't exist

### 403 Forbidden

- User lacks approval permission
- Trying to delete approved/paid run

## Implementation Files Needed

### Backend:

1. **PayrollRunController.php** (NEW)

   - All 8 endpoints above

2. **PayrollCalculationService.php** (ENHANCE - already exists)

   - calculatePayrollRun($runId) method
   - Calculate for all employees
   - Store results in payroll_run_details

3. **PayrollExportService.php** (NEW)
   - generatePayrollExcel($runId)
   - Generate 4-sheet Excel file

### Frontend:

1. **PayrollRunsTab.jsx** (REPLACE MOCK DATA)

   - Remove hardcoded data
   - Integrate with real API
   - Add Calculate button → POST /api/payroll/runs/{id}/calculate
   - Add Approve button → POST /api/payroll/runs/{id}/approve
   - Add Export button → GET /api/payroll/runs/{id}/export

2. **CreatePayrollRunModal.jsx** (UPDATE)

   - Remove payment_date field (not needed per policy)
   - Keep only: client, run_name, pay_period_start, pay_period_end

3. **PayrollRunDetailModal.jsx** (NEW)
   - Show employee breakdown
   - GET /api/payroll/runs/{id}

## Payment Date Clarification

**Decision:** REMOVE payment_date from payroll runs

**Reason:**

- Payment dates are governed by company policy and SLA
- Policy states fixed payment schedule (e.g., "5th of following month")
- No need to store in database if it's always calculated from policy
- Can be displayed in UI as calculated field if needed

**If payment_date needed in future:**

- Add as calculated field based on pay_period_end + policy days
- Display only, don't store

## Next Steps

1. Build PayrollRunController with all 8 endpoints
2. Enhance PayrollCalculationService.calculatePayrollRun()
3. Create PayrollExportService
4. Remove mock data from PayrollRunsTab
5. Integrate frontend with real API
6. Fix ClientSelector display issue
7. Test complete workflow: Create → Calculate → Approve → Export
