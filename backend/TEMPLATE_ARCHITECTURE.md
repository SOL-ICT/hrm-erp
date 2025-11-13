# Template Architecture Documentation

## Overview

This document clarifies the template system architecture and the role of each template type.

## Template Tables

### 1. `invoice_templates` (PRIMARY - Salary Calculations)

**Purpose:** Store client-specific salary calculation templates with all payment components

**Usage:**

-   Defines how to calculate employee salaries
-   Contains 4 JSON columns for different component categories
-   Used by salary calculation engine
-   Used by export templates to reference components

**Columns:**

-   `custom_components` - Salary & Allowances (Basic, Housing, Transport, etc.)
-   `employer_costs` - Employer Statutory Costs (Medical Insurance, ITF, ECA, Fidelity, etc.)
-   `statutory_components` - Employee Statutory Deductions (Pension, PAYE, NHIS, etc.)
-   `management_fees` - Management/Service Fees (Service fee, VAT, WHT)

**Key Fields:**

-   `client_id` - Client-specific
-   `pay_grade_structure_id` - Pay grade specific
-   Component categorization by employment cost type

**Migration:** `2025_09_29_135457_create_invoice_templates_table.php` + `2025_10_15_121247_add_employer_costs_and_management_fees_to_invoice_templates_table.php`

---

### 2. `export_templates` (SECONDARY - Invoice Formatting)

**Purpose:** Store client-specific invoice layout and formatting rules

**Usage:**

-   Defines how invoices are displayed/exported
-   References components from `invoice_templates`
-   Specifies line items, groupings, styling
-   Used ONLY for invoice presentation, NOT calculations

**Key Fields:**

-   `client_id` - Client-specific (no pay grade)
-   `line_items` - JSON array defining invoice structure
-   `column_mappings` - How to map data to columns
-   `formatting_rules` - Display rules
-   `styling_config` - Visual styling

**Migration:** `2025_10_14_125252_create_export_templates_table.php`

---

### 3. `calculation_templates` (DEPRECATED - Do Not Use)

**Purpose:** Originally intended for reusable generic templates by pay grade code

**Status:** ⚠️ DEPRECATED - Redundant with invoice_templates

**Why Deprecated:**

-   Functionality fully covered by `invoice_templates`
-   Only has `pay_grade_code`, lacks client specificity
-   Causes confusion with duplicate data
-   No UI implementation

**Recommendation:** Ignore this table, use `invoice_templates` instead

**Migration:** `2025_10_14_125241_create_calculation_templates_table.php`

---

## Component Categories

### Salary & Allowances (`custom_components`)

Regular employee compensation:

-   Basic Salary
-   Housing Allowance
-   Transport Allowance
-   Utility Allowance
-   Education Allowance
-   Medical Allowance
-   Meal Allowance
-   13th Month Bonus
-   Annual Leave Allowance

### Employer Costs (`employer_costs`)

Statutory costs paid by employer (NOT deducted from employee):

-   Medical Insurance & Expenses
-   Industrial Training Fund (ITF)
-   Education & Culture Association (ECA)
-   Fidelity Guarantee Insurance
-   Background Check Fees
-   Operational Expenses
-   Any employer-only statutory contributions

### Statutory Deductions (`statutory_components`)

Deductions from employee salary:

-   Pension Contribution (8% employee portion)
-   PAYE Tax
-   NHIS (National Health Insurance)
-   NSITF (Nigeria Social Insurance Trust Fund)
-   Salary Advance Repayment
-   Loan Repayments
-   Disciplinary Deductions

### Management Fees (`management_fees`)

Service fees for outsourcing company:

-   Management Service Fee (usually 7-10% of gross)
-   VAT on Management Fee (7.5%)
-   WHT on Management Fee (5%)

---

## Section Totals (Computed Components)

The export template builder now includes computed section totals that automatically sum components from each category:

### Available Section Totals:

1. **TOTAL_SALARY_AND_ALLOWANCES** - Sum of all custom_components
2. **TOTAL_EMPLOYER_COSTS** - Sum of all employer_costs
3. **TOTAL_STATUTORY_DEDUCTIONS** - Sum of all statutory_components
4. **TOTAL_MANAGEMENT_FEES** - Sum of all management_fees
5. **GRAND_TOTAL** - Sum of all 4 categories
6. **TOTAL_COST_TO_CLIENT** - Salary + Employer Costs + Management Fees (excludes employee deductions)

These can be used in export template line items with `formula_type: "component"` and `depends_on: "TOTAL_EMPLOYER_COSTS"`.

---

## Data Flow

### Import Flow (Excel → invoice_templates)

```
Excel Template (.xlsx)
    ↓
ExcelTemplateImporter Service
    ↓
Parse by section headers:
    - "ALLOWANCES & EARNINGS" → custom_components
    - "Total Outsourcing & Statutory Cost" → employer_costs
    - "STATUTORY DEDUCTIONS" → statutory_components
    - "MANAGEMENT FEES" → management_fees
    ↓
Save to invoice_templates table
```

### Export Template Flow (invoice_templates → export_templates)

```
invoice_templates (salary calculation)
    ↓
Load components + section totals
    ↓
ExportTemplateBuilder UI
    ↓
User configures line items with:
    - Component references
    - Formulas (percentage, sum, fixed)
    - Groupings and layout
    ↓
Save to export_templates table
    ↓
Invoice generation uses export template for presentation
```

---

## Best Practices

### ✅ DO:

-   Use `invoice_templates` for ALL salary calculation logic
-   Use `export_templates` for invoice layout and formatting
-   Categorize components by employment cost type (4 categories)
-   Reference components from invoice_templates in export templates
-   Use section totals for aggregate calculations

### ❌ DON'T:

-   Don't use `calculation_templates` (deprecated)
-   Don't store calculation logic in export_templates
-   Don't mix component categories (keep them properly categorized)
-   Don't calculate salaries in the export layer

---

## Excel Import Section Headers

When importing Excel templates, the following section headers are recognized:

**Salary Components:**

-   "ALLOWANCES & EARNINGS"
-   "ALLOWANCES AND EARNINGS"
-   "EARNINGS & ALLOWANCES"
-   "SALARY COMPONENTS"

**Employer Costs:**

-   "TOTAL OUTSOURCING & STATUTORY COST"
-   "TOTAL OUTSOURCING AND STATUTORY COST"
-   "OUTSOURCING & STATUTORY COST"
-   "EMPLOYER COSTS"
-   "EMPLOYER CONTRIBUTIONS"

**Statutory Deductions:**

-   "STATUTORY DEDUCTIONS"
-   "EMPLOYEE DEDUCTIONS"
-   "EMPLOYEE STATUTORY DEDUCTIONS"

**Management Fees:**

-   "MANAGEMENT FEES"
-   "MANAGEMENT FEE"
-   "SERVICE FEES"

**Skipped Sections:**

-   "SUMMARY" - Calculated fields, not stored
-   "EXPENSES" - May be subsection, handled contextually

---

## API Endpoints

### Invoice Templates

-   `GET /api/invoice-templates` - List templates (filter by client_id)
-   `POST /api/invoice-templates/import-excel` - Import from Excel
-   `POST /api/invoice-templates/preview-excel` - Preview before import
-   `GET /api/invoice-templates/{id}` - Get specific template

### Export Templates

-   `GET /api/v2/export-templates/by-client/{clientId}` - Get client's export template
-   `POST /api/v2/export-templates` - Create export template
-   `PUT /api/v2/export-templates/{id}` - Update export template

---

## Future Enhancements

Consider implementing:

1. Template versioning for audit trail
2. Template cloning across clients
3. Template validation rules
4. Formula builder UI with visual editor
5. Backend calculation engine for section totals
6. Template preview with sample data

---

Last Updated: October 15, 2025
