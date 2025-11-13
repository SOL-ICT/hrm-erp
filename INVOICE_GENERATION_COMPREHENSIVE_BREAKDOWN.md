# COMPREHENSIVE INVOICE GENERATION BREAKDOWN

## Executive Summary

This document provides a **complete, detailed breakdown** of how the HRM-ERP system generates invoices from saved templates. This analysis covers both **Template Setup** and **Invoice Generation** modules, including backend (Laravel/PHP) and frontend (Next.js/React) implementations.

---

## TABLE OF CONTENTS

1. [System Architecture Overview](#system-architecture-overview)
2. [Template Setup Module](#template-setup-module)
3. [Invoice Generation Module](#invoice-generation-module)
4. [Complete Invoice Calculation Logic](#complete-invoice-calculation-logic)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Database Schema](#database-schema)
7. [Key Files and Their Roles](#key-files-and-their-roles)
8. [Critical Issues and Technical Debt](#critical-issues-and-technical-debt)

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

### High-Level Flow

```
1. TEMPLATE SETUP
   ├─> Admin creates/imports template for Client + Pay Grade combination
   ├─> Template defines: Custom Components (salary) + Statutory Components (deductions)
   ├─> Stored in `invoice_templates` table as JSON

2. ATTENDANCE UPLOAD
   ├─> Admin uploads Excel file with employee attendance
   ├─> System validates employees against client roster
   ├─> Creates `attendance_upload` and `attendance_records`

3. INVOICE GENERATION
   ├─> Admin selects attendance upload
   ├─> System fetches template for each employee (by client_id + pay_grade_structure_id)
   ├─> Calculates salary using TemplateBasedCalculationService
   ├─> Generates invoice with line items
   ├─> Exports to multi-sheet Excel file
```

### Technology Stack

- **Backend**: Laravel 10 (PHP 8.2), PhpSpreadsheet
- **Frontend**: Next.js 14, React 18
- **Database**: MySQL 8.0
- **Key Services**:
  - TemplateBasedCalculationService (core calculation engine)
  - InvoiceExcelExportService (Excel generation)
  - InvoiceGenerationService (invoice orchestration)

---

## 2. TEMPLATE SETUP MODULE

### 2.1 Frontend Components

#### Main Component

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/InvoiceManagement.jsx`

**Responsibilities**:

- Manages template setup UI via tabs
- Handles client and pay grade selection
- Coordinates template CRUD operations
- Provides interface for Excel import/export

#### Template Setup Tab

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/tabs/TemplateSetupTab.jsx`

**Key Features**:

- Client selection dropdown
- Pay grade structure selection
- Custom components editor (salary components)
- Statutory components editor (deductions)
- Formula builder for calculated components
- Template save/load/clone/delete operations
- Excel import/export

#### Template Setup Section

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/TemplateSetupSection.jsx`

**State Management**:

```javascript
{
  statutory: {
    pension: { enabled, rate, calculation_type, components, formula },
    nhf: { enabled, rate, calculation_type, components, formula },
    nsitf: { enabled, rate, calculation_type, components, formula },
    itf: { enabled, rate, calculation_type, components, formula },
    tax: { enabled, rate, calculation_type, components, formula }
  },
  custom: [
    {
      id, name, rate, type: 'fixed'|'formula'|'prorated_annual',
      formula, components, annual_division_factor
    }
  ]
}
```

**User Actions**:

1. **Add Custom Component**: User adds salary components (Basic, Housing, Transport, etc.)
2. **Configure Type**:
   - `fixed`: Static monthly amount
   - `formula`: Calculated using formula (e.g., "Basic + Housing")
   - `prorated_annual`: Annual amount divided by months and prorated by attendance
3. **Set Statutory Deductions**: Configure PAYE, Pension, NHF, NSITF, etc.
4. **Define Formulas**: Use formula builder to create component calculations
5. **Save Template**: Template is validated and sent to backend

### 2.2 Backend API

#### Template Controller

**File**: `backend/app/Http/Controllers/InvoiceTemplateController.php`

**Endpoints**:

```php
GET    /api/invoice-templates              // List all templates
POST   /api/invoice-templates              // Create new template
GET    /api/invoice-templates/{id}         // Get single template
PUT    /api/invoice-templates/{id}         // Update template
DELETE /api/invoice-templates/{id}         // Delete template
GET    /api/invoice-templates/default      // Get default template for client+grade
POST   /api/invoice-templates/{id}/clone   // Clone existing template
POST   /api/invoice-templates/import-excel // Import from Excel
GET    /api/invoice-templates/{id}/export-excel // Export to Excel
```

**Key Methods**:

- `store()`: Validates and creates template
- `update()`: Updates existing template
- `importFromExcel()`: Uses ExcelTemplateImporter to parse uploaded file
- `exportToExcel()`: Converts template to Excel format

#### Template Model

**File**: `backend/app/Models/InvoiceTemplate.php`

**Database Fields**:

```php
- id (UUID)
- client_id (FK to clients)
- pay_grade_structure_id (FK to pay_grade_structures)
- template_name
- description
- custom_components (JSON array)
- statutory_components (JSON array)
- calculation_rules (JSON)
- annual_division_factor (decimal, default 12)
- use_credit_to_bank_model (boolean)
- service_fee_percentage (decimal)
- attendance_calculation_method ('working_days' | 'calendar_days')
- prorate_salary (boolean)
- minimum_attendance_factor (decimal)
- is_active (boolean)
- is_default (boolean)
- created_by, updated_by
- last_used_at
```

**Key Relationships**:

```php
belongsTo(Client::class)
belongsTo(PayGradeStructure::class)
```

**Important Methods**:

- `getMonthlyCustomComponents()`: Converts annual rates to monthly
- `getMonthlyStatutoryComponents()`: Converts annual deductions to monthly
- `markAsUsed()`: Updates last_used_at timestamp
- `setAsDefault()`: Sets template as default for client+grade combination

### 2.3 Excel Import/Export

#### Excel Template Importer

**File**: `backend/app/Services/ExcelTemplateImporter.php`

**Import Process**:

1. Reads uploaded Excel file using PhpSpreadsheet
2. Parses custom components (salary) from specified sheet/range
3. Parses statutory components (deductions) from specified sheet/range
4. Extracts formulas and component types
5. Validates structure and required fields
6. Creates InvoiceTemplate record with extracted data

**Export Process**:

1. Loads existing template from database
2. Creates multi-sheet Excel with:
   - Template metadata
   - Custom components list
   - Statutory components list
   - Formula definitions
3. Returns StreamedResponse for download

---

## 3. INVOICE GENERATION MODULE

### 3.1 Frontend Components

#### Invoice Generation Tab

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/tabs/InvoiceGenerationTab.jsx`

**User Flow**:

1. Select client from dropdown
2. View available attendance uploads (filtered by client)
3. Select attendance upload
4. Choose invoice type:
   - `with_schedule`: Detailed invoice with employee breakdown
   - `without_schedule`: Summary invoice only
5. Click "Generate Invoice"
6. View generation progress/results
7. Download Excel export

**State Management**:

```javascript
{
  selectedClient: clientId,
  selectedUpload: attendanceUploadId,
  invoiceType: 'with_schedule' | 'without_schedule',
  generating: boolean,
  generationResult: { success, invoiceId, message }
}
```

#### Generated Invoices Tab

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/tabs/GeneratedInvoicesTab.jsx`

**Features**:

- List all generated invoices
- Filter by client, date range, invoice type
- Search by invoice number
- View invoice details modal
- Export invoice to Excel
- Delete invoice

#### Invoice View Modal

**File**: `frontend/src/components/admin/modules/hr-payroll-management/submodules/invoicing/modals/InvoiceViewModal.jsx`

**Displays**:

- Invoice header (number, client, date, period)
- Payroll summary (gross, deductions, net)
- Employee line items table
- Calculation breakdown
- Export button

### 3.2 Backend API

#### Invoice Controller

**File**: `backend/app/Http/Controllers/Api/InvoiceController.php`

**Endpoints**:

```php
GET    /api/invoices                          // List invoices (paginated)
POST   /api/invoices/generate                 // Generate new invoice
GET    /api/invoices/{id}                     // Get invoice details
GET    /api/invoices/{id}/export-excel        // Export to Excel
DELETE /api/invoices/{id}                     // Delete invoice
GET    /api/invoices/statistics               // Dashboard statistics
GET    /api/invoices/available-attendance     // Uploads without invoices
POST   /api/attendance/upload                 // Upload attendance file
GET    /api/attendance/uploads                // List all uploads
```

**Key Methods**:

**`generate()` - Main Invoice Generation**:

```php
1. Validate request (attendance_upload_id, invoice_type)
2. Call InvoiceGenerationService::generateInvoice()
3. Return generated invoice with line items
```

**`exportExcel()` - Excel Export**:

```php
1. Load invoice with relationships (client, lineItems, attendanceUpload)
2. Call InvoiceExcelExportService::exportInvoice()
3. Return StreamedResponse with Excel file
```

#### Invoice Generation Service

**File**: `backend/app/Services/InvoiceGenerationService.php`

**Main Method**: `generateInvoice($attendanceUploadId, $invoiceType, $options)`

**Process Flow**:

```php
1. DB Transaction Begin
2. Load AttendanceUpload with attendanceRecords
3. Load Client
4. Get processed attendance records
5. FOR EACH attendance record:
   a. Call PayrollCalculationService::calculateEmployeePayroll()
   b. Store calculation result in payrollData array
6. Calculate invoice totals (gross, deductions, net)
7. Calculate management fee (7% of net payroll)
8. Calculate VAT (7.5% of management fee)
9. Apply WHT if provided
10. Calculate total invoice amount
11. Generate unique invoice number
12. Create GeneratedInvoice record
13. IF invoice_type == 'with_schedule':
    - Create InvoiceLineItem for each employee
14. DB Transaction Commit
15. Return invoice with line items
```

**Invoice Number Format**: `INV-{ClientCode}-{YYYY}-{MM}-{Sequence}`

- Example: `INV-FID-2024-01-001`

---

## 4. COMPLETE INVOICE CALCULATION LOGIC

### 4.1 Template-Based Calculation Service

**File**: `backend/app/Services/TemplateBasedCalculationService.php`

**Purpose**: Core calculation engine that computes employee salary from template

**Main Method**: `calculateFromTemplate(Staff $employee, int $clientId, float $attendanceFactor, array $attendanceContext)`

### 4.2 STEP-BY-STEP CALCULATION PROCESS

#### **STEP 1: Template Retrieval**

```php
$template = InvoiceTemplate::where('client_id', $clientId)
    ->where('pay_grade_structure_id', $employee->pay_grade_structure_id)
    ->where('is_active', true)
    ->first();
```

**Logic**:

- Query `invoice_templates` table for matching client + pay grade
- Use only active templates
- Throw exception if no template found

#### **STEP 2: Template Validation**

```php
private function validateTemplateCompleteness(InvoiceTemplate $template)
{
    // Check custom_components exist and valid
    if (empty($template->custom_components)) {
        throw new Exception("No custom components");
    }

    // Validate each component has: name, rate, type
    foreach ($template->custom_components as $component) {
        if (!isset($component['name']) || !isset($component['rate']) || !isset($component['type'])) {
            throw new Exception("Invalid component structure");
        }
    }

    // Check statutory_components exist
    if (empty($template->statutory_components)) {
        throw new Exception("No statutory components");
    }
}
```

#### **STEP 3: Extract Custom Components**

```php
private function extractCustomComponents(InvoiceTemplate $template): array
{
    $components = [];

    foreach ($template->custom_components as $component) {
        $key = strtolower(str_replace([' ', '-'], '_', $component['name']));

        // Convert annual rate to monthly
        $annualRate = floatval($component['rate']);
        $divisionFactor = $template->annual_division_factor ?? 12;
        $monthlyRate = $annualRate / $divisionFactor;

        $components[$key] = [
            'name' => $component['name'],
            'rate' => $monthlyRate,           // Monthly rate for calculations
            'annual_rate' => $annualRate,      // Original annual rate
            'type' => $component['type'],      // 'fixed', 'formula', 'prorated_annual'
            'id' => $component['id'] ?? null,
            'formula' => $component['formula'] ?? null
        ];
    }

    // Calculate formula-based components
    return $this->calculateFormulaComponents($components);
}
```

**Component Types**:

1. **fixed**: Static monthly amount (e.g., Basic Salary = ₦500,000/month)
2. **formula**: Calculated from other components (e.g., Housing = 20% × Basic)
3. **prorated_annual**: Annual amount prorated by attendance (e.g., Leave Allowance)

#### **STEP 4: Calculate Formula Components**

```php
private function calculateFormulaComponents(array $components): array
{
    $maxIterations = 5; // Prevent infinite loops
    $iteration = 0;

    do {
        $formulasCalculated = 0;
        $iteration++;

        foreach ($components as $key => &$component) {
            if ($component['type'] === 'formula' && $component['rate'] == 0) {
                // Evaluate formula using other component values
                $calculatedRate = $this->evaluateFormula(
                    $component['formula'],
                    $components
                );

                if ($calculatedRate !== false) {
                    $component['rate'] = $calculatedRate;
                    $component['annual_rate'] = $calculatedRate * 12;
                    $formulasCalculated++;
                }
            }
        }
    } while ($formulasCalculated > 0 && $iteration < $maxIterations);

    return $components;
}
```

**Formula Evaluation Logic**:

```php
private function evaluateFormula(string $formula, array $components): float|false
{
    // Example formula: "Basic + Housing" or "20 * Basic" or "SUM(Basic, Housing, Transport)"

    // Replace SUM() function
    $evaluableFormula = preg_replace('/SUM\s*\(\s*([^)]+)\s*\)/i', '($1)', $formula);

    // Replace component names with their values
    foreach ($components as $name => $component) {
        $value = $component['rate'];

        // Try multiple matching patterns (case-sensitive first)
        $patterns = [
            '/\b' . preg_quote($component['name'], '/') . '\b/',
            '/\b' . preg_quote($name, '/') . '\b/i'
        ];

        foreach ($patterns as $pattern) {
            $evaluableFormula = preg_replace($pattern, (string)$value, $evaluableFormula);
        }
    }

    // Handle percentage conversion (e.g., "10 * Basic" -> "0.10 * Basic")
    $evaluableFormula = preg_replace_callback('/(\d{1,2})\s*\*\s*\(/', function($matches) {
        $number = floatval($matches[1]);
        if ($number > 0 && $number <= 100) {
            return ($number / 100) . ' * (';
        }
        return $matches[0];
    }, $evaluableFormula);

    // Validate formula (only numbers, operators, parentheses)
    if (!preg_match('/^[\d\.\+\-\*\/\(\)\s]+$/', $evaluableFormula)) {
        return false;
    }

    // Evaluate using PHP eval
    try {
        $result = eval("return $evaluableFormula;");
        return is_numeric($result) ? floatval($result) : false;
    } catch (Exception $e) {
        return false;
    }
}
```

**Example Formula Calculation**:

```
Template Components:
- Basic: ₦500,000/month
- Housing: Formula = "20 * Basic"
- Transport: Formula = "10 * Basic"
- Gross: Formula = "SUM(Basic, Housing, Transport)"

Calculation:
1. Basic = 500,000 (fixed)
2. Housing = 20 * Basic = 0.20 × 500,000 = 100,000
3. Transport = 10 * Basic = 0.10 × 500,000 = 50,000
4. Gross = Basic + Housing + Transport = 650,000
```

#### **STEP 5: Apply Attendance Factor**

```php
private function applyAttendanceFactor(array $baseComponents, float $attendanceFactor): array
{
    $adjustedComponents = [];

    foreach ($baseComponents as $key => $component) {
        $baseAmount = $component['rate'];
        $adjustedAmount = $baseAmount * $attendanceFactor;

        $adjustedComponents[$key] = [
            'name' => $component['name'],
            'base_amount' => round($baseAmount, 2),
            'adjusted_amount' => round($adjustedAmount, 2),
            'attendance_factor' => $attendanceFactor,
            'adjustment' => round($adjustedAmount - $baseAmount, 2),
            'type' => $component['type']
        ];
    }

    return $adjustedComponents;
}
```

**Attendance Factor Calculation**:

```php
// In InvoiceController or AttendanceUpload processing
$totalDays = getTotalDaysForPayBasis($payBasis, $month, $year);
$daysWorked = $attendanceRecord->days_worked;
$attendanceFactor = min($daysWorked / $totalDays, 1.0); // Cap at 100%

// Example:
// If calendar_days basis: totalDays = 30, daysWorked = 25
// attendanceFactor = 25/30 = 0.8333 (83.33%)
// Adjusted Salary = Base Salary × 0.8333
```

#### **STEP 6: Calculate Gross Salary**

```php
private function calculateGrossSalary(array $adjustedComponents): float
{
    $gross = 0;
    foreach ($adjustedComponents as $component) {
        $gross += $component['adjusted_amount'];
    }
    return $gross;
}
```

**Example**:

```
Adjusted Components (after 83.33% attendance):
- Basic: 500,000 × 0.8333 = 416,650
- Housing: 100,000 × 0.8333 = 83,330
- Transport: 50,000 × 0.8333 = 41,665

Gross Salary = 416,650 + 83,330 + 41,665 = 541,645
```

#### **STEP 7: Calculate Statutory Deductions**

```php
private function calculateStatutoryDeductions(
    InvoiceTemplate $template,
    float $grossSalary,
    array $adjustedComponents,
    array $attendanceContext = []
): array {
    $deductions = [];

    foreach ($template->statutory_components as $key => $deduction) {
        if (!$deduction['enabled']) {
            continue;
        }

        $amount = 0;

        switch ($deduction['type']) {
            case 'fixed':
                // Convert annual to monthly
                $annualAmount = floatval($deduction['rate']);
                $amount = $annualAmount / ($template->annual_division_factor ?? 12);
                break;

            case 'fixed_monthly':
                // Already monthly
                $amount = floatval($deduction['rate']);
                break;

            case 'percentage':
                // Percentage of gross
                $amount = ($grossSalary * floatval($deduction['rate'])) / 100;
                break;

            case 'formula':
                // Evaluate formula with components and gross
                $amount = $this->calculateFormulaDeduction(
                    $deduction,
                    $grossSalary,
                    $adjustedComponents
                );
                break;

            case 'prorated_annual':
                // Prorate annual amount by attendance
                $amount = $this->calculateProratedAnnualDeduction(
                    $deduction,
                    $attendanceContext
                );
                break;
        }

        $deductions[$key] = round($amount, 2);
    }

    return $deductions;
}
```

**Statutory Deduction Examples**:

```
1. PAYE (Percentage):
   - Rate: 7%
   - Calculation: 7% × Gross Salary = 7% × 541,645 = 37,915

2. Pension (Formula):
   - Rate: 8%
   - Formula: "8 * (Basic + Housing + Transport)"
   - Pensionable Income = 416,650 + 83,330 + 41,665 = 541,645
   - Calculation: 8% × 541,645 = 43,332

3. NHF (Percentage):
   - Rate: 2.5%
   - Calculation: 2.5% × 541,645 = 13,541

4. NSITF (Fixed):
   - Rate: ₦200/month
   - Calculation: 200

Total Deductions = 37,915 + 43,332 + 13,541 + 200 = 95,988
```

#### **STEP 8: Recalculate Aggregate Formulas**

```php
private function recalculateAggregateFormulas(
    array $adjustedComponents,
    float $grossSalary,
    array $statutoryDeductions,
    InvoiceTemplate $template
): array {
    // Add gross salary to components for formula calculation
    $adjustedComponents['gross_salary'] = [
        'name' => 'GROSS_SALARY',
        'adjusted_amount' => $grossSalary,
        'rate' => $grossSalary
    ];

    $maxIterations = 3;
    $iteration = 0;

    do {
        $formulasCalculated = 0;
        $iteration++;

        foreach ($adjustedComponents as $key => &$component) {
            if (isset($component['type']) && $component['type'] === 'formula') {
                // Get formula from template
                $formula = $this->getComponentFormula($template, $key);

                if ($formula) {
                    // Evaluate with all data (components + deductions)
                    $calculatedValue = $this->evaluateFormula(
                        $formula,
                        $adjustedComponents,
                        $statutoryDeductions
                    );

                    if ($calculatedValue !== false) {
                        $component['adjusted_amount'] = $calculatedValue;
                        $formulasCalculated++;
                    }
                }
            }
        }
    } while ($formulasCalculated > 0 && $iteration < $maxIterations);

    return $adjustedComponents;
}
```

**Purpose**: Some aggregate components reference deductions or other aggregates. This step recalculates them with all data available.

**Example**:

```
Template has component:
- Total Deductions: Formula = "SUM(PAYE, Pension, NHF, NSITF)"

After Step 7:
- PAYE = 37,915
- Pension = 43,332
- NHF = 13,541
- NSITF = 200

Recalculation:
Total Deductions = 37,915 + 43,332 + 13,541 + 200 = 95,988
```

#### **STEP 9: Calculate Final Amounts**

```php
// Net Salary = Gross - Total Deductions
$netSalary = $grossSalary - array_sum($statutoryDeductions);

// Credit to Bank = Gross + Total Deductions
// (Amount client pays, includes employee's salary + employer's statutory remittances)
$creditToBank = $grossSalary + array_sum($statutoryDeductions);
```

**Example**:

```
Gross Salary: 541,645
Total Deductions: 95,988

Net Salary: 541,645 - 95,988 = 445,657 (employee receives)
Credit to Bank: 541,645 + 95,988 = 637,633 (client pays)
```

#### **STEP 10: Return Calculation Result**

```php
return [
    'employee_id' => $employee->id,
    'employee_code' => $employee->employee_code,
    'employee_name' => $employee->full_name,
    'client_id' => $clientId,
    'template_id' => $template->id,
    'template_name' => $template->template_name,
    'pay_grade_structure_id' => $employee->pay_grade_structure_id,
    'attendance_factor' => round($attendanceFactor, 4),
    'base_components' => $baseComponents,
    'adjusted_components' => $adjustedComponents,
    'gross_salary' => round($grossSalary, 2),
    'statutory_deductions' => $statutoryDeductions,
    'net_salary' => round($netSalary, 2),
    'credit_to_bank' => round($creditToBank, 2),
    'template_validation' => 'valid',
    'calculated_at' => now()->toDateTimeString()
];
```

### 4.3 Invoice-Level Calculations

After calculating each employee's salary, the invoice-level aggregations are:

```php
// In InvoiceGenerationService
$totals = [
    'total_employees' => count($payrollData),
    'gross_payroll' => 0,
    'total_deductions' => 0,
    'net_payroll' => 0
];

foreach ($payrollData as $item) {
    $calc = $item['calculation'];
    $totals['gross_payroll'] += $calc['gross_salary'];
    $totals['total_deductions'] += array_sum($calc['statutory_deductions']);
    $totals['net_payroll'] += $calc['net_salary'];
}

// Management Fee (7% of net payroll)
$managementFee = $totals['net_payroll'] * 0.07;

// VAT (7.5% of management fee)
$vatAmount = $managementFee * 0.075;

// WHT (if applicable, provided by user)
$whtAmount = $options['wht_amount'] ?? 0;

// Total Invoice Amount
$totalInvoiceAmount = $totals['net_payroll'] + $managementFee + $vatAmount - $whtAmount;
```

**Example Invoice Total**:

```
10 Employees
Gross Payroll: ₦5,416,450
Total Deductions: ₦959,880
Net Payroll: ₦4,456,570

Management Fee (7%): ₦311,960
VAT on Management Fee (7.5%): ₦23,397
WHT: ₦0

TOTAL INVOICE AMOUNT: ₦4,791,927
```

---

## 5. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE SETUP FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Admin → InvoiceManagement (Frontend)
  ↓
  ├─> Selects Client
  ├─> Selects Pay Grade Structure
  ├─> Defines Custom Components (Salary)
  │   - Basic, Housing, Transport, etc.
  │   - Sets rates (annual) and types (fixed/formula/prorated)
  ├─> Defines Statutory Components (Deductions)
  │   - PAYE, Pension, NHF, NSITF, etc.
  │   - Sets rates and calculation methods
  ├─> Clicks "Save Template"
  ↓
POST /api/invoice-templates
  ↓
InvoiceTemplateController::store()
  ↓
  ├─> Validates template structure
  ├─> Creates InvoiceTemplate record
  ├─> Saves custom_components (JSON)
  ├─> Saves statutory_components (JSON)
  ↓
Database: invoice_templates table
  ↓
Returns template ID to frontend


┌─────────────────────────────────────────────────────────────────┐
│                   ATTENDANCE UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Admin → InvoiceManagement (Frontend)
  ↓
  ├─> Uploads Excel file (employee attendance)
  ├─> Selects Client
  ↓
POST /api/attendance/upload
  ↓
InvoiceController::uploadAttendanceFile()
  ↓
AttendanceFileProcessingService::processAttendanceFile()
  ↓
  ├─> Reads Excel using PhpSpreadsheet
  ├─> Validates employee IDs against Staff table
  ├─> Validates pay grade structures
  ├─> Creates AttendanceUpload record
  ├─> Creates AttendanceRecord for each employee
  │   - employee_id, employee_name, days_worked, payroll_month
  ↓
Database: attendance_uploads, attendance_records tables
  ↓
Returns upload ID and processing results


┌─────────────────────────────────────────────────────────────────┐
│                   INVOICE GENERATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

Admin → InvoiceManagement (Frontend)
  ↓
  ├─> Selects Attendance Upload
  ├─> Chooses Invoice Type (detailed/summary)
  ├─> Clicks "Generate Invoice"
  ↓
POST /api/invoices/generate
  ↓
InvoiceController::generate()
  ↓
InvoiceGenerationService::generateInvoice()
  ↓
  ├─> Load AttendanceUpload with attendanceRecords
  ├─> Load Client
  ├─> FOR EACH AttendanceRecord:
  │     ↓
  │   TemplateBasedCalculationService::calculateFromTemplate()
  │     ↓
  │     ├─> Get Template (client_id + pay_grade_structure_id)
  │     ├─> Extract Custom Components
  │     ├─> Calculate Formula Components
  │     ├─> Apply Attendance Factor
  │     ├─> Calculate Gross Salary
  │     ├─> Calculate Statutory Deductions
  │     ├─> Recalculate Aggregate Formulas
  │     ├─> Calculate Net Salary
  │     ├─> Calculate Credit to Bank
  │     ↓
  │   Returns employee calculation result
  │     ↓
  ├─> Aggregate totals (gross, deductions, net)
  ├─> Calculate Management Fee (7%)
  ├─> Calculate VAT (7.5%)
  ├─> Apply WHT
  ├─> Generate Invoice Number
  ├─> Create GeneratedInvoice record
  ├─> Create InvoiceLineItem for each employee (if detailed)
  ↓
Database: generated_invoices, invoice_line_items tables
  ↓
Returns invoice with line items to frontend


┌─────────────────────────────────────────────────────────────────┐
│                      EXCEL EXPORT FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Admin → Clicks "Export to Excel"
  ↓
GET /api/invoices/{id}/export-excel
  ↓
InvoiceController::exportExcel()
  ↓
InvoiceExcelExportService::exportInvoice()
  ↓
  ├─> Load Invoice with lineItems and attendanceUpload
  ├─> Create PhpSpreadsheet object
  ├─> Add "Invoice Summary" sheet
  │   - Header info (invoice number, client, date)
  │   - Payroll summary (gross, deductions, net)
  │   - Fees (management fee, VAT, WHT)
  │   - Total invoice amount
  ├─> Add "Employee Details" sheet
  │   - Dynamic columns based on template components
  │   - Row for each employee with calculated amounts
  ├─> Add "Calculation Breakdown" sheet
  │   - Detailed calculation for sample employee
  │   - Component breakdown
  │   - Statutory deductions breakdown
  ↓
Returns StreamedResponse (Excel download)
  ↓
User downloads multi-sheet Excel file
```

---

## 6. DATABASE SCHEMA

### invoice_templates

```sql
CREATE TABLE invoice_templates (
    id VARCHAR(36) PRIMARY KEY,
    client_id INT NOT NULL,
    pay_grade_structure_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    custom_components JSON NOT NULL,           -- Salary components
    statutory_components JSON NOT NULL,        -- Deduction components
    calculation_rules JSON,
    annual_division_factor DECIMAL(10,2) DEFAULT 12.00,
    use_credit_to_bank_model BOOLEAN DEFAULT FALSE,
    service_fee_percentage DECIMAL(5,2),
    attendance_calculation_method VARCHAR(50) DEFAULT 'calendar_days',
    prorate_salary BOOLEAN DEFAULT TRUE,
    minimum_attendance_factor DECIMAL(5,4),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (pay_grade_structure_id) REFERENCES pay_grade_structures(id),
    UNIQUE KEY unique_client_grade (client_id, pay_grade_structure_id, is_default)
);
```

**custom_components JSON Structure**:

```json
[
  {
    "id": "basic",
    "name": "Basic Salary",
    "rate": 6000000,
    "type": "fixed",
    "annual_division_factor": 12
  },
  {
    "id": "housing",
    "name": "Housing Allowance",
    "rate": 0,
    "type": "formula",
    "formula": "20 * Basic",
    "calculation_type": "formula",
    "components": ["basic"]
  },
  {
    "id": "transport",
    "name": "Transport Allowance",
    "rate": 0,
    "type": "formula",
    "formula": "10 * Basic",
    "calculation_type": "formula",
    "components": ["basic"]
  },
  {
    "id": "leave_allowance",
    "name": "Leave Allowance",
    "rate": 360000,
    "type": "prorated_annual",
    "annual_division_factor": 12
  }
]
```

**statutory_components JSON Structure**:

```json
[
  {
    "id": "paye",
    "name": "PAYE",
    "enabled": true,
    "rate": 7,
    "type": "percentage",
    "calculation_type": "percentage"
  },
  {
    "id": "pension",
    "name": "Pension",
    "enabled": true,
    "rate": 8,
    "type": "formula",
    "formula": "8 * (Basic + Housing + Transport)",
    "calculation_type": "formula",
    "components": ["basic", "housing", "transport"]
  },
  {
    "id": "nhf",
    "name": "NHF",
    "enabled": true,
    "rate": 2.5,
    "type": "percentage",
    "calculation_type": "percentage"
  },
  {
    "id": "nsitf",
    "name": "NSITF",
    "enabled": true,
    "rate": 2400,
    "type": "fixed",
    "calculation_type": "fixed"
  }
]
```

### generated_invoices

```sql
CREATE TABLE generated_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_id INT NOT NULL,
    attendance_upload_id INT NOT NULL,
    invoice_month DATE NOT NULL,
    invoice_type VARCHAR(50) NOT NULL,           -- 'with_schedule' or 'without_schedule'
    total_employees INT NOT NULL,
    gross_payroll DECIMAL(15,2) NOT NULL,
    total_deductions DECIMAL(15,2) NOT NULL,
    net_payroll DECIMAL(15,2) NOT NULL,
    management_fee DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL,
    wht_amount DECIMAL(15,2) DEFAULT 0,
    total_invoice_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'generated',       -- 'generated', 'sent', 'paid'
    excel_file_path VARCHAR(255),
    calculation_breakdown JSON,
    generated_by INT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id)
);
```

### invoice_line_items

```sql
CREATE TABLE invoice_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    generated_invoice_id INT NOT NULL,
    attendance_record_id INT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    days_worked INT NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL,
    gross_pay DECIMAL(15,2) NOT NULL,
    paye_deduction DECIMAL(15,2) DEFAULT 0,
    nhf_deduction DECIMAL(15,2) DEFAULT 0,
    nsitf_deduction DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) NOT NULL,
    net_pay DECIMAL(15,2) NOT NULL,
    allowances_breakdown JSON,
    deductions_breakdown JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (generated_invoice_id) REFERENCES generated_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id)
);
```

### attendance_uploads

```sql
CREATE TABLE attendance_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    payroll_month DATE NOT NULL,
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    processing_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### attendance_records

```sql
CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_upload_id INT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    payroll_month DATE NOT NULL,
    days_worked INT NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances JSON,
    deductions JSON,
    status VARCHAR(50) DEFAULT 'processed',          -- 'processed', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (attendance_upload_id) REFERENCES attendance_uploads(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_upload (attendance_upload_id)
);
```

---

## 7. KEY FILES AND THEIR ROLES

### Backend (Laravel)

#### Controllers

| File                            | Purpose                           | Key Methods                                                                           |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `InvoiceTemplateController.php` | Template CRUD operations          | `index()`, `store()`, `update()`, `destroy()`, `importFromExcel()`, `exportToExcel()` |
| `InvoiceController.php`         | Invoice generation and management | `generate()`, `exportExcel()`, `uploadAttendanceFile()`, `index()`, `show()`          |

#### Services

| File                                  | Purpose                      | Key Methods                                                                           |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| `TemplateBasedCalculationService.php` | **Core calculation engine**  | `calculateFromTemplate()`, `evaluateFormula()`, `calculateStatutoryDeductions()`      |
| `InvoiceGenerationService.php`        | Invoice orchestration        | `generateInvoice()`, `calculateInvoiceTotals()`, `generateInvoiceNumber()`            |
| `InvoiceExcelExportService.php`       | Excel export                 | `exportInvoice()`, `populateEmployeeDetailsSheet()`, `getTemplateBasedEmployeeData()` |
| `ExcelTemplateImporter.php`           | Excel import                 | `importFromExcel()`, `previewExcelTemplate()`, `generateSampleTemplate()`             |
| `AttendanceFileProcessingService.php` | Attendance upload processing | `processAttendanceFile()`, `validateEmployees()`                                      |

#### Models

| File                   | Purpose                | Key Relationships                                                              |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| `InvoiceTemplate.php`  | Template definition    | `belongsTo(Client)`, `belongsTo(PayGradeStructure)`                            |
| `GeneratedInvoice.php` | Invoice header         | `belongsTo(Client)`, `belongsTo(AttendanceUpload)`, `hasMany(InvoiceLineItem)` |
| `InvoiceLineItem.php`  | Invoice line detail    | `belongsTo(GeneratedInvoice)`, `belongsTo(AttendanceRecord)`                   |
| `AttendanceUpload.php` | Attendance file upload | `belongsTo(Client)`, `hasMany(AttendanceRecord)`, `hasMany(GeneratedInvoice)`  |
| `AttendanceRecord.php` | Employee attendance    | `belongsTo(AttendanceUpload)`, `belongsTo(Staff)`                              |

#### Routes

| File                   | Endpoints                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `invoicing-routes.php` | `/api/invoices/*`, `/api/invoice-templates/*`, `/api/attendance/*` |

### Frontend (Next.js/React)

#### Main Components

| File                       | Purpose                               |
| -------------------------- | ------------------------------------- |
| `InvoiceManagement.jsx`    | Main invoicing hub, tab orchestration |
| `TemplateSetupTab.jsx`     | Template configuration UI             |
| `InvoiceGenerationTab.jsx` | Invoice generation UI                 |
| `GeneratedInvoicesTab.jsx` | Invoice list and management           |
| `EnhancedUploadTab.jsx`    | Attendance file upload UI             |

#### Sub-Components

| File                            | Purpose                   |
| ------------------------------- | ------------------------- |
| `TemplateSetupSection.jsx`      | Template form builder     |
| `InvoiceViewModal.jsx`          | Invoice detail modal      |
| `InvoiceLineItemsTable.jsx`     | Employee line items table |
| `AttendanceUploadComponent.jsx` | File upload component     |

#### Services

| File                                  | Purpose            |
| ------------------------------------- | ------------------ |
| `invoicing/invoiceApiService.js`      | Invoice API calls  |
| `invoicing/invoiceTemplateService.js` | Template API calls |

---

## 8. CRITICAL ISSUES AND TECHNICAL DEBT

### 8.1 Architecture Issues

#### **1. Tight Coupling Between Services**

- `InvoiceGenerationService` directly calls `TemplateBasedCalculationService`
- No clear separation of concerns
- Difficult to test in isolation

**Impact**: Hard to maintain, extend, or replace calculation logic

#### **2. Mixed Calculation Approaches**

- Old `PayrollCalculationService` still exists alongside `TemplateBasedCalculationService`
- Some endpoints use old service, others use new
- Causes confusion and potential calculation inconsistencies

**Evidence**:

```php
// InvoiceController has methods for both:
- generateAttendanceBasedInvoice() // Uses AttendanceBasedPayrollService
- generate() // Uses InvoiceGenerationService + TemplateBasedCalculationService
```

#### **3. Incomplete Transition to Template-Based System**

- Some hardcoded values still exist
- Not all calculation paths use templates
- Legacy code paths remain active

### 8.2 Calculation Logic Issues

#### **1. Formula Evaluation Security Risk**

- Uses PHP `eval()` to execute formulas
- Potential code injection vulnerability
- No sandboxed execution environment

**Code**:

```php
// In TemplateBasedCalculationService.php
$result = eval("return $evaluableFormula;");
```

**Risk**: Malicious formula like `"system('rm -rf /')"` could be executed

**Recommendation**: Replace with safe math parser library (e.g., `myclabs/php-enum`, `symfony/expression-language`)

#### **2. Circular Dependency Risk in Formulas**

- Formula components can reference each other
- Limited iteration protection (maxIterations = 5)
- No cycle detection algorithm

**Example of Potential Issue**:

```
Component A: Formula = "B + 100"
Component B: Formula = "A + 50"
```

**Current Handling**: Iteration limit prevents infinite loop, but results may be incorrect

#### **3. Inconsistent Rounding**

- Some calculations use `round($value, 2)`
- Others use implicit float precision
- Can cause totals to not match sum of line items

#### **4. Attendance Factor Calculation Ambiguity**

- Different pay bases (calendar_days vs working_days)
- Not all clients have consistent configuration
- Calculation spread across multiple services

### 8.3 Data Integrity Issues

#### **1. No Template Versioning**

- Templates can be modified after invoices are generated
- No historical record of template at time of generation
- Invoice recalculation would give different results

**Impact**: Audit trail problems, compliance issues

**Recommendation**: Implement template versioning, store template snapshot with each invoice

#### **2. Missing Foreign Key Constraints**

- Some relationships lack database-level enforcement
- Orphaned records possible
- Data integrity not guaranteed

#### **3. JSON Column Schema Validation**

- `custom_components` and `statutory_components` are JSON
- No database-level schema validation
- Application-level validation inconsistent

### 8.4 Performance Issues

#### **1. N+1 Query Problem**

- Invoice generation loops through attendance records
- Each iteration queries template separately
- Should batch-load templates by client+grade combinations

**Code**:

```php
foreach ($attendanceRecords as $record) {
    // This queries DB every iteration
    $template = $this->getTemplateForEmployee($record->staff, $clientId);
    // ...
}
```

**Recommendation**: Pre-load all templates for client, cache in memory

#### **2. Excel Export Performance**

- Generates entire spreadsheet in memory
- Large invoices (100+ employees) can timeout
- No streaming/chunking implementation

#### **3. No Caching Strategy**

- Templates fetched from DB every time
- Calculation results not cached
- Could use Redis/Memcached for frequently accessed data

### 8.5 User Experience Issues

#### **1. No Draft Invoices**

- Invoice generation is final
- No preview before saving
- Can't save partial progress

#### **2. Limited Error Handling**

- Generic error messages
- No granular validation feedback
- Hard to debug template setup errors

#### **3. No Bulk Operations**

- Can't generate multiple invoices at once
- No batch Excel export
- Manual process for each client

### 8.6 Code Quality Issues

#### **1. Large Monolithic Classes**

- `TemplateBasedCalculationService` is 750+ lines
- `InvoiceExcelExportService` is 800+ lines
- Violates Single Responsibility Principle

**Recommendation**: Split into smaller, focused classes

#### **2. Inconsistent Naming**

- `custom_components` vs `customComponents` vs `custom`
- `statutory_deductions` vs `statutoryComponents`
- Causes confusion in data mapping

#### **3. Missing Unit Tests**

- No tests for calculation logic
- No tests for formula evaluation
- High risk of regression bugs

#### **4. Inadequate Logging**

- Critical calculation steps not logged
- Difficult to debug production issues
- No audit trail for financial calculations

### 8.7 Security Issues

#### **1. Authorization Gaps**

- No role-based access control for templates
- Any authenticated user can modify templates
- No approval workflow

#### **2. Sensitive Data Exposure**

- Salary information in logs
- No data masking in error messages
- API responses include full calculation details

#### **3. Missing Input Validation**

- Formula strings not sanitized
- Component names allow special characters
- Potential XSS in frontend displays

---

## CONCLUSION

The current invoice generation system is **functional but fragile**. It successfully generates invoices from templates with complex calculations, but has significant technical debt and architectural issues that must be addressed before any overhaul.

**Key Strengths**:

- ✅ Dynamic template-based system (no hardcoding)
- ✅ Supports complex formulas and multi-level dependencies
- ✅ Handles multiple component types (fixed, formula, prorated)
- ✅ Excel import/export functionality
- ✅ Multi-sheet invoice exports

**Critical Weaknesses**:

- ❌ Security vulnerability (eval() usage)
- ❌ No template versioning (audit trail issues)
- ❌ Performance issues (N+1 queries, no caching)
- ❌ Mixed calculation approaches (old vs new services)
- ❌ Large monolithic classes (maintainability)
- ❌ No unit tests (regression risk)

**Recommendations for Overhaul**:

1. **Replace eval() with safe math parser**
2. **Implement template versioning and snapshots**
3. **Add comprehensive unit tests**
4. **Optimize DB queries and add caching**
5. **Split large services into smaller classes**
6. **Remove legacy PayrollCalculationService**
7. **Add role-based access control**
8. **Implement draft invoice functionality**
9. **Add detailed audit logging**
10. **Standardize naming conventions**

This breakdown provides a complete understanding of the current system, enabling informed decisions for the planned overhaul.
