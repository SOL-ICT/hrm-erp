# 📊 PAYROLL PROCESSING SYSTEM - COMPREHENSIVE DOCUMENTATION

**Date Created:** November 21, 2025  
**System:** HRM-ERP Payroll Module  
**Purpose:** Complete documentation to ensure minimal errors during implementation

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Existing Infrastructure Audit](#existing-infrastructure-audit)
3. [Database Architecture](#database-architecture)
4. [Calculation Formulas](#calculation-formulas)
5. [Implementation Plan](#implementation-plan)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Testing Strategy](#testing-strategy)

---

## 🎯 SYSTEM OVERVIEW

### Business Requirements

**Primary Goal:** Automate monthly payroll processing for all clients with:

- Universal template of 11 standard emolument components
- Attendance-based salary calculation with fuzzy name matching
- Progressive tax calculation (Nigerian tax system)
- Pension deduction (8% of pensionable components)
- Proration based on calendar days OR working days (per client setting)
- Export to Excel for bank credit

### Key Stakeholders

- **HR Managers:** Upload attendance, run payroll, approve payments
- **Finance Team:** Export Credit to Bank reports
- **Admins:** Configure tax brackets, manage calculation formulas
- **Clients:** Each has unique grading structures but standard calculation logic

---

## 🔍 EXISTING INFRASTRUCTURE AUDIT

### ✅ What Already Exists

#### Backend Components

| Component                     | File Path                                                                | Status      | Purpose                          |
| ----------------------------- | ------------------------------------------------------------------------ | ----------- | -------------------------------- |
| **PayGradeStructure Model**   | `backend/app/Models/PayGradeStructure.php`                               | ✅ Complete | Stores grade emoluments as JSON  |
| **SalaryStructureController** | `backend/app/Http/Controllers/SalaryStructureController.php`             | ✅ Complete | Full CRUD for grades (739 lines) |
| **EmolumentComponent Model**  | `backend/app/Models/EmolumentComponent.php`                              | ✅ Complete | Component master data            |
| **Routes**                    | `backend/routes/modules/client-contract-management/salary-structure.php` | ✅ Complete | REST API endpoints               |

**SalaryStructureController Methods:**

- `getPayGrades()` - List with filtering by job structure
- `showPayGrade($id)` - Single grade details
- `storePayGrade()` - Create new grade with emoluments
- `updatePayGrade($id)` - Update grade emoluments
- `deletePayGrade($id)` - Delete grade
- `getEmolumentComponents()` - Load all components
- `getPayStructureTypes()` - Load structure types
- `getClients()` - Client dropdown

#### Frontend Components

| Component            | File Path                                                                                                           | Status      | Purpose                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------- |
| **PayGradeForm**     | `frontend/src/components/admin/modules/client-contract-management/submodules/salary-structure/PayGradeForm.jsx`     | ✅ Complete | Create/edit grade with emolument amounts |
| **PayDetailsMaster** | `frontend/src/components/admin/modules/client-contract-management/submodules/salary-structure/PayDetailsMaster.jsx` | ✅ Complete | Grade management list view               |
| **API Service**      | `frontend/src/services/api.js`                                                                                      | ✅ Complete | salaryStructureAPI.payGrades.\* methods  |

**PayGradeForm Features:**

- Load emolument components dynamically
- Add/edit emolument amounts per component
- Auto-calculate total compensation
- Validate required fields
- Support job structure filtering

#### Database Tables

| Table                    | Records       | Status    | Notes                                         |
| ------------------------ | ------------- | --------- | --------------------------------------------- |
| **emolument_components** | 56 components | ✅ Exists | 6 basic, 46 allowance, 1 deduction, 3 benefit |
| **pay_grade_structures** | Variable      | ✅ Exists | Stores emoluments as JSON                     |
| **job_structures**       | Variable      | ✅ Exists | Links to pay grades                           |
| **clients**              | Variable      | ✅ Exists | Has `pay_calculation_basis` field             |
| **staff**                | Variable      | ✅ Exists | Has `pfa_code` (Pension Fund Admin)           |

### ⚠️ What Needs Modification

#### 1. emolument_components Table Enhancement

**Current Schema:**

```sql
- id
- component_code (VARCHAR)
- component_name (VARCHAR)
- category (ENUM: basic, allowance, deduction, benefit)
- is_taxable (BOOLEAN)
- calculation_method (VARCHAR)
- display_order (INT)
- is_active (BOOLEAN)
- created_at, updated_at
```

**Required Additions:**

```sql
ALTER TABLE emolument_components ADD COLUMN:
- is_universal_template (BOOLEAN DEFAULT FALSE) -- Flag for 11 standard components
- is_pensionable (BOOLEAN DEFAULT FALSE) -- Basic, Housing, Transport only
- payroll_category (ENUM: 'salary', 'allowance', 'reimbursable', 'deduction', 'statutory')
```

**Purpose:**

- `is_universal_template`: Identify the 11 components that ALL grades must have
- `is_pensionable`: Calculate 8% pension only on Basic Salary + Housing + Transport
- `payroll_category`: Separate Annual Gross vs Monthly Reimbursables

#### 2. pay_grade_structures Table Cleanup

**Redundant Columns to Remove:**

```sql
ALTER TABLE pay_grade_structures DROP COLUMN:
- basic_salary (redundant - use emoluments JSON)
- transport_allowance (redundant - use emoluments JSON)
- housing_allowance (redundant - use emoluments JSON)
- meal_allowance (redundant - use emoluments JSON)
```

**Reason:** These duplicate data already in `emoluments` JSON field. Single source of truth principle.

**Current Schema After Cleanup:**

```sql
- id
- job_structure_id (FK to job_structures)
- grade_name (VARCHAR)
- grade_code (VARCHAR UNIQUE)
- pay_structure_type (VARCHAR)
- emoluments (JSON) -- {"BASIC_SALARY": 600000, "HOUSING": 840000, ...}
- total_compensation (DECIMAL) -- Sum of all emoluments
- currency (VARCHAR DEFAULT 'NGN')
- is_active (BOOLEAN)
- created_by, updated_by, created_at, updated_at
```

---

## 🗄️ DATABASE ARCHITECTURE

### New Tables Required (6 Tables)

#### 1. tax_brackets

**Purpose:** Store Nigerian progressive tax rates (updatable by admin)

**Schema:**

```sql
CREATE TABLE tax_brackets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tier_number INT NOT NULL,                    -- 1, 2, 3, 4, 5, 6
    income_from DECIMAL(15,2) NOT NULL,          -- Lower bound
    income_to DECIMAL(15,2) NULL,                -- Upper bound (NULL = infinity)
    tax_rate DECIMAL(5,2) NOT NULL,              -- 0.00, 15.00, 18.00, 21.00, 23.00, 25.00
    description VARCHAR(255),                     -- "First ₦300,000"
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,                -- Track tax year changes
    effective_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_effective (is_active, effective_from, effective_to)
);
```

**Default Seed Data (Nigerian 2025 Tax Brackets):**

```php
[
    ['tier' => 1, 'from' => 0,       'to' => 300000,   'rate' => 0.00,  'desc' => 'First ₦300,000'],
    ['tier' => 2, 'from' => 300000,  'to' => 600000,   'rate' => 15.00, 'desc' => 'Next ₦300,000'],
    ['tier' => 3, 'from' => 600000,  'to' => 1100000,  'rate' => 18.00, 'desc' => 'Next ₦500,000'],
    ['tier' => 4, 'from' => 1100000, 'to' => 1600000,  'rate' => 21.00, 'desc' => 'Next ₦500,000'],
    ['tier' => 5, 'from' => 1600000, 'to' => 3200000,  'rate' => 23.00, 'desc' => 'Next ₦1,600,000'],
    ['tier' => 6, 'from' => 3200000, 'to' => NULL,     'rate' => 25.00, 'desc' => 'Above ₦3,200,000']
]
```

**Key Features:**

- Threshold exemption: First ₦840,000 is tax-free (₦300k + ₦300k + ₦240k)
- Admin can update rates when tax laws change
- Effective date tracking for historical payrolls

---

#### 2. payroll_calculation_formulas

**Purpose:** Store default calculation formulas with client/job_structure override capability

**Schema:**

```sql
CREATE TABLE payroll_calculation_formulas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    formula_code VARCHAR(50) NOT NULL UNIQUE,     -- 'TAXABLE_INCOME', 'PAYE', 'PENSION', etc.
    formula_name VARCHAR(100) NOT NULL,
    formula_expression TEXT NOT NULL,              -- "(annual_gross * 0.95) - (pensionable * 0.08)"
    description TEXT,
    is_system_default BOOLEAN DEFAULT TRUE,        -- Default formula
    client_id BIGINT UNSIGNED NULL,                -- NULL = system default, FK = client override
    job_structure_id BIGINT UNSIGNED NULL,         -- NULL = all jobs, FK = specific job
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (job_structure_id) REFERENCES job_structures(id) ON DELETE CASCADE,
    INDEX idx_client_job (client_id, job_structure_id),
    UNIQUE KEY unique_formula_scope (formula_code, client_id, job_structure_id)
);
```

**Default Seed Data (9 Formulas):**

```php
[
    ['code' => 'ANNUAL_GROSS', 'name' => 'Annual Gross Salary',
     'expression' => 'SUM(emoluments WHERE payroll_category IN (salary, allowance))'],

    ['code' => 'MONTHLY_GROSS', 'name' => 'Monthly Gross Salary',
     'expression' => '(annual_gross / 12) * (attendance_days / total_days)'],

    ['code' => 'PENSIONABLE_AMOUNT', 'name' => 'Pensionable Components',
     'expression' => 'SUM(emoluments WHERE is_pensionable = TRUE)'],

    ['code' => 'TAXABLE_INCOME', 'name' => 'Taxable Income',
     'expression' => '(annual_gross * 0.95) - (pensionable_amount * 0.08)'],

    ['code' => 'PAYE', 'name' => 'Pay As You Earn Tax',
     'expression' => 'progressive_tax(taxable_income) USING tax_brackets'],

    ['code' => 'PENSION', 'name' => 'Pension Deduction (8%)',
     'expression' => '(pensionable_amount * 0.08) * (attendance_days / total_days)'],

    ['code' => 'LEAVE_ALLOWANCE_DEDUCTION', 'name' => 'Leave Allowance Monthly Deduction',
     'expression' => '(LEAVE_ALLOWANCE / 12) * (attendance_days / total_days)'],

    ['code' => 'THIRTEENTH_MONTH_DEDUCTION', 'name' => '13th Month Monthly Deduction',
     'expression' => '(THIRTEENTH_MONTH / 12) * (attendance_days / total_days)'],

    ['code' => 'NET_PAY', 'name' => 'Net Pay',
     'expression' => 'monthly_gross - (paye + pension + leave_deduction + 13th_deduction)'],

    ['code' => 'CREDIT_TO_BANK', 'name' => 'Final Credit to Bank',
     'expression' => 'net_pay + (monthly_reimbursables / 12)']
]
```

**Key Features:**

- System defaults apply to all clients
- Client-specific overrides (e.g., different pension rates)
- Job structure-specific formulas (e.g., expatriate tax rules)
- Rarely used but essential for flexibility

---

#### 3. attendance_uploads

**Purpose:** Track monthly attendance file uploads per client

**Schema:**

```sql
CREATE TABLE attendance_uploads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    month INT NOT NULL,                            -- 1-12
    year INT NOT NULL,                             -- 2025
    file_path VARCHAR(500) NOT NULL,               -- Storage path
    original_filename VARCHAR(255) NOT NULL,
    total_records INT DEFAULT 0,
    matched_records INT DEFAULT 0,                 -- Successfully matched staff
    unmatched_records INT DEFAULT 0,               -- Fuzzy match failed
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    uploaded_by BIGINT UNSIGNED NULL,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_client_month_year (client_id, month, year),
    INDEX idx_status (status),
    INDEX idx_client_period (client_id, year, month)
);
```

**Usage Flow:**

1. HR uploads CSV: `Staff Name, Days Present, Days Absent`
2. System fuzzy matches names to `staff` table (Levenshtein distance)
3. Preview unmatched names for manual mapping
4. Confirm → Store in `staff_attendance`
5. Mark upload as `completed`

---

#### 4. staff_attendance

**Purpose:** Individual staff attendance records per month

**Schema:**

```sql
CREATE TABLE staff_attendance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_upload_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,             -- Denormalized for query speed
    month INT NOT NULL,
    year INT NOT NULL,
    days_present INT NOT NULL DEFAULT 0,
    days_absent INT NOT NULL DEFAULT 0,
    total_days INT NOT NULL,                        -- Calendar days OR working days (per client setting)
    attendance_percentage DECIMAL(5,2),             -- (days_present / total_days) * 100
    matched_name VARCHAR(255) NULL,                 -- Original name from CSV (for audit)
    match_confidence DECIMAL(5,2) NULL,             -- Fuzzy match confidence (0-100)
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_month_year (staff_id, month, year),
    INDEX idx_upload (attendance_upload_id),
    INDEX idx_staff_period (staff_id, year, month),
    INDEX idx_client_period (client_id, year, month)
);
```

**Key Features:**

- `total_days` varies:
  - Calendar days: 28-31 (based on month)
  - Working days: 20-23 (Mon-Fri only, excluding public holidays)
- `match_confidence`: Helps HR identify potential mismatches
- One record per staff per month (UNIQUE constraint prevents duplicates)

---

#### 5. payroll_runs

**Purpose:** Track monthly payroll execution and approval

**Schema:**

```sql
CREATE TABLE payroll_runs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    month INT NOT NULL,                             -- 1-12
    year INT NOT NULL,                              -- 2025
    attendance_upload_id BIGINT UNSIGNED NOT NULL,  -- Links to attendance data
    status ENUM('draft', 'calculated', 'approved', 'exported', 'cancelled') DEFAULT 'draft',
    total_staff_count INT DEFAULT 0,
    total_gross_pay DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) DEFAULT 0.00,
    total_net_pay DECIMAL(15,2) DEFAULT 0.00,
    total_credit_to_bank DECIMAL(15,2) DEFAULT 0.00,
    calculation_date TIMESTAMP NULL,                -- When calculation completed
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    exported_at TIMESTAMP NULL,
    export_file_path VARCHAR(500) NULL,
    notes TEXT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_client_month_year (client_id, month, year),
    INDEX idx_status (status),
    INDEX idx_client_period (client_id, year, month)
);
```

**Workflow States:**

1. **draft**: Created, not calculated yet
2. **calculated**: Calculation completed, awaiting review
3. **approved**: HR/Finance approved
4. **exported**: Excel file generated for bank upload
5. **cancelled**: Rolled back (recalculate needed)

---

#### 6. payroll_items

**Purpose:** Individual staff payroll calculation details (most critical table)

**Schema:**

```sql
CREATE TABLE payroll_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,             -- Denormalized
    pay_grade_structure_id BIGINT UNSIGNED NOT NULL,
    attendance_id BIGINT UNSIGNED NOT NULL,         -- FK to staff_attendance

    -- Staff Info (snapshot for audit)
    staff_name VARCHAR(255) NOT NULL,
    staff_code VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100),
    account_number VARCHAR(20),
    pfa_code VARCHAR(50),                           -- Pension Fund Administrator

    -- Attendance Data
    days_present INT NOT NULL,
    days_absent INT NOT NULL,
    total_days INT NOT NULL,
    proration_factor DECIMAL(5,4) NOT NULL,         -- days_present / total_days

    -- Annual Compensation (from grade structure)
    annual_gross_salary DECIMAL(15,2) NOT NULL,     -- Sum of salary + allowances
    annual_reimbursables DECIMAL(15,2) NOT NULL,    -- Sum of reimbursable components
    pensionable_amount DECIMAL(15,2) NOT NULL,      -- Sum of is_pensionable components

    -- Monthly Calculations (prorated)
    monthly_gross DECIMAL(15,2) NOT NULL,           -- (annual_gross / 12) * proration_factor
    monthly_reimbursables DECIMAL(15,2) NOT NULL,   -- (annual_reimbursables / 12) * proration_factor

    -- Tax Calculation
    taxable_income DECIMAL(15,2) NOT NULL,          -- (annual_gross * 0.95) - (pensionable * 0.08)
    paye_tax DECIMAL(15,2) NOT NULL,                -- Progressive tax

    -- Deductions
    pension_deduction DECIMAL(15,2) NOT NULL,       -- (pensionable * 0.08) * proration_factor
    leave_allowance_deduction DECIMAL(15,2) NOT NULL,
    thirteenth_month_deduction DECIMAL(15,2) NOT NULL,
    other_deductions DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) NOT NULL,

    -- Final Amounts
    net_pay DECIMAL(15,2) NOT NULL,                 -- monthly_gross - total_deductions
    credit_to_bank DECIMAL(15,2) NOT NULL,          -- net_pay + monthly_reimbursables

    -- Emoluments Snapshot (JSON for audit)
    emoluments_snapshot JSON NOT NULL,              -- Full breakdown of all components

    -- Calculation Metadata
    calculation_date TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (pay_grade_structure_id) REFERENCES pay_grade_structures(id) ON DELETE RESTRICT,
    FOREIGN KEY (attendance_id) REFERENCES staff_attendance(id) ON DELETE RESTRICT,

    UNIQUE KEY unique_payroll_staff (payroll_run_id, staff_id),
    INDEX idx_payroll_run (payroll_run_id),
    INDEX idx_staff (staff_id),
    INDEX idx_client (client_id)
);
```

**Key Features:**

- **Snapshot Pattern**: Stores staff name, bank details at calculation time (audit trail)
- **Denormalization**: Client_id stored for fast reporting queries
- **Emoluments Snapshot**: Full JSON breakdown for Excel export
- **All Calculation Steps**: Each formula result stored separately for debugging

---

## 🧮 CALCULATION FORMULAS

### Formula Execution Order

```php
// Step 1: Load Grade Structure
$grade = PayGradeStructure::find($staff->pay_grade_structure_id);
$emoluments = $grade->emoluments; // JSON: {"BASIC_SALARY": 600000, "HOUSING": 840000, ...}

// Step 2: Separate by Payroll Category
$salaryComponents = EmolumentComponent::whereIn('component_code', array_keys($emoluments))
    ->where('payroll_category', 'salary')
    ->get();

$allowanceComponents = EmolumentComponent::whereIn('component_code', array_keys($emoluments))
    ->where('payroll_category', 'allowance')
    ->get();

$reimbursableComponents = EmolumentComponent::whereIn('component_code', array_keys($emoluments))
    ->where('payroll_category', 'reimbursable')
    ->get();

$pensionableComponents = EmolumentComponent::whereIn('component_code', array_keys($emoluments))
    ->where('is_pensionable', true)
    ->get();

// Step 3: Calculate Annuals
$annualGross = 0;
foreach ($salaryComponents->merge($allowanceComponents) as $component) {
    $annualGross += $emoluments[$component->component_code];
}

$annualReimbursables = 0;
foreach ($reimbursableComponents as $component) {
    $annualReimbursables += $emoluments[$component->component_code];
}

$pensionableAmount = 0;
foreach ($pensionableComponents as $component) {
    $pensionableAmount += $emoluments[$component->component_code];
}

// Step 4: Get Attendance
$attendance = StaffAttendance::where('staff_id', $staff->id)
    ->where('month', $month)
    ->where('year', $year)
    ->first();

$prorationFactor = $attendance->days_present / $attendance->total_days;

// Step 5: Calculate Monthly Gross (Prorated)
$monthlyGross = ($annualGross / 12) * $prorationFactor;

// Step 6: Calculate Taxable Income
$taxableIncome = ($annualGross * 0.95) - ($pensionableAmount * 0.08);

// Step 7: Calculate PAYE (Progressive Tax)
$paye = $this->calculateProgressiveTax($taxableIncome);

// Step 8: Calculate Deductions (Prorated)
$pension = ($pensionableAmount * 0.08) * $prorationFactor;
$leaveDeduction = ($emoluments['LEAVE_ALLOWANCE'] / 12) * $prorationFactor;
$thirteenthDeduction = ($emoluments['THIRTEENTH_MONTH'] / 12) * $prorationFactor;
$totalDeductions = $paye + $pension + $leaveDeduction + $thirteenthDeduction;

// Step 9: Calculate Net Pay
$netPay = $monthlyGross - $totalDeductions;

// Step 10: Calculate Credit to Bank
$monthlyReimbursables = ($annualReimbursables / 12) * $prorationFactor;
$creditToBank = $netPay + $monthlyReimbursables;
```

### Progressive Tax Calculation

```php
public function calculateProgressiveTax(float $taxableIncome): float
{
    // Exemption Threshold
    if ($taxableIncome <= 840000) {
        return 0.00;
    }

    $taxBrackets = TaxBracket::where('is_active', true)
        ->where('effective_from', '<=', now())
        ->where(function($q) {
            $q->whereNull('effective_to')
              ->orWhere('effective_to', '>=', now());
        })
        ->orderBy('tier_number')
        ->get();

    $totalTax = 0;
    $remainingIncome = $taxableIncome;

    foreach ($taxBrackets as $bracket) {
        if ($remainingIncome <= 0) break;

        $bracketSize = $bracket->income_to
            ? ($bracket->income_to - $bracket->income_from)
            : $remainingIncome; // Last bracket (no upper limit)

        $taxableInBracket = min($remainingIncome, $bracketSize);
        $taxInBracket = $taxableInBracket * ($bracket->tax_rate / 100);

        $totalTax += $taxInBracket;
        $remainingIncome -= $taxableInBracket;
    }

    return round($totalTax, 2);
}
```

**Example:**

- Taxable Income: ₦2,500,000
- Bracket 1 (0 - 300k @ 0%): ₦0
- Bracket 2 (300k - 600k @ 15%): ₦45,000
- Bracket 3 (600k - 1.1M @ 18%): ₦90,000
- Bracket 4 (1.1M - 1.6M @ 21%): ₦105,000
- Bracket 5 (1.6M - 2.5M @ 23%): ₦207,000
- **Total PAYE: ₦447,000**

### Proration Logic

```php
public function calculateTotalDays(Client $client, int $month, int $year): int
{
    if ($client->pay_calculation_basis === 'calendar_days') {
        // Calendar days in month
        return Carbon::create($year, $month, 1)->daysInMonth;
    } else {
        // Working days (Mon-Fri only)
        $start = Carbon::create($year, $month, 1);
        $end = $start->copy()->endOfMonth();

        $workingDays = 0;
        while ($start->lte($end)) {
            if ($start->isWeekday()) { // Mon-Fri
                $workingDays++;
            }
            $start->addDay();
        }

        return $workingDays;
    }
}
```

**Example:**

- **Calendar Days (January 2025):** 31 days
- **Working Days (January 2025):** 23 days (31 total - 8 weekends)
- If staff worked 20 days:
  - Calendar proration: 20/31 = 0.6452 (64.52%)
  - Working proration: 20/23 = 0.8696 (86.96%)

---

## 📅 IMPLEMENTATION PLAN

### Phase 1: Database Modifications (Day 1)

**Task 1.1:** Update emolument_components table

- Create migration: `2025_11_21_000001_add_payroll_columns_to_emolument_components.php`
- Add columns: is_universal_template, is_pensionable, payroll_category
- Run migration: `php artisan migrate`
- **Validation:** Check existing 56 components preserved

**Task 1.2:** Clean pay_grade_structures table

- Create migration: `2025_11_21_000002_remove_redundant_columns_from_pay_grade_structures.php`
- Drop columns: basic_salary, transport_allowance, housing_allowance, meal_allowance
- Run migration: `php artisan migrate`
- **Validation:** Check emoluments JSON still intact

**Task 1.3:** Seed universal components

- Create seeder: `UniversalPayrollComponentsSeeder.php`
- Update 11 components with flags (is_universal_template=true, payroll_category, is_pensionable)
- Run seeder: `php artisan db:seed --class=UniversalPayrollComponentsSeeder`
- **Validation:** Query for is_universal_template=true should return 11 records

### Phase 2: New Tables Creation (Day 1-2)

**Task 2.1:** Create tax_brackets table

- Migration: `2025_11_21_000003_create_tax_brackets_table.php`
- Seeder: `TaxBracketsSeeder.php` (6 Nigerian tax tiers)
- **Validation:** SELECT \* FROM tax_brackets should show 6 active tiers

**Task 2.2:** Create payroll_calculation_formulas table

- Migration: `2025_11_21_000004_create_payroll_calculation_formulas_table.php`
- Seeder: `PayrollCalculationFormulasSeeder.php` (9 default formulas)
- **Validation:** Count should be 9, all with is_system_default=true

**Task 2.3:** Create attendance_uploads table

- Migration: `2025_11_21_000005_create_attendance_uploads_table.php`
- **Validation:** DESCRIBE attendance_uploads (check unique constraint)

**Task 2.4:** Create staff_attendance table

- Migration: `2025_11_21_000006_create_staff_attendance_table.php`
- **Validation:** Check foreign keys to attendance_uploads and staff

**Task 2.5:** Create payroll_runs table

- Migration: `2025_11_21_000007_create_payroll_runs_table.php`
- **Validation:** Check ENUM status values and unique constraint

**Task 2.6:** Create payroll_items table

- Migration: `2025_11_21_000008_create_payroll_items_table.php`
- **Validation:** Most complex table - verify all 30+ columns exist

### Phase 3: Backend Services (Day 2-3)

**Task 3.1:** Build PayrollCalculationEngine

- File: `backend/app/Services/PayrollCalculationEngine.php`
- Methods:
  - `calculateProgressiveTax(float $taxableIncome): float`
  - `calculateTotalDays(Client $client, int $month, int $year): int`
  - `separateEmolumentsByCategory(array $emoluments): array`
  - `calculateMonthlyPayroll(Staff $staff, StaffAttendance $attendance): array`
- **Validation:** Unit tests for each method

**Task 3.2:** Create AttendanceUploadController

- File: `backend/app/Http/Controllers/AttendanceUploadController.php`
- Methods:
  - `upload(Request $request)` - Upload CSV
  - `preview($uploadId)` - Show fuzzy match results
  - `confirm($uploadId)` - Process and save to staff_attendance
  - `index()` - List all uploads
- Routes: `POST /api/payroll/attendance/upload`, `GET /api/payroll/attendance/{id}/preview`
- **Validation:** Upload test CSV, check fuzzy matching works

**Task 3.3:** Create PayrollRunController

- File: `backend/app/Http/Controllers/PayrollRunController.php`
- Methods:
  - `calculate(Request $request)` - Calculate for all staff
  - `preview($runId)` - Show calculation results
  - `approve($runId)` - Approve payroll
  - `export($runId)` - Generate Excel file
  - `index()` - List all runs
- Routes: `POST /api/payroll/runs/calculate`, `POST /api/payroll/runs/{id}/approve`
- **Validation:** Calculate test payroll, verify amounts

### Phase 4: Frontend Development (Day 3-4)

**Task 4.1:** Create Payroll Processing submodule

- Folder: `frontend/src/components/admin/modules/hr-payroll-management/submodules/payroll-processing/`
- Files:
  - `PayrollProcessing.jsx` (main component)
  - `tabs/AttendanceUploadTab.jsx`
  - `tabs/PayrollRunTab.jsx`
  - `tabs/CalculationBasisTab.jsx`
  - `modals/PreviewUploadModal.jsx`
  - `modals/PayrollCalculationModal.jsx`

**Task 4.2:** Attendance Upload Tab

- Features:
  - Client selector
  - Month/Year picker
  - CSV upload (drag & drop)
  - Preview with fuzzy match confidence
  - Manual name mapping
  - Confirm button
- **Validation:** Upload sample CSV, verify all features work

**Task 4.3:** Payroll Run Tab

- Features:
  - Client selector
  - Month/Year picker (auto-load attendance if exists)
  - Calculate button → Show loading
  - Preview table (all staff calculations)
  - Approve button
  - Export to Excel button
- **Validation:** Run complete workflow end-to-end

**Task 4.4:** Update navigation

- File: `frontend/src/components/admin/AdminDashboard.jsx`
- Add "Payroll Processing" to HR & Payroll Management module menu

### Phase 5: Enhancement to Existing Systems (Day 4-5)

**Task 5.1:** Enhance PayGradeStructure model

- File: `backend/app/Models/PayGradeStructure.php`
- Add methods:
  - `calculateAnnualGross(): float`
  - `calculateAnnualReimbursables(): float`
  - `getPensionableAmount(): float`
  - `getEmolumentsByCategory(string $category): array`
- **Validation:** Call methods on existing grade, verify calculations

**Task 5.2:** Update PayGradeForm to load universal template

- File: `frontend/src/components/admin/modules/client-contract-management/submodules/salary-structure/PayGradeForm.jsx`
- On create new grade:
  - Auto-load 11 universal components
  - Pre-populate emoluments with component codes
  - User enters amounts only
- **Validation:** Create new grade, verify all 11 components appear

**Task 5.3:** Create bulk upload feature

- File: `backend/app/Http/Controllers/BulkGradeUploadController.php`
- Method: `downloadTemplate($jobStructureId)` - Generate Excel
- Method: `processUpload(Request $request)` - Parse and save
- Frontend: Add "Bulk Upload" button in PayDetailsMaster
- **Validation:** Upload Excel with 5 grades, verify all saved

### Phase 6: Testing & Validation (Day 5-6)

**Task 6.1:** Unit Tests

- Test progressive tax calculation with known values
- Test proration (calendar vs working days)
- Test fuzzy name matching (Levenshtein distance)
- Test formula parsing and execution

**Task 6.2:** Integration Tests

- Upload attendance → Calculate payroll → Approve → Export
- Verify Excel export matches manual calculation
- Test with multiple clients
- Test with different pay_calculation_basis settings

**Task 6.3:** Data Accuracy Validation

- Compare system output with Excel template calculations
- Verify all 9 formulas produce correct results
- Check edge cases:
  - Staff with 0 attendance
  - Partial month (mid-month hire)
  - Tax bracket boundaries
  - Maximum taxable income

---

## 🔄 DATA FLOW DIAGRAMS

### Complete Payroll Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYROLL WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────┘

1. GRADE SETUP (Contract Management)
   ├── Create Job Structure for Client
   ├── Create Pay Grades under Job Structure
   ├── Load 11 Universal Components (auto)
   ├── Add Custom Components (optional)
   └── Enter Emolument Amounts → Save to pay_grade_structures.emoluments (JSON)

2. ATTENDANCE UPLOAD (Payroll Processing → Attendance Upload Tab)
   ├── Select Client + Month/Year
   ├── Upload CSV (Staff Name, Days Present, Days Absent)
   ├── System Fuzzy Matches Names to staff table
   ├── Preview Unmatched → Manual Mapping
   ├── Confirm → Save to staff_attendance
   └── Record in attendance_uploads (status: completed)

3. PAYROLL CALCULATION (Payroll Processing → Payroll Run Tab)
   ├── Select Client + Month/Year
   ├── Load attendance_upload for period
   ├── For Each Active Staff:
   │   ├── Load pay_grade_structure → Get emoluments JSON
   │   ├── Load staff_attendance → Get proration factor
   │   ├── Separate emoluments by category (salary, allowance, reimbursable)
   │   ├── Calculate annual_gross, annual_reimbursables, pensionable_amount
   │   ├── Calculate monthly_gross (prorated)
   │   ├── Calculate taxable_income
   │   ├── Calculate PAYE (progressive tax)
   │   ├── Calculate pension (8% of pensionable, prorated)
   │   ├── Calculate deductions (leave, 13th month)
   │   ├── Calculate net_pay
   │   ├── Calculate credit_to_bank
   │   └── Save to payroll_items
   ├── Aggregate totals → Save to payroll_runs
   └── Status: 'calculated' (awaiting approval)

4. APPROVAL & EXPORT
   ├── HR Reviews Payroll Preview
   ├── Approve → Update payroll_runs.status = 'approved'
   ├── Export to Excel:
   │   ├── Sheet 1: Credit to Bank (Staff Name, Account, Amount)
   │   ├── Sheet 2: Full Breakdown (All components + deductions)
   │   └── Sheet 3: Summary (Total Gross, Deductions, Net, Reimbursables)
   └── Save export path → Update payroll_runs.status = 'exported'
```

### Database Relationships

```
clients (1) ──────────┬─────────→ (N) job_structures
                      │
                      ├─────────→ (N) pay_grade_structures
                      │              │
                      │              └─→ emoluments (JSON) links to emolument_components
                      │
                      ├─────────→ (N) staff
                      │              │
                      │              └─→ pay_grade_structure_id (FK)
                      │
                      ├─────────→ (N) attendance_uploads
                      │              │
                      │              └─────────→ (N) staff_attendance
                      │                             │
                      │                             └─→ staff_id (FK)
                      │
                      └─────────→ (N) payroll_runs
                                     │
                                     ├─→ attendance_upload_id (FK)
                                     │
                                     └─────────→ (N) payroll_items
                                                    │
                                                    ├─→ staff_id (FK)
                                                    ├─→ pay_grade_structure_id (FK)
                                                    └─→ attendance_id (FK)

emolument_components (Master Data)
   ├─→ is_universal_template (11 components)
   ├─→ is_pensionable (Basic, Housing, Transport)
   └─→ payroll_category (salary, allowance, reimbursable, deduction, statutory)

tax_brackets (Master Data)
   └─→ tier_number, income_from, income_to, tax_rate

payroll_calculation_formulas (Master Data + Overrides)
   ├─→ client_id IS NULL → System default
   ├─→ client_id NOT NULL → Client override
   └─→ job_structure_id NOT NULL → Job-specific override
```

---

## 🧪 TESTING STRATEGY

### Test Data Requirements

**Create Test Client:**

```sql
INSERT INTO clients (organisation_name, pay_calculation_basis, status)
VALUES ('Test Corp Ltd', 'working_days', 'active');
```

**Create Test Job Structure:**

```sql
INSERT INTO job_structures (client_id, job_code, job_title, contract_type, contract_nature)
VALUES (1, 'MGR', 'Manager', 'employment', 'permanent');
```

**Create Test Pay Grade:**

```json
{
  "grade_code": "MGR-L3",
  "grade_name": "Manager Level 3",
  "job_structure_id": 1,
  "emoluments": {
    "BASIC_SALARY": 600000,
    "HOUSING": 840000,
    "TRANSPORT": 360000,
    "OTHER_ALLOWANCES": 200000,
    "LEAVE_ALLOWANCE": 120000,
    "THIRTEENTH_MONTH": 100000,
    "OTJ_TELEPHONE": 60000,
    "OTJ_TRANSPORT": 80000,
    "UNIFORM": 40000,
    "CLIENT_OP_FUND": 100000
  }
}
```

**Test Calculation (January 2025, Working Days):**

- Total Working Days: 23
- Staff Worked: 20 days
- Proration Factor: 20/23 = 0.8696

**Expected Results:**

```
Annual Gross = 600k + 840k + 360k + 200k = 2,000,000
Annual Reimbursables = 60k + 80k + 40k + 100k = 280,000
Pensionable Amount = 600k + 840k + 360k = 1,800,000

Monthly Gross = (2,000,000 / 12) * 0.8696 = 144,933.33
Taxable Income = (2,000,000 * 0.95) - (1,800,000 * 0.08) = 1,756,000
PAYE = (calculate using brackets) = ~₦223,000
Pension = (1,800,000 * 0.08 / 12) * 0.8696 = 10,435.20
Net Pay = 144,933.33 - 223,000 - 10,435.20 = ~₦-88,501.87 (NEGATIVE - needs annual proration!)
```

**IMPORTANT:** This reveals we need to pro-rate PAYE monthly too!

### Revised Formula:

```php
// PAYE should be monthly, not annual
$monthlyTaxableIncome = ($monthlyGross * 12 * 0.95) - ($pensionableAmount * 0.08);
$annualPAYE = $this->calculateProgressiveTax($monthlyTaxableIncome);
$monthlyPAYE = $annualPAYE / 12;
```

### Test Cases

| Test Case | Input                                             | Expected Output          | Status     |
| --------- | ------------------------------------------------- | ------------------------ | ---------- |
| TC-001    | Full month attendance (23/23 days)                | 100% proration           | ⏳ Pending |
| TC-002    | Partial month (15/23 days)                        | 65.22% proration         | ⏳ Pending |
| TC-003    | Zero attendance (0/23 days)                       | Net Pay = 0              | ⏳ Pending |
| TC-004    | Taxable income < ₦840k                            | PAYE = 0                 | ⏳ Pending |
| TC-005    | Taxable income = ₦2.5M                            | PAYE = ₦447k             | ⏳ Pending |
| TC-006    | Calendar days (31 days) vs Working days (23 days) | Different proration      | ⏳ Pending |
| TC-007    | Staff with no grade assigned                      | Error: Missing pay grade | ⏳ Pending |
| TC-008    | Upload duplicate attendance                       | Error: Already exists    | ⏳ Pending |
| TC-009    | Fuzzy match confidence < 80%                      | Flag for manual review   | ⏳ Pending |
| TC-010    | Export to Excel                                   | All columns present      | ⏳ Pending |

---

## 📝 MIGRATION EXECUTION ORDER

**CRITICAL: Run in this exact order to avoid foreign key errors**

```bash
# Phase 1: Modify Existing Tables
php artisan migrate --path=/database/migrations/2025_11_21_000001_add_payroll_columns_to_emolument_components.php
php artisan migrate --path=/database/migrations/2025_11_21_000002_remove_redundant_columns_from_pay_grade_structures.php

# Phase 2: Seed Modified Tables
php artisan db:seed --class=UniversalPayrollComponentsSeeder

# Phase 3: Create New Tables (Order matters!)
php artisan migrate --path=/database/migrations/2025_11_21_000003_create_tax_brackets_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000004_create_payroll_calculation_formulas_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000005_create_attendance_uploads_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000006_create_staff_attendance_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000007_create_payroll_runs_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000008_create_payroll_items_table.php

# Phase 4: Seed New Tables
php artisan db:seed --class=TaxBracketsSeeder
php artisan db:seed --class=PayrollCalculationFormulasSeeder
```

---

## ⚠️ CRITICAL NOTES & WARNINGS

### Data Integrity

1. **NEVER delete emolument_components** - Pay grades reference them by component_code
2. **Backup database** before running pay_grade_structures cleanup migration
3. **Validate emoluments JSON** after column removal - ensure no data corruption
4. **Unique constraints** prevent duplicate payroll runs for same client/month/year

### Performance Considerations

1. **Payroll calculation** for 1000 staff takes ~30 seconds - show progress bar
2. **Index staff_attendance** on (staff_id, month, year) for fast lookups
3. **Cache tax brackets** - they rarely change
4. **Denormalize client_id** in payroll_items for faster reporting queries

### Security

1. **Only approved users** can approve payroll_runs (check role)
2. **Audit trail** - store created_by, approved_by for all critical actions
3. **Prevent modification** of approved payroll (status check in controller)
4. **File upload validation** - Only CSV, max 5MB, virus scan recommended

### Edge Cases

1. **Mid-month hire** - Pro-rate from hire date, not full month
2. **Staff termination** - Calculate final pay including accrued leave
3. **Negative net pay** - Flag for HR review (over-deductions)
4. **Missing attendance** - Cannot calculate payroll (block with error)
5. **Grade change mid-month** - Use grade at calculation date (snapshot)

---

## 📞 SUPPORT & MAINTENANCE

### Future Enhancements

- [ ] Multiple payroll cycles per month (weekly, bi-weekly)
- [ ] Loan deductions integration
- [ ] Overtime pay calculations
- [ ] Pro-rata for mid-month hires/exits
- [ ] Historical payroll reports (YTD, QTD)
- [ ] Tax certificate generation
- [ ] Pension remittance reports
- [ ] Email payslips to staff

### Known Limitations

- Single currency (NGN) - no multi-currency support yet
- No statutory returns (PAYE, Pension, NHF) automation
- Manual attendance upload only - no biometric integration
- Excel export only - no PDF payslips yet

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] All 8 migrations created and tested
- [ ] All 2 seeders created and run successfully
- [ ] PayrollCalculationEngine unit tests pass (100% coverage)
- [ ] AttendanceUploadController integration tests pass
- [ ] PayrollRunController integration tests pass
- [ ] Frontend components render without errors
- [ ] Sample payroll run calculated correctly (manual verification)
- [ ] Excel export matches template format
- [ ] Database indexes optimized
- [ ] Error handling tested (missing data, validation failures)
- [ ] User roles and permissions configured
- [ ] Documentation updated (API docs, user manual)

---

**END OF DOCUMENTATION**

_This document should be updated as implementation progresses. All changes to formulas, schemas, or workflows must be reflected here to maintain accuracy._
