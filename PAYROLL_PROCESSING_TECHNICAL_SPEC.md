# PAYROLL PROCESSING MODULE - COMPLETE TECHNICAL SPECIFICATION

**Version:** 1.0  
**Date:** November 21, 2025  
**Status:** Pre-Implementation Documentation

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow & Workflows](#data-flow--workflows)
6. [API Endpoints](#api-endpoints)
7. [UI/UX Specifications](#uiux-specifications)
8. [Validation Rules](#validation-rules)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)

---

## 1. SYSTEM OVERVIEW

### 1.1 Module Location

**Frontend Navigation Path:**

```
Dashboard → HR & Payroll Mgt. → Payroll Processing
```

**Module Structure:**

- **Tab 1:** Payroll Runs (Main payroll execution workflow)
- **Tab 2:** Attendance for Payroll (Upload/select attendance data)
- **Tab 3:** Payroll Settings (Tax brackets, formulas, components - **EDITABLE + Reference**)

### 1.2 Core Components

#### A. Universal Emolument Components (11 - System-Wide)

```
PENSIONABLE (3):
  - BASIC_SALARY     → Salary category, pensionable
  - HOUSING          → Allowance category, pensionable
  - TRANSPORT        → Allowance category, pensionable

REGULAR ALLOWANCES (2):
  - OTHER_ALLOWANCES → Allowance category, non-pensionable
  - MEAL_ALLOWANCE   → Allowance category, non-pensionable

DEDUCTIONS (2):
  - LEAVE_ALLOWANCE     → Deducted monthly (1/12), paid as lump sum
  - THIRTEENTH_MONTH    → Deducted monthly (1/12), paid as lump sum

REIMBURSABLES (4):
  - OTJ_TELEPHONE    → Paid separately monthly
  - OTJ_TRANSPORT    → Paid separately monthly
  - UNIFORM          → Paid separately monthly
  - CLIENT_OP_FUND   → Paid separately monthly
```

#### B. Custom Emolument Components (Client-Specific)

- Created by users in "Manage Emolument Components" modal
- **Scope:** CLIENT-SPECIFIC (only available for that client's pay grades)
- **Storage:** Same `emolument_components` table with `client_id` foreign key
- **Flags:**
  - `is_universal_template = false`
  - `client_id = <specific_client_id>`
  - Can be pensionable/reimbursable/deduction based on user selection

### 1.3 Nigerian Progressive Tax System (6 Tiers)

```
Tier 1: ₦0 - ₦300,000         @ 0%   (Exempt)
Tier 2: ₦300,000 - ₦600,000   @ 15%
Tier 3: ₦600,000 - ₦1,100,000 @ 18%
Tier 4: ₦1,100,000 - ₦1,600,000 @ 21%
Tier 5: ₦1,600,000 - ₦3,200,000 @ 23%
Tier 6: Above ₦3,200,000       @ 25%

Exemption Threshold: ₦840,000/year
```

### 1.4 Calculation Formula (12-Step Sequence)

```
1.  ANNUAL_GROSS           = Sum(BASIC_SALARY + HOUSING + TRANSPORT + OTHER_ALLOWANCES + MEAL_ALLOWANCE)
2.  ANNUAL_REIMBURSABLES   = Sum(OTJ_TELEPHONE + OTJ_TRANSPORT + UNIFORM + CLIENT_OP_FUND)
3.  PENSIONABLE_AMOUNT     = Sum(components where is_pensionable = true)
4.  MONTHLY_GROSS          = (ANNUAL_GROSS / 12) × proration_factor
5.  MONTHLY_REIMBURSABLES  = (ANNUAL_REIMBURSABLES / 12) × proration_factor
6.  TAXABLE_INCOME         = (ANNUAL_GROSS × 0.95) - (PENSIONABLE_AMOUNT × 0.08)
7.  PAYE                   = Progressive tax calculation (annual) / 12 × proration_factor
8.  PENSION                = (PENSIONABLE_AMOUNT / 12) × 0.08 × proration_factor
9.  LEAVE_DEDUCTION        = (LEAVE_ALLOWANCE / 12) × proration_factor
10. 13TH_DEDUCTION         = (THIRTEENTH_MONTH / 12) × proration_factor
11. NET_PAY                = MONTHLY_GROSS - (PAYE + PENSION + LEAVE_DEDUCTION + 13TH_DEDUCTION + other_deductions)
12. CREDIT_TO_BANK         = NET_PAY + MONTHLY_REIMBURSABLES
```

---

## 2. DATABASE SCHEMA

### 2.1 Existing Tables (Used by Payroll)

#### `emolument_components` (ENHANCED)

```sql
Columns:
  - id (PK, auto-increment)
  - component_code VARCHAR(40) UNIQUE
  - component_name VARCHAR(255)
  - description TEXT
  - category ENUM('basic','allowance','deduction','benefit')
  - status ENUM('benefit','regular')
  - type ENUM('fixed_allowance','variable_allowance')
  - class ENUM('cash_item','non_cash_item')
  - client_account VARCHAR(100)
  - ledger_account_code VARCHAR(20)
  - ledger_account_name VARCHAR(255)
  - is_taxable BOOLEAN
  - calculation_method ENUM('fixed','percentage','formula')
  - display_order INT
  - is_active BOOLEAN DEFAULT 1

  -- Payroll-specific columns (added in migration 1):
  - is_universal_template BOOLEAN DEFAULT 0 (indexed)
  - is_pensionable BOOLEAN DEFAULT 0 (indexed)
  - payroll_category ENUM('salary','allowance','reimbursable','deduction','statutory') NULL (indexed)

  -- Client-specific support:
  - client_id BIGINT UNSIGNED NULL (FK to clients.id) -- NULL = universal, NOT NULL = client-specific

  - created_by, updated_by, created_at, updated_at

Indexes:
  - idx_universal_template (is_universal_template)
  - idx_pensionable (is_pensionable)
  - idx_payroll_category (payroll_category)
  - idx_client_id (client_id)

Universal Components: WHERE is_universal_template = 1 AND client_id IS NULL (11 components)
Client Custom Components: WHERE is_universal_template = 0 AND client_id = <client_id>
```

#### `pay_grade_structures` (EXISTING - NO CHANGES NEEDED)

```sql
Columns:
  - id (PK)
  - job_structure_id BIGINT UNSIGNED FK (links to job categories)
  - grade_name VARCHAR(100)
  - grade_code VARCHAR(20)
  - pay_structure_type VARCHAR(10)
  - emoluments JSON -- Stores: [{"component_id": 57, "amount": 500000}, {...}]
  - total_compensation DECIMAL(12,2)
  - currency VARCHAR(3) DEFAULT 'NGN'
  - is_active BOOLEAN
  - created_by, updated_by, created_at, updated_at

Notes:
  - emoluments JSON format:
    [
      {"component_id": 57, "component_code": "BASIC_SALARY", "amount": 500000},
      {"component_id": 58, "component_code": "HOUSING", "amount": 700000},
      ...
    ]
  - total_compensation = SUM of all amounts in emoluments array
```

#### `attendance_uploads` (ENHANCED)

```sql
Existing Columns (24 total):
  - id (PK)
  - client_id BIGINT UNSIGNED FK
  - payroll_month DATE -- Month/year tracking (e.g., '2025-11-01')
  - file_path VARCHAR(500)
  - original_filename VARCHAR(255)
  - successfully_matched INT
  - failed_matches INT
  - match_percentage DECIMAL(5,2)
  - processing_status ENUM('pending','processing','completed','failed')
  - validation_status ENUM('pending','validated','partial','failed')
  - processing_errors JSON
  - format_validation_results JSON
  - matching_validation_results JSON
  - ready_for_processing BOOLEAN
  - uploaded_by BIGINT UNSIGNED FK
  - created_at, updated_at

NEW Column (Phase 1):
  - is_for_payroll BOOLEAN DEFAULT 1 -- TRUE = payroll, FALSE = invoice only

Index:
  - idx_is_for_payroll (is_for_payroll)

Filter Logic:
  - Payroll: WHERE is_for_payroll = 1 AND ready_for_processing = 1
  - Invoice: WHERE is_for_payroll = 0 AND ready_for_processing = 1
  - Both: No filter (shows all)
```

#### `attendance_records` (EXISTING - PERFECT AS-IS)

```sql
Columns (30 total):
  - id (PK)
  - attendance_upload_id BIGINT UNSIGNED FK
  - staff_id BIGINT UNSIGNED FK
  - pay_grade_structure_id BIGINT UNSIGNED FK
  - days_worked INT -- Used as days_present
  - total_expected_days INT -- Used as total_days
  - actual_working_days INT -- Working days only
  - prorated_percentage DECIMAL(5,2) -- Pre-calculated (days_worked / total_expected_days × 100)
  - calculation_method ENUM('working_days','calendar_days') -- Matches client.pay_calculation_basis
  - calculation_details JSON -- Stores breakdown
  - ready_for_calculation BOOLEAN
  - attendance_factor DECIMAL(3,2)
  - created_at, updated_at

Usage in Payroll:
  - days_present = days_worked
  - days_absent = total_expected_days - days_worked
  - total_days = total_expected_days
  - proration_factor = prorated_percentage / 100
```

#### `tax_brackets` (CREATED IN MIGRATION 3)

```sql
Columns:
  - id (PK)
  - tier_number INT (1-6)
  - income_from DECIMAL(15,2)
  - income_to DECIMAL(15,2) NULL -- NULL for last tier
  - tax_rate DECIMAL(5,2) -- Percentage (0.00 - 100.00)
  - description VARCHAR(255)
  - effective_from DATE
  - effective_to DATE NULL
  - created_at, updated_at

Seeded Data: 6 Nigerian tax brackets (effective_from: 2025-01-01)
```

#### `payroll_calculation_formulas` (CREATED IN MIGRATION 4)

```sql
Columns:
  - id (PK)
  - formula_code VARCHAR(50) UNIQUE
  - formula_name VARCHAR(255)
  - formula_expression TEXT
  - description TEXT
  - execution_order INT (1-12)
  - is_system_default BOOLEAN DEFAULT 1
  - client_id BIGINT UNSIGNED NULL FK -- NULL = system, NOT NULL = client override
  - job_structure_id BIGINT UNSIGNED NULL FK -- Further customization
  - is_active BOOLEAN
  - created_at, updated_at

Seeded Data: 12 formulas (ANNUAL_GROSS to CREDIT_TO_BANK)
```

#### `payroll_runs` (CREATED IN MIGRATION 5)

```sql
Columns:
  - id (PK)
  - client_id BIGINT UNSIGNED FK
  - month INT (1-12)
  - year INT (2020-2100)
  - attendance_upload_id BIGINT UNSIGNED NULL -- Nullable for manual runs
  - status ENUM('draft','calculated','approved','exported','cancelled') DEFAULT 'draft'
  - total_staff_count INT DEFAULT 0
  - total_gross_pay DECIMAL(15,2) DEFAULT 0.00
  - total_deductions DECIMAL(15,2) DEFAULT 0.00
  - total_net_pay DECIMAL(15,2) DEFAULT 0.00
  - total_credit_to_bank DECIMAL(15,2) DEFAULT 0.00
  - calculation_date TIMESTAMP NULL
  - approved_at TIMESTAMP NULL
  - exported_at TIMESTAMP NULL
  - export_file_path VARCHAR(500) NULL
  - notes TEXT NULL
  - created_by BIGINT UNSIGNED NULL FK
  - approved_by BIGINT UNSIGNED NULL FK
  - created_at, updated_at

Unique Constraint: (client_id, month, year)
Indexes: status, (client_id, year, month)
```

#### `payroll_items` (CREATED IN MIGRATION 6)

```sql
Columns (30+ fields):
  - id (PK)
  - payroll_run_id BIGINT UNSIGNED FK
  - staff_id BIGINT UNSIGNED FK
  - client_id BIGINT UNSIGNED FK
  - pay_grade_structure_id BIGINT UNSIGNED FK
  - attendance_id BIGINT UNSIGNED NULL -- References attendance_records.id

  -- Staff snapshot:
  - staff_name VARCHAR(255)
  - staff_code VARCHAR(50)
  - bank_name VARCHAR(100) NULL
  - account_number VARCHAR(20) NULL
  - pfa_code VARCHAR(50) NULL

  -- Attendance:
  - days_present INT
  - days_absent INT
  - total_days INT
  - proration_factor DECIMAL(5,4)

  -- Annual amounts:
  - annual_gross_salary DECIMAL(15,2)
  - annual_reimbursables DECIMAL(15,2)
  - pensionable_amount DECIMAL(15,2)

  -- Monthly amounts:
  - monthly_gross DECIMAL(15,2)
  - monthly_reimbursables DECIMAL(15,2)

  -- Tax:
  - taxable_income DECIMAL(15,2)
  - paye_tax DECIMAL(15,2)

  -- Deductions:
  - pension_deduction DECIMAL(15,2)
  - leave_allowance_deduction DECIMAL(15,2)
  - thirteenth_month_deduction DECIMAL(15,2)
  - other_deductions DECIMAL(15,2) DEFAULT 0.00
  - total_deductions DECIMAL(15,2)

  -- Final amounts:
  - net_pay DECIMAL(15,2)
  - credit_to_bank DECIMAL(15,2)

  -- Snapshot:
  - emoluments_snapshot JSON -- {"BASIC_SALARY": 500000, "HOUSING": 700000, ...}

  - calculation_date TIMESTAMP NULL
  - notes TEXT NULL
  - created_at, updated_at

Unique Constraint: (payroll_run_id, staff_id)
Indexes: payroll_run_id, staff_id, client_id
```

### 2.2 New Migration Required (Phase 1)

#### Migration: `add_is_for_payroll_and_client_id_columns`

```sql
ALTER TABLE attendance_uploads
  ADD COLUMN is_for_payroll BOOLEAN DEFAULT 1 AFTER ready_for_processing,
  ADD INDEX idx_is_for_payroll (is_for_payroll);

ALTER TABLE emolument_components
  ADD COLUMN client_id BIGINT UNSIGNED NULL AFTER payroll_category,
  ADD CONSTRAINT fk_emolument_components_client
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  ADD INDEX idx_client_id (client_id);
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Models

#### A. Existing Models (Enhanced)

```php
// app/Models/EmolumentComponent.php
class EmolumentComponent extends Model
{
    protected $fillable = [
        'component_code', 'component_name', 'description', 'category',
        'status', 'type', 'class', 'client_account', 'ledger_account_code',
        'ledger_account_name', 'is_taxable', 'calculation_method',
        'display_order', 'is_active', 'is_universal_template',
        'is_pensionable', 'payroll_category', 'client_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_taxable' => 'boolean',
        'is_universal_template' => 'boolean',
        'is_pensionable' => 'boolean',
    ];

    // Relationships
    public function client() {
        return $this->belongsTo(Client::class);
    }

    // Scopes
    public function scopeUniversal($query) {
        return $query->where('is_universal_template', true)->whereNull('client_id');
    }

    public function scopeClientSpecific($query, $clientId) {
        return $query->where('client_id', $clientId);
    }

    public function scopeAllAvailableForClient($query, $clientId) {
        return $query->where(function($q) use ($clientId) {
            $q->where('is_universal_template', true)->whereNull('client_id')
              ->orWhere('client_id', $clientId);
        })->where('is_active', true);
    }
}
```

```php
// app/Models/AttendanceUpload.php (Enhanced)
class AttendanceUpload extends Model
{
    protected $fillable = [
        // ...existing fields...
        'is_for_payroll',
    ];

    protected $casts = [
        // ...existing casts...
        'is_for_payroll' => 'boolean',
        'ready_for_processing' => 'boolean',
    ];

    // Scopes
    public function scopeForPayroll($query) {
        return $query->where('is_for_payroll', true)->where('ready_for_processing', true);
    }

    public function scopeForInvoice($query) {
        return $query->where('is_for_payroll', false)->where('ready_for_processing', true);
    }
}
```

#### B. New Models Created (Phase completed)

- ✅ `TaxBracket.php`
- ✅ `PayrollRun.php`
- ✅ `PayrollItem.php`
- ✅ `PayrollCalculationFormula.php`

### 3.2 Services

#### A. Existing Service (Enhanced)

```php
// app/Services/PayrollCalculationEngine.php (CREATED)
// Methods:
- calculateMonthlyPayroll($staff, $payGrade, $attendanceRecord, $year)
- calculateProgressiveTax($taxableIncome, $year)
- separateEmolumentsByCategory($emoluments)
- calculateTotalDays($month, $year, $method)
- validateCalculation($calculation)
```

#### B. New Services Required (Phase 1)

```php
// app/Services/PayGradeExcelService.php
class PayGradeExcelService
{
    /**
     * Generate Excel template for bulk upload
     *
     * @param int $jobCategoryId
     * @param int $clientId
     * @return \PhpOffice\PhpSpreadsheet\Spreadsheet
     */
    public function generateTemplate($jobCategoryId, $clientId);

    /**
     * Parse uploaded Excel file
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param int $jobCategoryId
     * @param int $clientId
     * @return array ['success' => bool, 'data' => array, 'errors' => array]
     */
    public function parseUploadedFile($file, $jobCategoryId, $clientId);

    /**
     * Validate and save parsed data
     *
     * @param array $data
     * @return array ['success' => bool, 'saved' => int, 'errors' => array]
     */
    public function saveEmoluments($data);
}
```

### 3.3 Controllers

#### A. Existing Controllers (To be Enhanced)

```php
// app/Http/Controllers/PayrollRunController.php (CREATED - 8 endpoints)
// Routes already registered in api.php under /api/payroll prefix
```

#### B. New Controllers Required (Phase 1)

```php
// app/Http/Controllers/EmolumentComponentController.php
class EmolumentComponentController extends Controller
{
    // Get all components (universal + client-specific)
    public function index(Request $request); // ?client_id=X

    // Create client-specific component
    public function store(Request $request);

    // Update component
    public function update(Request $request, $id);

    // Delete client-specific component (soft delete)
    public function destroy($id);

    // Get universal template (11 components)
    public function getUniversalTemplate();
}
```

```php
// app/Http/Controllers/PayGradeController.php (ENHANCED)
class PayGradeController extends Controller
{
    // Existing CRUD methods...

    // NEW: Download Excel template for bulk upload
    public function downloadBulkTemplate(Request $request);

    // NEW: Upload filled Excel template
    public function uploadBulkEmoluments(Request $request);

    // NEW: Load universal template into pay grade
    public function loadUniversalTemplate(Request $request, $id);
}
```

```php
// app/Http/Controllers/AttendanceUploadController.php (ENHANCED)
class AttendanceUploadController extends Controller
{
    // Existing upload method enhanced with is_for_payroll flag
    public function upload(Request $request);

    // Get attendance uploads for payroll
    public function getForPayroll(Request $request); // ?client_id=X&month=11&year=2025
}
```

---

## 4. FRONTEND ARCHITECTURE

### 4.1 Module Structure

```
frontend/src/app/dashboard/admin/
  └─ hr-payroll-management/
      └─ payroll-processing/
          ├─ page.tsx (Main container with 3 tabs)
          ├─ components/
          │   ├─ PayrollRunsTab.tsx
          │   ├─ AttendanceForPayrollTab.tsx
          │   ├─ PayrollSettingsTab.tsx
          │   ├─ CreatePayrollRunModal.tsx
          │   ├─ PayrollRunDetailModal.tsx
          │   ├─ PayrollItemDetailModal.tsx
          │   └─ UploadAttendanceModal.tsx
          └─ services/
              └─ payrollService.ts

frontend/src/components/admin/salary-structure/
  └─ (existing pay grade components - to be enhanced)
      ├─ PayGradeEditModal.tsx (ENHANCED with universal template loader)
      ├─ BulkUploadModal.tsx (NEW)
      ├─ ManageEmolumentComponentsModal.tsx (NEW)
      └─ EmolumentGridEditor.tsx (NEW - reusable component)
```

### 4.2 Component Specifications

#### A. Main Container: `PayrollProcessingPage.tsx`

```tsx
interface PayrollProcessingPageProps {
  theme: Theme;
  currentClient: Client;
}

State:
  - activeTab: 'runs' | 'attendance' | 'settings'
  - selectedPayrollRun: PayrollRun | null
  - filters: { client_id, month, year, status }

Tabs:
  1. Payroll Runs (default active)
  2. Attendance for Payroll
  3. Payroll Settings
```

#### B. Tab 1: `PayrollRunsTab.tsx`

```tsx
Components:
  - Filters (client, month/year, status)
  - Create Payroll Run button
  - PayrollRunsTable
    Columns: Client, Month/Year, Status, Total Staff, Total Gross, Total Net, Actions
    Actions: View, Calculate, Approve, Export, Cancel, Delete
  - CreatePayrollRunModal
  - PayrollRunDetailModal

State:
  - payrollRuns: PayrollRun[]
  - loading: boolean
  - pagination: { page, perPage, total }

API Calls:
  - GET /api/payroll/runs (with filters)
  - POST /api/payroll/runs (create)
  - GET /api/payroll/runs/{id} (detail)
  - POST /api/payroll/runs/{id}/calculate
  - POST /api/payroll/runs/{id}/approve
  - GET /api/payroll/runs/{id}/export
  - POST /api/payroll/runs/{id}/cancel
  - DELETE /api/payroll/runs/{id}
```

#### C. Tab 2: `AttendanceForPayrollTab.tsx`

```tsx
Components:
  - Upload Attendance button (opens modal)
  - AttendanceUploadsTable
    Columns: Upload Date, Client, Month, Total Staff, Matched, Failed, Match %, Status, Actions
    Actions: Select for Payroll, View Details
  - UploadAttendanceModal

State:
  - attendanceUploads: AttendanceUpload[]
  - loading: boolean
  - filters: { client_id, month, year }

API Calls:
  - GET /api/attendance/uploads?is_for_payroll=1
  - POST /api/attendance/upload (with is_for_payroll flag)
```

#### D. Tab 3: `PayrollSettingsTab.tsx` (EDITABLE + Reference)

```tsx
Components:
  - TaxConfigurationSection (editable PAYE brackets, exemption threshold)
  - StatutoryDeductionsSection (editable pension, NHF, NSITF, ITF rates)
  - CalculationFormulasSection (editable formulas with validation)
  - UniversalComponentsTable (11 components - read-only reference)
  - ResetToDefaultsButton (per section)
  - TestFormulaButton (validates syntax before saving)

State:
  - settings: PayrollSettings[]
  - editedSettings: { [key: string]: any }
  - validationResults: { [key: string]: ValidationResult }
  - loading: boolean

API Calls:
  - GET /api/payroll/settings (load all settings)
  - PUT /api/payroll/settings/{key} (update specific setting)
  - POST /api/payroll/settings/{key}/reset (reset to Nigeria defaults)
  - POST /api/payroll/settings/validate (test formula syntax)
  - GET /api/payroll/settings/history/{key} (audit trail)
```

**Key Features:**

1. **Editable Tax Configuration**

   - PAYE brackets (6 tiers) - admin can adjust rates when tax laws change
   - Tax exemption threshold (CRA + 20% relief)

2. **Editable Statutory Rates**

   - Pension (8% employee + 10% employer) - configurable
   - NHF (2.5% of basic) - configurable
   - NSITF (1% of total emoluments) - configurable
   - ITF (1% of annual payroll) - configurable

3. **Editable Calculation Formulas**

   - Gross Pay formula - customizable with validation
   - Taxable Income formula - customizable with validation
   - Net Pay formula - customizable with validation
   - Formula validation prevents syntax errors

4. **Read-Only Reference**
   - Universal Components (11 system-wide components)
   - Component categories, pensionable flags
   - Link to "Manage Components" for client-specific additions

**Database Integration:**

- New table: `payroll_settings` (stores all configurable settings as JSON)
- Seeded with Nigeria 2025 defaults (PAYE, pension, NHF, etc.)
- Audit trail: tracks changes with timestamp, user, reason
- Reset capability: restore defaults with one click
  - GET /api/emolument-components?universal=true

````

#### E. Pay Grade Enhancement: `PayGradeEditModal.tsx`
```tsx
NEW Features:
  1. "Load Universal Template" button
     - Fetches 11 universal components
     - Populates EmolumentGridEditor with component_id + empty amounts
     - User enters amounts

  2. "Add Custom Component" button
     - Opens ManageEmolumentComponentsModal
     - Creates client-specific component
     - Adds to EmolumentGridEditor

  3. EmolumentGridEditor (reusable component)
     Columns: Component Code, Component Name, Category, Pensionable?, Amount, Actions (Remove)
     Features:
       - Editable amount cells
       - Calculate total_compensation on change
       - Remove row (except universal if template loaded)
       - Add custom component

State:
  - emoluments: Array<{component_id, component_code, component_name, amount}>
  - total_compensation: number (auto-calculated)

API Calls:
  - GET /api/emolument-components/universal
  - GET /api/emolument-components?client_id=X
  - POST /api/emolument-components (create custom)
  - PUT /api/pay-grades/{id} (save emoluments JSON)
````

#### F. Bulk Upload: `BulkUploadModal.tsx`

```tsx
Workflow:
  1. User clicks "Download Template" button
     - GET /api/pay-grades/bulk-template?job_category_id=X&client_id=Y
     - Downloads Excel with:
       * Rows: All grades for that job category
       * Columns: Grade Name, Grade Code, 11 universal components, any custom components

  2. User fills Excel with amounts

  3. User uploads filled Excel
     - POST /api/pay-grades/bulk-upload (multipart/form-data)
     - Shows preview table

  4. User confirms
     - Saves all emoluments to respective pay grades
     - Updates total_compensation for each grade

Components:
  - Download Template button
  - File upload dropzone
  - Preview table (conditional render after upload)
  - Confirm/Cancel buttons

State:
  - file: File | null
  - previewData: Array<{grade_name, grade_code, emoluments}>
  - uploading: boolean
  - errors: string[]

API Calls:
  - GET /api/pay-grades/bulk-template
  - POST /api/pay-grades/bulk-upload
```

#### G. Manage Custom Components: `ManageEmolumentComponentsModal.tsx`

```tsx
Purpose: Create CLIENT-SPECIFIC emolument components

Form Fields:
  - component_code (auto-generated or user input)
  - component_name (required)
  - description (optional)
  - category (basic, allowance, deduction, benefit)
  - payroll_category (salary, allowance, reimbursable, deduction, statutory)
  - is_pensionable (checkbox)
  - is_taxable (checkbox)

Validation:
  - component_code: Unique within client scope
  - component_name: Required, max 255 chars
  - client_id: Auto-set from context (hidden field)

List View:
  - Table of existing client-specific components
  - Actions: Edit, Delete (soft delete)

State:
  - components: EmolumentComponent[] (client-specific only)
  - showForm: boolean
  - editingComponent: EmolumentComponent | null

API Calls:
  - GET /api/emolument-components?client_id=X
  - POST /api/emolument-components
  - PUT /api/emolument-components/{id}
  - DELETE /api/emolument-components/{id}
```

### 4.3 Routing Structure

```typescript
// Navigation registration in AdminNavigation.jsx
{
  id: "hr-payroll-management",
  name: "HR & Payroll Mgt.",
  icon: "💼",
  type: "module",
  submodules: [
    // ...existing submodules...
    {
      id: "payroll-processing",
      name: "Payroll Processing",
      path: "/dashboard/admin/hr-payroll/payroll-processing"
    },
  ],
}

// AdminRouter.jsx mapping
case 'hr-payroll-management':
  if (activeSubmodule === 'payroll-processing') {
    return <PayrollProcessingPage />;
  }
  break;
```

---

## 5. DATA FLOW & WORKFLOWS

### 5.1 Payroll Run Workflow

```
1. CREATE PAYROLL RUN (Status: draft)
   User Input:
     - Select client
     - Select month/year
     - Select attendance upload (optional)
     - Add notes

   Backend:
     - Validate: No duplicate run for client+month+year
     - Create: payroll_runs record with status='draft'

   Frontend:
     - Show in Payroll Runs table
     - Enable "Calculate" button

2. CALCULATE PAYROLL (Status: draft → calculated)
   User Action: Click "Calculate" button

   Backend Process:
     a. Fetch attendance_records WHERE attendance_upload_id = X AND ready_for_calculation = TRUE
     b. For each attendance_record:
        - Load staff
        - Load pay_grade_structure (get emoluments JSON)
        - Fetch emolument_components by IDs from JSON
        - Call PayrollCalculationEngine.calculateMonthlyPayroll()
        - Validate calculation
        - Create payroll_items record
     c. Aggregate totals:
        - total_staff_count
        - total_gross_pay
        - total_deductions
        - total_net_pay
        - total_credit_to_bank
     d. Update payroll_runs: status='calculated', calculation_date=now()

   Frontend:
     - Show loading spinner during calculation
     - Display results in PayrollRunDetailModal
     - Show calculated payroll items table
     - Enable "Approve" button

3. REVIEW & APPROVE (Status: calculated → approved)
   User Action: Review payroll items, click "Approve"

   Backend:
     - Validate: status = 'calculated'
     - Update: status='approved', approved_at=now(), approved_by=user_id

   Frontend:
     - Disable edit/recalculate
     - Enable "Export" button

4. EXPORT TO EXCEL (Status: approved → exported)
   User Action: Click "Export" button

   Backend:
     - Generate Excel file with:
       * Summary sheet (totals)
       * Payroll items sheet (all staff details)
       * Bank transfer sheet (staff_name, account_number, credit_to_bank)
     - Save file path
     - Update: status='exported', exported_at=now(), export_file_path=path

   Frontend:
     - Download Excel file
     - Show "Exported" badge

5. CANCEL (Any status → cancelled)
   User Action: Click "Cancel" button

   Backend:
     - Validate: status != 'exported'
     - Delete all payroll_items
     - Update: status='cancelled'

   Frontend:
     - Show "Cancelled" badge
     - Disable all actions except delete

6. DELETE (Status: draft or cancelled only)
   User Action: Click "Delete" button

   Backend:
     - Validate: status IN ('draft', 'cancelled')
     - Delete payroll_items (cascade)
     - Delete payroll_runs record

   Frontend:
     - Remove from table
     - Show success message
```

### 5.2 Attendance Upload Workflow (for Payroll)

```
1. UPLOAD CSV FILE
   User Input:
     - Select client
     - Select month/year
     - Upload CSV file
     - Set is_for_payroll = TRUE (checkbox checked)

   Backend:
     - Parse CSV
     - Fuzzy match staff names (Levenshtein distance)
     - Validate data
     - Create attendance_upload record
     - Create attendance_records (matched staff only)
     - Store failed matches in JSON

   Frontend:
     - Show upload progress
     - Display matching results (success rate, failed matches)
     - Enable manual mapping for failed matches

2. MANUAL MAPPING (for failed matches)
   User Action: Select correct staff from dropdown for each failed match

   Backend:
     - Update attendance_records with manually mapped staff_id
     - Recalculate success metrics

   Frontend:
     - Update match percentage
     - Move mapped records from failed to success list

3. VALIDATE & CONFIRM
   User Action: Click "Confirm" after mapping

   Backend:
     - Set ready_for_processing = TRUE
     - Update validation_status = 'validated'

   Frontend:
     - Show in "Attendance for Payroll" tab
     - Enable "Select for Payroll Run" button

4. SELECT FOR PAYROLL RUN
   User Action: Click "Select" button in Attendance for Payroll tab

   Frontend:
     - Open CreatePayrollRunModal
     - Pre-fill attendance_upload_id
     - Pre-fill client_id, month, year from attendance upload
```

### 5.3 Pay Grade Emolument Setup Workflow

```
OPTION A: Manual Entry (One-by-One)
  1. Edit Pay Grade
  2. Click "Load Universal Template"
  3. Enter amounts for 11 components
  4. Click "Add Custom Component" (if needed)
  5. Create client-specific component
  6. Add to grid with amount
  7. Save (stores as JSON in emoluments column)

OPTION B: Bulk Upload (All Grades at Once)
  1. Navigate to Grading System tab (under specific Job Category)
  2. Click "Download Template"
  3. Excel generated with:
     - Rows: All grades for this job category
     - Columns: 11 universal + any client-specific components
  4. Fill amounts in Excel
  5. Upload filled Excel
  6. Review preview table
  7. Confirm
  8. System saves emoluments JSON for all grades
```

---

## 6. API ENDPOINTS

### 6.1 Payroll Runs (CREATED - Phase Completed)

```
GET    /api/payroll/runs                 - List all runs (with filters)
POST   /api/payroll/runs                 - Create new run (draft)
GET    /api/payroll/runs/{id}            - Get single run with items
POST   /api/payroll/runs/{id}/calculate  - Calculate payroll
POST   /api/payroll/runs/{id}/approve    - Approve payroll
GET    /api/payroll/runs/{id}/export     - Export to Excel
POST   /api/payroll/runs/{id}/cancel     - Cancel payroll
DELETE /api/payroll/runs/{id}            - Delete payroll (draft only)
```

### 6.2 Emolument Components (NEW - Phase 1 Required)

```
GET    /api/emolument-components                - List all (universal + client-specific)
                                                  Query params: ?client_id=X&universal=true
GET    /api/emolument-components/universal      - Get 11 universal components only
GET    /api/emolument-components/{id}           - Get single component
POST   /api/emolument-components                - Create client-specific component
PUT    /api/emolument-components/{id}           - Update component
DELETE /api/emolument-components/{id}           - Soft delete client-specific component
```

### 6.3 Pay Grades (ENHANCED - Phase 1 Required)

```
Existing:
GET    /api/pay-grades                   - List all grades
GET    /api/pay-grades/{id}              - Get single grade
POST   /api/pay-grades                   - Create grade
PUT    /api/pay-grades/{id}              - Update grade (including emoluments JSON)
DELETE /api/pay-grades/{id}              - Delete grade

NEW:
GET    /api/pay-grades/bulk-template     - Download Excel template
                                            Query: ?job_category_id=X&client_id=Y
POST   /api/pay-grades/bulk-upload       - Upload filled Excel
                                            Body: multipart/form-data (file)
POST   /api/pay-grades/{id}/load-template - Load universal template into grade
                                            Response: 11 components with empty amounts
```

### 6.4 Attendance Uploads (ENHANCED - Phase 1 Required)

```
Existing:
POST   /api/attendance/upload            - Upload CSV (enhanced with is_for_payroll flag)
GET    /api/attendance/uploads           - List all uploads

NEW:
GET    /api/attendance/uploads/payroll   - Get uploads for payroll only
                                            Query: ?client_id=X&month=11&year=2025
```

### 6.5 Tax Brackets & Formulas (READ-ONLY)

```
GET    /api/payroll/tax-brackets         - Get all tax brackets
GET    /api/payroll/formulas             - Get all calculation formulas
```

---

## 7. UI/UX SPECIFICATIONS

### 7.1 Status Badge Colors (Payroll Runs)

```
draft:      Yellow/Amber    - "Draft" (Edit, Calculate allowed)
calculated: Blue            - "Calculated" (Approve, Cancel allowed)
approved:   Green           - "Approved" (Export, Cancel allowed)
exported:   Purple          - "Exported" (Read-only)
cancelled:  Red             - "Cancelled" (Delete allowed)
```

### 7.2 Table Sorting & Pagination

```
All tables:
  - Default sort: created_at DESC
  - Client-side sorting for <100 records
  - Server-side pagination for 100+ records
  - Page size: 20 records per page
  - Show total count
```

### 7.3 Form Validation (Client-Side)

```
CreatePayrollRunModal:
  - client_id: Required
  - month: Required, 1-12
  - year: Required, 2020-2100
  - attendance_upload_id: Optional (can run manual payroll)

ManageEmolumentComponentsModal:
  - component_code: Required, alphanumeric + underscore, max 40 chars
  - component_name: Required, max 255 chars
  - payroll_category: Required if is_universal_template = false

BulkUploadModal:
  - file: Required, .xlsx or .xls only, max 5MB
  - Validate Excel structure before submission
```

### 7.4 Loading States

```
All API calls:
  - Show spinner/skeleton during fetch
  - Disable action buttons during processing
  - Show progress indicator for long operations (calculation, bulk upload)
  - Timeout: 60 seconds for calculation, 30 seconds for other operations
```

### 7.5 Error Handling (User-Facing)

```
Toast Notifications:
  - Success: Green toast, 3 seconds auto-dismiss
  - Error: Red toast, 5 seconds, manual dismiss
  - Warning: Yellow toast, 4 seconds

Error Messages:
  - Network error: "Connection failed. Please check your internet."
  - Validation error: Show field-specific errors below inputs
  - Permission error: "You don't have permission to perform this action."
  - Duplicate error: "Payroll run already exists for this period."
```

---

## 8. VALIDATION RULES

### 8.1 Business Rules

#### Payroll Runs

```
1. UNIQUENESS:
   - One payroll run per client per month/year (excluding cancelled)
   - Constraint: UNIQUE(client_id, month, year) WHERE status != 'cancelled'

2. STATUS TRANSITIONS:
   - draft → calculated (via calculate action)
   - calculated → approved (via approve action)
   - approved → exported (via export action)
   - Any → cancelled (except exported)
   - Cannot reverse once exported

3. DELETE RESTRICTIONS:
   - Can only delete if status = 'draft' or 'cancelled'
   - Approved/exported runs cannot be deleted (audit trail)

4. RECALCULATION:
   - Can recalculate if status = 'draft' or 'calculated'
   - Deletes existing payroll_items before recalculating
```

#### Emolument Components

```
1. UNIVERSAL COMPONENTS:
   - Cannot be deleted (system-protected)
   - Cannot be edited by users (admin only)
   - is_universal_template = true, client_id = NULL

2. CLIENT-SPECIFIC COMPONENTS:
   - component_code must be unique within client scope
   - client_id must be set
   - is_universal_template = false
   - Can be deleted (soft delete)

3. PAYROLL CATEGORIES:
   - Must be one of: salary, allowance, reimbursable, deduction, statutory
   - Pensionable only valid for salary/allowance categories
```

#### Pay Grade Emoluments

```
1. EMOLUMENTS JSON STRUCTURE:
   [
     {
       "component_id": 57,
       "component_code": "BASIC_SALARY",
       "amount": 500000
     },
     ...
   ]

2. VALIDATION:
   - All component_ids must exist in emolument_components
   - Amounts must be >= 0
   - total_compensation = SUM(all amounts)

3. BULK UPLOAD:
   - All grades in Excel must exist in database
   - component_codes must match existing components (universal + client-specific)
   - No negative amounts allowed
```

### 8.2 Data Integrity Checks

#### Pre-Calculation Validation

```
Before calculating payroll:
  1. Attendance upload must have ready_for_processing = TRUE
  2. All attendance_records must have ready_for_calculation = TRUE
  3. All staff must have valid pay_grade_structure_id
  4. All pay grades must have non-empty emoluments JSON
  5. All emolument component_ids must exist in database
```

#### Post-Calculation Validation

```
After calculating each payroll item:
  1. net_pay >= 0 (warn if negative, don't block)
  2. credit_to_bank = net_pay + monthly_reimbursables (exactly)
  3. total_deductions = paye + pension + leave + 13th + other (exactly)
  4. proration_factor between 0 and 1 (inclusive)
  5. days_present + days_absent = total_days (exactly)
```

---

## 9. ERROR HANDLING

### 9.1 Backend Error Responses

```json
// Validation Error (422)
{
  "errors": {
    "client_id": ["The client id field is required."],
    "month": ["The month must be between 1 and 12."]
  }
}

// Business Logic Error (409)
{
  "error": "Payroll run already exists for this client and period",
  "existing_payroll_run": { /* run details */ }
}

// Calculation Error (400)
{
  "error": "No attendance records found for calculation",
  "details": "Attendance upload has no staff marked as ready_for_calculation"
}

// Server Error (500)
{
  "error": "Failed to calculate payroll: Database connection lost"
}
```

### 9.2 Frontend Error Handling Strategy

```typescript
try {
  const response = await payrollService.calculate(payrollRunId);

  if (response.errors && response.errors.length > 0) {
    // Partial success (some items calculated, others failed)
    showWarningToast(
      `Calculated ${response.calculated_count} items. ${response.errors.length} errors.`
    );
    showErrorList(response.errors);
  } else {
    showSuccessToast("Payroll calculated successfully");
  }

  refreshPayrollRun();
} catch (error) {
  if (error.response?.status === 422) {
    // Validation errors
    setFieldErrors(error.response.data.errors);
  } else if (error.response?.status === 409) {
    // Business logic error
    showErrorToast(error.response.data.error);
  } else {
    // Generic error
    showErrorToast("Failed to calculate payroll. Please try again.");
    logErrorToSentry(error);
  }
}
```

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests (Backend)

```php
// PayrollCalculationEngineTest.php
- testCalculateProgressiveTax()
- testCalculateMonthlyPayroll()
- testSeparateEmolumentsByCategory()
- testValidateCalculation()
- testProrationFactorCalculation()

// PayrollRunControllerTest.php
- testCreatePayrollRun()
- testCalculatePayroll()
- testApprovePayroll()
- testExportPayroll()
- testCancelPayroll()
- testDeletePayroll()
- testDuplicatePreventionValidation()
```

### 10.2 Integration Tests (Backend)

```php
// PayrollWorkflowTest.php
- testCompletePayrollWorkflow() // Create → Calculate → Approve → Export
- testCancellationWorkflow()
- testRecalculationWorkflow()
- testBulkUploadWorkflow()
```

### 10.3 E2E Tests (Frontend)

```typescript
// payroll-run.spec.ts
- should create new payroll run
- should calculate payroll successfully
- should approve payroll
- should export payroll to Excel
- should prevent duplicate payroll runs
- should cancel payroll run
- should delete draft payroll run

// bulk-upload.spec.ts
- should download Excel template
- should upload filled Excel
- should validate Excel structure
- should save emoluments to all grades
```

### 10.4 Manual Testing Checklist

```
Payroll Runs:
  □ Create payroll run with all fields
  □ Create payroll run without attendance upload
  □ Calculate payroll with 1 staff
  □ Calculate payroll with 50+ staff
  □ Approve calculated payroll
  □ Export approved payroll to Excel
  □ Cancel payroll at each status
  □ Delete draft payroll
  □ Verify totals match sum of items

Attendance Upload:
  □ Upload CSV with perfect matches
  □ Upload CSV with partial matches
  □ Manual mapping of failed matches
  □ Confirm and set ready_for_processing
  □ Use in payroll run creation

Pay Grade Setup:
  □ Load universal template
  □ Enter amounts manually
  □ Add custom component
  □ Save emoluments
  □ Download bulk template
  □ Upload filled bulk template
  □ Verify total_compensation calculation

Custom Components:
  □ Create client-specific component
  □ Edit custom component
  □ Delete custom component
  □ Verify appears in bulk template
  □ Verify appears in pay grade edit modal
```

---

## 11. PERFORMANCE CONSIDERATIONS

### 11.1 Optimization Strategies

```
Backend:
  - Cache universal components (11 static records)
  - Cache tax brackets per year
  - Use database transactions for bulk operations
  - Index all foreign keys
  - Eager load relationships in API responses
  - Queue large payroll calculations (50+ staff)

Frontend:
  - Lazy load tabs (only render active tab)
  - Virtualize large tables (100+ rows)
  - Debounce search/filter inputs
  - Cache API responses for 5 minutes
  - Show skeleton loaders during fetch
  - Use React.memo for expensive components
```

### 11.2 Scalability Limits

```
Current Architecture Supports:
  - Clients: 10,000+
  - Staff per client: 1,000+
  - Payroll runs per month: 500+
  - Calculation time (100 staff): ~10 seconds
  - Bulk upload (50 grades): ~5 seconds
  - Excel export (100 staff): ~8 seconds

Bottlenecks to Monitor:
  - Payroll calculation for 500+ staff (consider queuing)
  - Bulk upload with 100+ grades (implement chunking)
  - Excel export with 1000+ staff (stream instead of in-memory)
```

---

## 12. DEPLOYMENT CHECKLIST

### 12.1 Pre-Deployment

```
□ Run all migrations in order
□ Run all seeders (universal components, tax brackets, formulas)
□ Verify 11 universal components exist
□ Verify 6 tax brackets exist
□ Verify 12 formulas exist
□ Clear all pay grade emoluments (cleanup completed)
□ Test calculation engine with sample data
□ Verify Excel export functionality
```

### 12.2 Post-Deployment

```
□ Monitor error logs for first 24 hours
□ Verify API response times (<500ms for lists, <2s for calculation)
□ Test with real client data (staging environment)
□ Collect user feedback
□ Document any edge cases discovered
```

---

## 13. APPENDICES

### Appendix A: Glossary

```
- Emolument: Salary or fees paid to a person for their work
- Pensionable: Subject to pension contribution (8% employee + 10% employer)
- Reimbursable: Paid separately (not part of gross salary, not taxed)
- Deduction: Deducted monthly, paid as lump sum later (leave, 13th month)
- Proration Factor: Adjustment based on attendance (days_worked / total_days)
- PAYE: Pay As You Earn (Nigerian progressive income tax)
- Universal Template: 11 standard emolument components used across all clients
- Client-Specific Component: Custom emolument created for a specific client
```

### Appendix B: Nigerian Tax Law Reference

```
Personal Income Tax Act (PITA) - Federal Inland Revenue Service (FIRS)
- Tax-free allowance: First ₦300,000 + 20% of gross + ₦200,000
- Consolidated Relief Allowance (CRA): ₦200,000 or 1% of gross (higher value)
- Pension relief: 8% of pensionable income (employee contribution)
```

---

**END OF DOCUMENTATION**

This comprehensive spec ensures minimal errors during implementation by defining:

- Exact database schema
- Precise API contracts
- Detailed UI workflows
- Comprehensive validation rules
- Clear testing strategies

All developers can reference this single document throughout the implementation process.
