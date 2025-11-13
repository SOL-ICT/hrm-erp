# INVOICE CALCULATION FLOWCHART

## Visual Step-by-Step Calculation Process

```
╔══════════════════════════════════════════════════════════════════════╗
║                    INVOICE GENERATION MASTER FLOW                     ║
╚══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│  STEP 0: PREREQUISITES                                               │
└─────────────────────────────────────────────────────────────────────┘
    │
    ├─> ✓ Template exists for (Client + Pay Grade)
    ├─> ✓ Attendance upload processed
    ├─> ✓ Employees validated against roster
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: LOAD ATTENDANCE DATA                                        │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  SELECT * FROM attendance_records
    │  WHERE attendance_upload_id = ?
    │  AND status = 'processed'
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: FOR EACH EMPLOYEE → START CALCULATION                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Employee: John Doe (EMP001)
    │  Days Worked: 25/30
    │  Client: ABC Corporation
    │  Pay Grade: Senior Manager
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: FETCH TEMPLATE                                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  SELECT * FROM invoice_templates
    │  WHERE client_id = ?
    │  AND pay_grade_structure_id = ?
    │  AND is_active = 1
    │
    ▼
    Template Found:
    ├─> Custom Components (Salary):
    │   ├─ Basic: ₦6,000,000/year (fixed)
    │   ├─ Housing: 20% × Basic (formula)
    │   ├─ Transport: 10% × Basic (formula)
    │   └─ Leave: ₦360,000/year (prorated_annual)
    │
    └─> Statutory Components (Deductions):
        ├─ PAYE: 7% of Gross (percentage)
        ├─ Pension: 8% of Pensionable (formula)
        ├─ NHF: 2.5% of Gross (percentage)
        └─ NSITF: ₦200/month (fixed)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: CONVERT ANNUAL TO MONTHLY RATES                             │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Annual Division Factor: 12
    │
    │  Custom Components (Monthly):
    │  ┌─────────────────┬──────────────┬──────────────┐
    │  │ Component       │ Annual       │ Monthly      │
    │  ├─────────────────┼──────────────┼──────────────┤
    │  │ Basic           │ ₦6,000,000   │ ₦500,000     │
    │  │ Housing         │ (formula)    │ (calculate)  │
    │  │ Transport       │ (formula)    │ (calculate)  │
    │  │ Leave           │ ₦360,000     │ ₦30,000      │
    │  └─────────────────┴──────────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: CALCULATE FORMULA COMPONENTS                                │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Housing: Formula = "20 * Basic"
    │  ├─> Replace "Basic" with 500,000
    │  ├─> Convert percentage: "20 *" → "0.20 *"
    │  ├─> Evaluable: "0.20 * 500000"
    │  └─> Result: ₦100,000
    │
    │  Transport: Formula = "10 * Basic"
    │  ├─> Replace "Basic" with 500,000
    │  ├─> Convert percentage: "10 *" → "0.10 *"
    │  ├─> Evaluable: "0.10 * 500000"
    │  └─> Result: ₦50,000
    │
    │  Base Components (Monthly):
    │  ┌─────────────────┬──────────────┐
    │  │ Component       │ Amount       │
    │  ├─────────────────┼──────────────┤
    │  │ Basic           │ ₦500,000     │
    │  │ Housing         │ ₦100,000     │
    │  │ Transport       │ ₦50,000      │
    │  │ Leave           │ ₦30,000      │
    │  └─────────────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: CALCULATE ATTENDANCE FACTOR                                 │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Pay Calculation Basis: calendar_days
    │  Invoice Month: January 2025
    │  Total Days in Month: 31
    │  Days Worked: 25
    │
    │  Attendance Factor = Days Worked / Total Days
    │                    = 25 / 31
    │                    = 0.8065 (80.65%)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7: APPLY ATTENDANCE FACTOR TO COMPONENTS                       │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Adjusted Components:
    │  ┌─────────────────┬──────────────┬────────┬──────────────┐
    │  │ Component       │ Base Amount  │ Factor │ Adjusted     │
    │  ├─────────────────┼──────────────┼────────┼──────────────┤
    │  │ Basic           │ ₦500,000     │ 0.8065 │ ₦403,250     │
    │  │ Housing         │ ₦100,000     │ 0.8065 │ ₦80,650      │
    │  │ Transport       │ ₦50,000      │ 0.8065 │ ₦40,325      │
    │  │ Leave           │ ₦30,000      │ 0.8065 │ ₦24,195      │
    │  └─────────────────┴──────────────┴────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8: CALCULATE GROSS SALARY                                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Gross Salary = SUM(All Adjusted Components)
    │               = ₦403,250 + ₦80,650 + ₦40,325 + ₦24,195
    │               = ₦548,420
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 9: CALCULATE STATUTORY DEDUCTIONS                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  PAYE (7% of Gross):
    │  └─> 7% × ₦548,420 = ₦38,389
    │
    │  Pension (8% of Pensionable Income):
    │  ├─> Formula: "8 * (Basic + Housing + Transport)"
    │  ├─> Replace: 8 * (403250 + 80650 + 40325)
    │  ├─> Convert: 0.08 * 524225
    │  └─> Result: ₦41,938
    │
    │  NHF (2.5% of Gross):
    │  └─> 2.5% × ₦548,420 = ₦13,711
    │
    │  NSITF (Fixed):
    │  └─> ₦200
    │
    │  Statutory Deductions:
    │  ┌─────────────────┬──────────────┐
    │  │ Deduction       │ Amount       │
    │  ├─────────────────┼──────────────┤
    │  │ PAYE            │ ₦38,389      │
    │  │ Pension         │ ₦41,938      │
    │  │ NHF             │ ₦13,711      │
    │  │ NSITF           │ ₦200         │
    │  ├─────────────────┼──────────────┤
    │  │ TOTAL           │ ₦94,238      │
    │  └─────────────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 10: RECALCULATE AGGREGATE FORMULAS (if any)                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Check for aggregate components that reference deductions
    │  (e.g., "Total Deductions", "Net Before Tax")
    │
    │  In this example: No aggregate components
    │  Skip this step
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 11: CALCULATE FINAL AMOUNTS                                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Net Salary (Employee Receives):
    │  = Gross Salary - Total Deductions
    │  = ₦548,420 - ₦94,238
    │  = ₦454,182
    │
    │  Credit to Bank (Client Pays):
    │  = Gross Salary + Total Deductions
    │  = ₦548,420 + ₦94,238
    │  = ₦642,658
    │
    │  (Note: Credit to Bank includes both employee's net salary
    │   and employer's statutory remittances)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 12: STORE CALCULATION RESULT                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Calculation Result:
    │  {
    │    employee_id: "EMP001",
    │    employee_name: "John Doe",
    │    attendance_factor: 0.8065,
    │    base_components: { ... },
    │    adjusted_components: {
    │      basic: { base_amount: 500000, adjusted_amount: 403250 },
    │      housing: { base_amount: 100000, adjusted_amount: 80650 },
    │      transport: { base_amount: 50000, adjusted_amount: 40325 },
    │      leave: { base_amount: 30000, adjusted_amount: 24195 }
    │    },
    │    gross_salary: 548420,
    │    statutory_deductions: {
    │      paye: 38389,
    │      pension: 41938,
    │      nhf: 13711,
    │      nsitf: 200
    │    },
    │    net_salary: 454182,
    │    credit_to_bank: 642658
    │  }
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 13: REPEAT FOR ALL EMPLOYEES                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Calculate for Employee 2, 3, 4, ... N
    │  Store all results in payrollData array
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 14: AGGREGATE INVOICE TOTALS                                   │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Assuming 10 employees with similar calculations:
    │
    │  ┌─────────────────────┬──────────────┐
    │  │ Metric              │ Total        │
    │  ├─────────────────────┼──────────────┤
    │  │ Total Employees     │ 10           │
    │  │ Gross Payroll       │ ₦5,484,200   │
    │  │ Total Deductions    │ ₦942,380     │
    │  │ Net Payroll         │ ₦4,541,820   │
    │  └─────────────────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 15: CALCULATE INVOICE FEES                                     │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Management Fee (7% of Net Payroll):
    │  = 7% × ₦4,541,820
    │  = ₦317,927
    │
    │  VAT (7.5% of Management Fee):
    │  = 7.5% × ₦317,927
    │  = ₦23,844
    │
    │  WHT (if applicable):
    │  = ₦0 (not provided in this example)
    │
    │  ┌─────────────────────┬──────────────┐
    │  │ Fee                 │ Amount       │
    │  ├─────────────────────┼──────────────┤
    │  │ Management Fee      │ ₦317,927     │
    │  │ VAT                 │ ₦23,844      │
    │  │ WHT                 │ ₦0           │
    │  └─────────────────────┴──────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 16: CALCULATE TOTAL INVOICE AMOUNT                             │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Total Invoice Amount = Net Payroll + Management Fee + VAT - WHT
    │                       = ₦4,541,820 + ₦317,927 + ₦23,844 - ₦0
    │                       = ₦4,883,591
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 17: GENERATE INVOICE NUMBER                                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Format: INV-{ClientCode}-{YYYY}-{MM}-{Sequence}
    │
    │  Client: ABC Corporation → ABC
    │  Year: 2025
    │  Month: 01
    │  Sequence: Check last invoice for ABC in 2025-01
    │    Last: INV-ABC-2025-01-002
    │    New: 003
    │
    │  Invoice Number: INV-ABC-2025-01-003
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 18: CREATE DATABASE RECORDS                                    │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  INSERT INTO generated_invoices:
    │  - invoice_number: "INV-ABC-2025-01-003"
    │  - client_id: 123
    │  - attendance_upload_id: 456
    │  - invoice_month: "2025-01-01"
    │  - invoice_type: "with_schedule"
    │  - total_employees: 10
    │  - gross_payroll: 5484200
    │  - total_deductions: 942380
    │  - net_payroll: 4541820
    │  - management_fee: 317927
    │  - vat_amount: 23844
    │  - wht_amount: 0
    │  - total_invoice_amount: 4883591
    │  - status: "generated"
    │
    │  IF invoice_type == "with_schedule":
    │    INSERT INTO invoice_line_items (for each employee):
    │    - generated_invoice_id
    │    - employee_id, employee_name
    │    - days_worked
    │    - gross_pay, total_deductions, net_pay
    │    - allowances_breakdown (JSON)
    │    - deductions_breakdown (JSON)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 19: GENERATE EXCEL EXPORT (if requested)                       │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Create PhpSpreadsheet with 3 sheets:
    │
    │  Sheet 1: Invoice Summary
    │  ├─ Invoice Header (number, client, date)
    │  ├─ Payroll Summary (gross, deductions, net)
    │  ├─ Fees (management fee, VAT, WHT)
    │  └─ Total Invoice Amount
    │
    │  Sheet 2: Employee Details
    │  ├─ Dynamic columns based on template components
    │  ├─ Row for each employee:
    │  │  EMP001 | John Doe | 25 | 403,250 | 80,650 | ... | 548,420 | 94,238 | 454,182
    │  └─ Totals row at bottom
    │
    │  Sheet 3: Calculation Breakdown
    │  ├─ Sample employee calculation details
    │  ├─ Component-by-component breakdown
    │  └─ Formula explanations
    │
    │  Export as: INV-ABC-2025-01-003_ABC_Corporation_2025_01_Detailed.xlsx
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 20: RETURN RESULT                                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    │  Return to frontend:
    │  {
    │    success: true,
    │    invoice: {
    │      id: 789,
    │      invoice_number: "INV-ABC-2025-01-003",
    │      total_invoice_amount: 4883591,
    │      lineItems: [ ... ]
    │    },
    │    message: "Invoice generated successfully"
    │  }
    │
    ▼
╔══════════════════════════════════════════════════════════════════════╗
║                         PROCESS COMPLETE                              ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## KEY CALCULATION FORMULAS

### 1. Attendance Factor

```
Attendance Factor = Days Worked / Total Days in Month
                  = min(Days Worked / Total Days, 1.0)

Example: 25 days worked in 31-day month
       = 25 / 31 = 0.8065 (80.65%)
```

### 2. Adjusted Component Amount

```
Adjusted Amount = Base Amount × Attendance Factor

Example: Basic Salary = ₦500,000
         Adjusted = ₦500,000 × 0.8065 = ₦403,250
```

### 3. Formula Component Calculation

```
Steps:
1. Parse formula string
2. Replace component names with values
3. Convert percentages (20 * X → 0.20 * X)
4. Evaluate math expression
5. Return result

Example: Housing = "20 * Basic"
         = 0.20 × 500,000 = ₦100,000
```

### 4. Gross Salary

```
Gross Salary = SUM(All Adjusted Salary Components)
             = Basic + Housing + Transport + ... + Other Allowances
```

### 5. Statutory Deduction Types

#### Percentage Deduction

```
Amount = (Gross Salary × Rate) / 100

Example: PAYE = 7% of Gross
       = (₦548,420 × 7) / 100 = ₦38,389
```

#### Formula Deduction

```
Amount = Evaluate formula with component values

Example: Pension = "8 * (Basic + Housing + Transport)"
       = 0.08 × (403,250 + 80,650 + 40,325) = ₦41,938
```

#### Fixed Deduction

```
Amount = Fixed value (monthly)

Example: NSITF = ₦200/month
```

#### Prorated Annual Deduction

```
Monthly Max = Annual Amount / 12
Prorated = Monthly Max × Attendance Factor

Example: Leave Allowance = ₦360,000/year
         Monthly Max = ₦360,000 / 12 = ₦30,000
         Prorated = ₦30,000 × 0.8065 = ₦24,195
```

### 6. Net Salary

```
Net Salary = Gross Salary - Total Statutory Deductions
           = Amount employee receives in bank

Example: ₦548,420 - ₦94,238 = ₦454,182
```

### 7. Credit to Bank

```
Credit to Bank = Gross Salary + Total Statutory Deductions
               = Amount client must pay (includes employee salary + employer remittances)

Example: ₦548,420 + ₦94,238 = ₦642,658
```

### 8. Invoice-Level Calculations

#### Management Fee

```
Management Fee = Net Payroll × 7%
               = 7% of total amount paid to all employees

Example: ₦4,541,820 × 0.07 = ₦317,927
```

#### VAT

```
VAT = Management Fee × 7.5%

Example: ₦317,927 × 0.075 = ₦23,844
```

#### Total Invoice Amount

```
Total Invoice Amount = Net Payroll + Management Fee + VAT - WHT

Example: ₦4,541,820 + ₦317,927 + ₦23,844 - ₦0 = ₦4,883,591
```

---

## DECISION TREE FOR COMPONENT TYPES

```
┌─────────────────────────────────────┐
│  Component from Template             │
└─────────────────────────────────────┘
              │
              ▼
        ┌───────────┐
        │   TYPE?   │
        └───────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌───────┐ ┌─────────┐ ┌──────────────┐
│ fixed │ │ formula │ │prorated_annual│
└───────┘ └─────────┘ └──────────────┘
    │         │              │
    │         │              │
    ▼         ▼              ▼
Use Rate  Evaluate      Annual/12
  As-Is    Formula       × Factor
    │         │              │
    └─────────┼──────────────┘
              ▼
    Convert Annual→Monthly
              │
              ▼
    Apply Attendance Factor
              │
              ▼
     Adjusted Amount
```

---

## ERROR HANDLING FLOW

```
┌─────────────────────────────────────┐
│  Start Calculation                   │
└─────────────────────────────────────┘
              │
              ▼
        ┌───────────┐
        │ Template  │───NO──→ Throw Exception
        │  Exists?  │         "No template found"
        └───────────┘
              │ YES
              ▼
        ┌───────────┐
        │ Template  │───NO──→ Throw Exception
        │  Valid?   │         "Invalid template"
        └───────────┘
              │ YES
              ▼
        ┌───────────┐
        │ Formula   │───FAIL─→ Log Warning
        │  Valid?   │         Use 0 as fallback
        └───────────┘
              │ SUCCESS
              ▼
        ┌───────────┐
        │ Continue  │
        │Calculation│
        └───────────┘
```

---

This flowchart provides a visual, step-by-step breakdown of the entire invoice calculation process from template to final invoice amount.
