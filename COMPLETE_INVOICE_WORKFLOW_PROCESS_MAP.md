# 🔄 COMPLETE INVOICE WORKFLOW PROCESS MAP

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HRM-ERP INVOICE SYSTEM                             │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   CALCULATION   │    │     EXPORT      │    │      INVOICE            │  │
│  │   TEMPLATES     │    │   TEMPLATES     │    │    GENERATION           │  │
│  │                 │    │                 │    │                         │  │
│  │ Per Pay Grade   │────│   Per Client    │────│  Excel Output           │  │
│  │ (HOW to calc)   │    │ (WHAT to show)  │    │  2 Sheets               │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 User Journey: Complete Setup to Invoice

### PHASE 1: CALCULATION TEMPLATE SETUP (Per Pay Grade)

**Purpose**: Define HOW to calculate individual staff salaries

```
Step 1A: Upload Salary Components (Bulk)
┌──────────────────────────────────────────────────────────────┐
│ 1. Navigate to: HR & Payroll → Template Setup → Upload       │
│ 2. Download sample Excel template                            │
│ 3. Fill in components for ALL pay grades:                    │
│    ┌─────────────────────────────────────────────────────┐   │
│    │ CLIENT: Fiducia Corp                                │   │
│    │                                                     │   │
│    │ SHEET 1: DRIVER1                                    │   │
│    │ basic_salary     │ 500000 │ Fixed amount           │   │
│    │ housing_allowance│ 20%    │ basic_salary * 0.20    │   │
│    │ transport        │ 10%    │ basic_salary * 0.10    │   │
│    │ pension_employee │ 8%     │ basic_salary * 0.08    │   │
│    │                                                     │   │
│    │ SHEET 2: SENIOR_MGR                                 │   │
│    │ basic_salary     │ 2000000│ Fixed amount           │   │
│    │ housing_allowance│ 30%    │ basic_salary * 0.30    │   │
│    │ car_allowance    │ 15%    │ basic_salary * 0.15    │   │
│    │ pension_employee │ 8%     │ basic_salary * 0.08    │   │
│    └─────────────────────────────────────────────────────┘   │
│ 4. Upload Excel file                                         │
│ 5. System creates calculation templates for each grade       │
└──────────────────────────────────────────────────────────────┘

OR

Step 1B: Manual Setup (Individual)
┌──────────────────────────────────────────────────────────────┐
│ 1. Navigate to: HR & Payroll → Template Setup → Clients      │
│ 2. Select Fiducia → Select DRIVER1                           │
│ 3. Click "Setup Template"                                    │
│ 4. Visual Template Builder opens:                            │
│    • Drag & drop salary components                           │
│    • Edit formulas                                           │
│    • Test with Live Preview                                  │
│    • Save template                                           │
│ 5. Repeat for each pay grade (SENIOR_MGR, etc.)              │
└──────────────────────────────────────────────────────────────┘

Result: ✅ Calculation templates ready for ALL pay grades
```

### PHASE 2: EXPORT TEMPLATE SETUP (Per Client)

**Purpose**: Define WHAT appears on the final invoice Excel

```
Step 2: Setup Export Template (Once per Client)
┌──────────────────────────────────────────────────────────────┐
│ 1. Navigate to: HR & Payroll → Export Templates              │
│ 2. Select Fiducia Corp                                       │
│ 3. Click "Setup Export Template"                             │
│ 4. Export Template Builder opens:                            │
│    ┌─────────────────────────────────────────────────────┐   │
│    │ Line Item 1: Total Staff Cost                       │   │
│    │ • Type: Component Sum                               │   │
│    │ • Formula: Sum all gross salaries                  │   │
│    │                                                     │   │
│    │ Line Item 2: Management Fee                         │   │
│    │ • Type: Percentage                                  │   │
│    │ • Formula: 10% of Total Staff Cost                 │   │
│    │                                                     │   │
│    │ Line Item 3: VAT on Management Fee                  │   │
│    │ • Type: Percentage                                  │   │
│    │ • Formula: 7.5% of Management Fee                  │   │
│    │                                                     │   │
│    │ Line Item 4: Invoice Total                          │   │
│    │ • Type: Sum                                         │   │
│    │ • Formula: Total Staff + Mgmt Fee + VAT            │   │
│    └─────────────────────────────────────────────────────┘   │
│ 5. Configure Excel settings:                                 │
│    • Include Summary Sheet ✓                                 │
│    • Include Breakdown Sheet ✓                               │
│    • Company Header ✓                                        │
│ 6. Save Export Template                                      │
└──────────────────────────────────────────────────────────────┘

Result: ✅ Export template ready for Fiducia (applies to ALL grades)
```

### PHASE 3: INVOICE GENERATION

**Purpose**: Generate actual invoices with 2-sheet Excel output

```
Step 3: Generate Invoice
┌──────────────────────────────────────────────────────────────┐
│ 1. Navigate to: HR & Payroll → Invoice Generation            │
│ 2. Select:                                                   │
│    • Client: Fiducia Corp                                    │
│    • Period: October 2025                                    │
│    • Upload attendance Excel                                 │
│ 3. System Process:                                           │
│    ┌─────────────────────────────────────────────────────┐   │
│    │ For Each Employee:                                  │   │
│    │ ├─ Get employee pay grade (DRIVER1, SENIOR_MGR)    │   │
│    │ ├─ Load calculation template for that grade        │   │
│    │ ├─ Calculate salary using attendance data:         │   │
│    │ │  • Basic: ₦500,000                              │   │
│    │ │  • Housing: ₦100,000 (20%)                      │   │
│    │ │  • Transport: ₦50,000 (10%)                     │   │
│    │ │  • Gross: ₦650,000                              │   │
│    │ │  • Pension: ₦40,000 (8%)                        │   │
│    │ │  • Net: ₦610,000                                │   │
│    │ └─ Store individual calculation                     │   │
│    │                                                     │   │
│    │ Apply Export Template:                              │   │
│    │ ├─ Total Staff Cost: ₦32,500,000 (50 employees)    │   │
│    │ ├─ Management Fee: ₦3,250,000 (10%)               │   │
│    │ ├─ VAT: ₦243,750 (7.5% of mgmt fee)               │   │
│    │ └─ Invoice Total: ₦35,993,750                      │   │
│    └─────────────────────────────────────────────────────┘   │
│ 4. Generate Excel with 2 sheets:                             │
│    • Sheet 1: SUMMARY (totals for all staff)                 │
│    • Sheet 2: BREAKDOWN (individual staff details)           │
│ 5. Download Excel file                                       │
└──────────────────────────────────────────────────────────────┘

Result: ✅ Final invoice Excel ready for client billing
```

## 📋 Key Differences: Calculation vs Export Templates

### 🧮 CALCULATION TEMPLATES (Step 1)

| Aspect       | Details                                          |
| ------------ | ------------------------------------------------ |
| **Purpose**  | Define HOW to calculate individual salaries      |
| **Scope**    | Per Pay Grade (DRIVER1, SENIOR_MGR, etc.)        |
| **Contains** | Salary components, deductions, formulas          |
| **Setup**    | Multiple templates per client (one per grade)    |
| **Example**  | DRIVER1: Basic ₦500k, Housing 20%, Transport 10% |
| **Used By**  | Internal calculation engine                      |
| **Output**   | Individual staff salary calculations             |

### 📊 EXPORT TEMPLATES (Step 2)

| Aspect       | Details                                      |
| ------------ | -------------------------------------------- |
| **Purpose**  | Define WHAT appears on final invoice         |
| **Scope**    | Per Client (applies to ALL pay grades)       |
| **Contains** | Line items, management fee, VAT, totals      |
| **Setup**    | ONE template per client                      |
| **Example**  | Management Fee 10%, VAT 7.5%, Invoice format |
| **Used By**  | Excel generation system                      |
| **Output**   | Final invoice Excel file                     |

## 🎯 Benefits of This Separation

### ✅ **Efficiency**

- Set up calculation per grade once
- Set up export format per client once
- No duplication of export settings

### ✅ **Flexibility**

- Different clients can have different invoice formats
- Same calculation logic, different presentation
- Easy to modify export without affecting calculations

### ✅ **Scalability**

- Add new pay grades without changing export format
- Add new clients with custom export formats
- Bulk upload components for multiple grades

### ✅ **Consistency**

- All pay grades for a client use same export format
- Management fee and VAT applied consistently
- Professional invoice presentation

## 🔧 Technical Implementation

### Database Tables

```sql
-- Calculation logic (per pay grade)
calculation_templates (
  id, pay_grade_code, client_id,
  allowance_components, deduction_components, statutory_components
)

-- Export formatting (per client)
invoice_export_templates (
  id, client_id, template_name,
  line_items, excel_settings, is_active
)
```

### API Endpoints

```javascript
// Calculation Templates API
GET    /api/calculation-templates/grade/{code}
POST   /api/calculation-templates
PUT    /api/calculation-templates/{id}

// Export Templates API
GET    /api/v2/export-templates/by-client/{clientId}
POST   /api/v2/export-templates
PUT    /api/v2/export-templates/{id}
```

### Frontend Components

```javascript
// For Step 1: Calculation setup
<VisualTemplateBuilder selectedGrade={grade} />

// For Step 2: Export format setup
<ExportTemplateBuilder selectedClient={client} />

// For Step 3: Invoice generation
<InvoiceGeneration />
```

## 🎉 Final Excel Output Structure

### Sheet 1: SUMMARY

```
FIDUCIA CORPORATION - OCTOBER 2025 INVOICE

Total Staff Cost:           ₦32,500,000
Management Fee (10%):       ₦3,250,000
VAT on Management (7.5%):   ₦243,750
─────────────────────────────────────
INVOICE TOTAL:              ₦35,993,750

Staff Count: 50 employees
```

### Sheet 2: BREAKDOWN

```
Employee Name    | Grade     | Basic    | Housing  | Transport | Gross    | Mgmt Fee | VAT     | Total
John Smith      | DRIVER1   | 500,000  | 100,000  | 50,000   | 650,000  | 65,000   | 4,875   | 719,875
Jane Doe        | SENIOR_MGR| 2,000,000| 600,000  | 300,000  | 2,900,000| 290,000  | 21,750  | 3,211,750
...
```

## 🚀 Getting Started

1. **Today**: Build Export Template Builder UI (✅ DONE)
2. **Next**: Test complete workflow with Fiducia
3. **Then**: Add export template to invoice generation
4. **Finally**: Generate first multi-sheet Excel invoice

This system gives you the **separation of concerns** you wanted:

- **Calculation Templates**: Define the math
- **Export Templates**: Define the presentation
- **Invoice Generation**: Combine both for final output

The Export Template Builder is now ready to use! 🎯
