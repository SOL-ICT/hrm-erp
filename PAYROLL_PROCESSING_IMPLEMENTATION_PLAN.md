# PAYROLL PROCESSING IMPLEMENTATION PLAN

## 📊 DATABASE SCHEMA ANALYSIS

### EXISTING TABLES (Verified)

#### 1. `emolument_components`

```sql
- id (PK)
- component_code (varchar 40) - e.g., "SALARY", "HOUSING"
- component_name (varchar 255)
- category (enum: basic, allowance, deduction, benefit)
- status (enum: benefit, regular)
- type (enum: fixed_allowance, variable_allowance)
- class (enum: cash_item, non_cash_item)
- is_taxable (boolean)
- calculation_method (enum: fixed, percentage, formula)
- display_order (int)
- is_active (boolean)
- created_at, updated_at
```

**Current State:** 20+ components exist (mixed system)

#### 2. `pay_grade_structures`

```sql
- id (PK)
- job_structure_id (FK)
- grade_name, grade_code
- emoluments (JSON) - {"SALARY": 50000, "TRANSPORT": 70000}
- total_compensation (decimal 12,2)
- basic_salary, transport_allowance, housing_allowance, meal_allowance (legacy columns)
- is_active, created_at, updated_at
```

**Current State:** Uses JSON to store component_code → amount mappings

#### 3. `clients`

```sql
- ...existing fields...
- pay_calculation_basis (enum: 'working_days', 'calendar_days') - DEFAULT: working_days
```

**Current State:** ✅ Already has calculation basis field!

#### 4. `staff`

```sql
- ...existing fields...
- pfa_code (varchar 255) - Pension Fund Administrator code
- pay_grade_structure_id (FK to pay_grade_structures)
```

**Current State:** ✅ Staff linked to grades, has PFA field

---

## 🆕 NEW TABLES TO CREATE

### 1. `universal_payroll_template`

**Purpose:** Store the 11 standard components that apply to all clients

```sql
CREATE TABLE universal_payroll_template (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    component_code VARCHAR(40) NOT NULL UNIQUE,
    component_name VARCHAR(255) NOT NULL,
    category ENUM('salary', 'allowance', 'reimbursable', 'other') NOT NULL,
    is_taxable TINYINT(1) NOT NULL DEFAULT 1,
    is_pensionable TINYINT(1) NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Insert the 11 standard components
INSERT INTO universal_payroll_template (component_code, component_name, category, is_taxable, is_pensionable, display_order) VALUES
('BASIC_SALARY', 'Basic Salary', 'salary', 1, 1, 1),
('HOUSING_ALLOWANCE', 'Housing Allowance', 'allowance', 1, 1, 2),
('TRANSPORT_ALLOWANCE', 'Transport Allowance', 'allowance', 1, 1, 3),
('OTHER_ALLOWANCES', 'Other Allowances', 'allowance', 1, 0, 4),
('THIRTEENTH_MONTH', '13th Month', 'allowance', 1, 0, 5),
('LEAVE_ALLOWANCE', 'Leave Allowance', 'allowance', 1, 0, 6),
('OTJ_TELEPHONE', 'On-The-Job-Telephone', 'reimbursable', 0, 0, 7),
('OTJ_TRANSPORT', 'On-The-Job-Transport', 'reimbursable', 0, 0, 8),
('UNIFORM', 'Uniform', 'reimbursable', 0, 0, 9),
('CLIENT_OPERATIONAL_FUND', 'Client Operational Fund', 'other', 0, 0, 10);
```

### 2. `payroll_calculation_formulas`

**Purpose:** Store calculation basis formulas (default + client/job_structure overrides)

```sql
CREATE TABLE payroll_calculation_formulas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NULL,
    job_structure_id BIGINT UNSIGNED NULL,
    formula_type ENUM('taxable_income', 'gross_monthly', 'paye', 'pension', 'leave_allowance_deduction', 'thirteenth_month_deduction', 'net_pay', 'monthly_reimbursable', 'credit_to_bank') NOT NULL,
    formula_expression TEXT NOT NULL,
    description TEXT,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_by BIGINT UNSIGNED NULL,
    updated_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (job_structure_id) REFERENCES job_structures(id) ON DELETE CASCADE,

    -- Either default OR specific to client/job_structure
    CONSTRAINT chk_formula_scope CHECK (
        (is_default = 1 AND client_id IS NULL AND job_structure_id IS NULL) OR
        (is_default = 0 AND (client_id IS NOT NULL OR job_structure_id IS NOT NULL))
    )
);

-- Insert default formulas from Payroll tab
INSERT INTO payroll_calculation_formulas (formula_type, formula_expression, is_default) VALUES
('taxable_income', '(ANNUAL_GROSS * 0.95) - ((BASIC_SALARY + HOUSING_ALLOWANCE + TRANSPORT_ALLOWANCE) * 0.08)', 1),
('gross_monthly', '(ANNUAL_GROSS / 12) * (ATTENDANCE_DAYS / TOTAL_DAYS)', 1),
('paye', 'PROGRESSIVE_TAX(TAXABLE_INCOME, ANNUAL_GROSS)', 1),
('pension', '(BASIC_SALARY + HOUSING_ALLOWANCE + TRANSPORT_ALLOWANCE) * 0.08 * (ATTENDANCE_DAYS / TOTAL_DAYS)', 1),
('leave_allowance_deduction', '(LEAVE_ALLOWANCE / 12) * (ATTENDANCE_DAYS / TOTAL_DAYS)', 1),
('thirteenth_month_deduction', '(THIRTEENTH_MONTH / 12) * (ATTENDANCE_DAYS / TOTAL_DAYS)', 1),
('net_pay', 'GROSS_MONTHLY - (PAYE + PENSION + LEAVE_ALLOWANCE_DEDUCTION + THIRTEENTH_MONTH_DEDUCTION)', 1),
('monthly_reimbursable', 'ANNUAL_REIMBURSABLES / 12', 1),
('credit_to_bank', 'NET_PAY + MONTHLY_REIMBURSABLE', 1);
```

### 3. `tax_brackets`

**Purpose:** Store Nigerian tax brackets (updatable)

```sql
CREATE TABLE tax_brackets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    min_income DECIMAL(15,2) NOT NULL,
    max_income DECIMAL(15,2) NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    fixed_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    bracket_order INT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- Insert current Nigerian tax brackets (2025)
INSERT INTO tax_brackets (min_income, max_income, tax_rate, fixed_amount, bracket_order, effective_from) VALUES
(0, 800000, 0, 0, 1, '2025-01-01'),
(800001, 3000000, 15, 0, 2, '2025-01-01'),
(3000001, 12000000, 18, 330000, 3, '2025-01-01'),
(12000001, 25000000, 21, 1950000, 4, '2025-01-01'),
(25000001, 50000000, 23, 4680000, 5, '2025-01-01'),
(50000001, NULL, 25, 10430000, 6, '2025-01-01');
```

### 4. `attendance_uploads`

**Purpose:** Track uploaded attendance data

```sql
CREATE TABLE attendance_uploads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_staff INT NOT NULL DEFAULT 0,
    matched_staff INT NOT NULL DEFAULT 0,
    unmatched_staff INT NOT NULL DEFAULT 0,
    upload_status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    uploaded_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),

    UNIQUE KEY unique_client_month (client_id, month, year)
);
```

### 5. `staff_attendance`

**Purpose:** Store individual staff attendance records

```sql
CREATE TABLE staff_attendance (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attendance_upload_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    client_id BIGINT UNSIGNED NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    attendance_days INT NOT NULL,
    total_days INT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,

    UNIQUE KEY unique_staff_month (staff_id, month, year)
);
```

### 6. `payroll_runs`

**Purpose:** Track each monthly payroll execution

```sql
CREATE TABLE payroll_runs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    attendance_upload_id BIGINT UNSIGNED NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_staff INT NOT NULL DEFAULT 0,
    total_gross DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_net_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_reimbursables DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit_to_bank DECIMAL(15,2) NOT NULL DEFAULT 0,
    run_status ENUM('draft', 'processing', 'completed', 'approved', 'paid') NOT NULL DEFAULT 'draft',
    processed_by BIGINT UNSIGNED NOT NULL,
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),

    UNIQUE KEY unique_client_payroll (client_id, month, year)
);
```

### 7. `payroll_items`

**Purpose:** Individual staff payroll records for each run

```sql
CREATE TABLE payroll_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    payroll_run_id BIGINT UNSIGNED NOT NULL,
    staff_id BIGINT UNSIGNED NOT NULL,
    staff_attendance_id BIGINT UNSIGNED NULL,
    pay_grade_structure_id BIGINT UNSIGNED NOT NULL,

    -- Staff snapshot
    staff_code VARCHAR(20) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    grade_name VARCHAR(100) NOT NULL,
    pfa_code VARCHAR(255) NULL,

    -- Attendance
    attendance_days INT NOT NULL,
    total_days INT NOT NULL,

    -- Annual amounts (from grade template)
    annual_gross DECIMAL(15,2) NOT NULL DEFAULT 0,
    annual_reimbursables DECIMAL(15,2) NOT NULL DEFAULT 0,
    emoluments_breakdown JSON NOT NULL, -- {"BASIC_SALARY": 600000, "HOUSING": 300000, ...}

    -- Monthly calculations
    gross_monthly_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    taxable_income DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Deductions
    paye DECIMAL(15,2) NOT NULL DEFAULT 0,
    pension DECIMAL(15,2) NOT NULL DEFAULT 0,
    leave_allowance_deduction DECIMAL(15,2) NOT NULL DEFAULT 0,
    thirteenth_month_deduction DECIMAL(15,2) NOT NULL DEFAULT 0,
    other_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Final amounts
    net_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
    monthly_reimbursable DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit_to_bank DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Meta
    calculation_details JSON NULL, -- Store intermediate calculation steps for audit
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_attendance_id) REFERENCES staff_attendance(id) ON DELETE SET NULL,
    FOREIGN KEY (pay_grade_structure_id) REFERENCES pay_grade_structures(id),

    UNIQUE KEY unique_payroll_staff (payroll_run_id, staff_id)
);
```

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### PHASE 1: Universal Template Management (Contract Management Module)

#### Backend Changes

**1. Update Grading System Tab Functionality**

**New Controller:** `GradeEmolumentController.php`

```php
Methods:
- loadUniversalTemplate(grade_id) // Load 11 standard components + custom components
- updateGradeEmoluments(grade_id, emoluments) // Save amounts to pay_grade_structures.emoluments JSON
- downloadBulkTemplate(job_structure_id) // Excel: Rows=Grades, Cols=All Components
- uploadBulkEmoluments(file, job_structure_id) // Process bulk upload
```

**2. Emolument Components Management**

**New Routes:**

```php
GET  /api/contract-management/universal-template // Get 11 standard components
POST /api/contract-management/emolument-components // Add custom component
GET  /api/contract-management/grades/{id}/emoluments // Get grade's emoluments with template
PUT  /api/contract-management/grades/{id}/emoluments // Update amounts
GET  /api/contract-management/job-structures/{id}/bulk-template // Download Excel
POST /api/contract-management/job-structures/{id}/bulk-upload // Upload Excel
```

#### Frontend Changes

**1. Update "PAY GRADE DETAILS - EDIT" Modal**

- When opened, automatically load universal template (11 components) + any custom components
- Display as editable table: Component Name | Amount
- Save to `pay_grade_structures.emoluments` JSON

**2. New "Manage Emolument Components" Modal**

- Add/edit/delete custom components beyond the 11 standard
- Sync with existing `emolument_components` table

**3. Bulk Upload Feature**

- Button in Grading System tab
- Downloads Excel:
  - Row 1: Headers (Grade Code | Grade Name | BASIC_SALARY | HOUSING | ... | CustomComponent1 | ...)
  - Rows 2+: Grade data with amounts
- Upload validates and saves to all grades

---

### PHASE 2: Payroll Processing Submodule

#### Backend Components

**1. PayrollCalculationEngine Service**

```php
class PayrollCalculationEngine
{
    public function calculateTaxableIncome($annualGross, $basic, $housing, $transport)
    public function calculateProgressiveTax($taxableIncome, $annualGross)
    public function calculateGrossMonthly($annualGross, $attendanceDays, $totalDays)
    public function calculatePension($basic, $housing, $transport, $attendanceDays, $totalDays)
    public function calculateNetPay($grossMonthly, $paye, $pension, $leaveDeduction, $thirteenthDeduction)
    public function calculateCreditToBank($netPay, $monthlyReimbursable)
    public function processStaffPayroll($staff, $attendanceDays, $month, $year)
}
```

**2. Controllers**

**AttendanceUploadController.php**

```php
- downloadTemplate(client_id) // Excel: Staff ID, Name, Grade, Attendance Days
- uploadAttendance(file, client_id, month, year) // Process + fuzzy match
- resolveUnmatched(attendance_upload_id, mappings) // Manual matching
```

**PayrollRunController.php**

```php
- index(client_id, month, year) // List payroll runs
- create(client_id, month, year) // Create from attendance
- calculate(payroll_run_id) // Run calculation engine for all staff
- show(payroll_run_id) // View payroll details
- approve(payroll_run_id) // Approve payroll
- downloadPayroll(payroll_run_id) // Excel export
```

**CalculationBasisController.php**

```php
- getDefault() // Load default formulas
- getClientFormulas(client_id, job_structure_id) // Get custom if exists
- updateFormulas(client_id, job_structure_id, formulas) // Save custom
```

#### Frontend Components

**New Tab: "Payroll Processing"** (Under HR & Payroll Management)

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Payroll Processing                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Client Selector ▼]  [Month ▼]  [Year ▼]             │
│  [Update Calculation Basis]                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ATTENDANCE UPLOAD                                 │ │
│  │  📥 Download Template  📤 Upload File             │ │
│  │  Status: ✅ 150 matched, ⚠️ 5 unmatched          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  PAYROLL RUN                                       │ │
│  │  [▶️ Calculate Payroll]  [✅ Approve]  [📥 Export]│ │
│  │                                                    │ │
│  │  Total Staff: 155                                  │ │
│  │  Total Gross: ₦45,890,000.00                      │ │
│  │  Total Deductions: ₦8,234,500.00                  │ │
│  │  Total Net Pay: ₦37,655,500.00                    │ │
│  │  Total Credit to Bank: ₦39,120,000.00             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📊 PAYROLL DETAILS TABLE                              │
│  [Staff Code | Name | Grade | Attendance | Gross |    │
│   Deductions | Net Pay | Credit | View Details]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Modals:**

1. **Unmatched Staff Modal** - Match attendance records to staff
2. **View Payroll Details Modal** - Show complete breakdown for one staff
3. **Update Calculation Basis Modal** - Edit formulas with math editor

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Database Migrations (7 migrations)

1. `create_universal_payroll_template_table`
2. `create_payroll_calculation_formulas_table`
3. `create_tax_brackets_table`
4. `create_attendance_uploads_table`
5. `create_staff_attendance_table`
6. `create_payroll_runs_table`
7. `create_payroll_items_table`

### Step 2: Seed Default Data

- Universal template (11 components)
- Default formulas
- Tax brackets

### Step 3: Backend Implementation

1. Models (7 new models)
2. PayrollCalculationEngine service
3. Controllers (3 new controllers)
4. Routes
5. Validation rules
6. Excel export/import services

### Step 4: Frontend Implementation

1. Payroll Processing submodule page
2. Attendance upload components
3. Payroll run management
4. Calculation basis editor modal
5. Excel template download/upload

### Step 5: Testing

1. Grade template setup
2. Attendance upload with fuzzy matching
3. Payroll calculation accuracy
4. Tax calculation verification
5. Export format validation

---

## ⚠️ CRITICAL CONSIDERATIONS

### 1. Tax Calculation Accuracy

- Progressive tax must calculate correctly across brackets
- Handle edge cases (exactly on boundary)
- Verify annual gross threshold of ₦840,000

### 2. Proration Logic

**Calendar Days:**

```php
$totalDays = cal_days_in_month(CAL_GREGORIAN, $month, $year); // 28-31
$prorationFactor = $attendanceDays / $totalDays;
```

**Working Days:**

```php
$totalDays = countWeekdays($month, $year); // Mon-Fri only
$prorationFactor = $attendanceDays / $totalDays;
```

### 3. Data Integrity

- Ensure grade templates exist before running payroll
- Validate attendance days ≤ total days
- Lock payroll after approval (no edits)

### 4. Performance

- Process 1000+ staff efficiently
- Use transactions for bulk operations
- Queue long-running calculations

---

## 🎯 NEXT ACTIONS

1. ✅ **Review this plan with you**
2. **Create database migrations**
3. **Seed universal template data**
4. **Build calculation engine**
5. **Implement backend APIs**
6. **Build frontend UI**
7. **Test with real data**

**Ready to proceed with implementation?**
