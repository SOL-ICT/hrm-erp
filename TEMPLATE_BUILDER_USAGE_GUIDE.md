# 📘 Visual Template Builder - Complete Usage Guide

## 🎯 Overview

The Visual Template Builder is used to create **calculation templates** for client invoicing. These templates define how to calculate allowances, deductions, and statutory contributions for each pay grade.

---

## 🔄 Complete Workflow

### 1️⃣ **Setup Calculation Template** (What You're Doing Now)

This is where you define **HOW** to calculate invoice amounts.

#### Step-by-Step:

1. **Navigate to Template Setup**

   - Go to: HR & Payroll Management → Invoicing → Template Setup
   - Select a client (e.g., Fiducia)
   - Click "Setup Template" for a pay grade (e.g., DRIVER1)

2. **Visual Template Builder Opens**

   - **Left Panel**: Component Palette (allowances, deductions, statutory)
   - **Center**: Template Canvas (drag & drop components)
   - **Right Panel**: Live Preview (see calculations in real-time)

3. **Build Your Template**

   **Option A: Start from Library**

   - Click "Template Library" button
   - Browse pre-built templates
   - Select one that matches your needs
   - Components will load automatically

   **Option B: Start from Scratch**

   - Components are loaded from the database (DRIVER1 already has 9 components)
   - Drag components to canvas to activate them
   - Edit formulas by clicking on components

   **Option C: Add Custom Components**

   - Click "Add Custom Component"
   - Enter component name (e.g., "Night Shift Allowance")
   - Choose category: Allowance, Deduction, or Statutory
   - Enter formula (e.g., `basic_salary * 0.15`)
   - Add description
   - Click "Add Component"

4. **Test Your Template**

   - Use the **Live Preview** panel on the right
   - Change "Attendance Days" to see how calculations adjust
   - Change "Basic Salary" to test different scenarios
   - All calculations update in real-time

5. **Save Your Template**

   - Click **"Save Template"** button
   - Template is saved to database
   - Associated with the pay grade code

6. **Export for Backup** (Optional)
   - Click **"Export"** button
   - Downloads JSON file with template configuration
   - Use for backup or sharing with other clients

---

### 2️⃣ **Generate Invoice** (Next Step)

After setting up the calculation template, you can generate invoices.

#### How It Works:

1. **Navigate to Invoice Generation**
   - Go to: HR & Payroll Management → Invoicing → Invoice Generation
   - Select client and month
2. **System Uses Your Template**
   - Fetches attendance records from database
   - Applies your calculation template
   - For each employee:
     - `basic_salary` = from employee record
     - `attendance_days` = from attendance table
     - `total_working_days` = from period settings
   - Calculates allowances → gross → deductions → net
3. **Review and Generate**
   - Preview invoice calculations
   - Adjust if needed
   - Generate final invoice

---

## 🧮 Formula Variables Reference

When creating custom components, you can use these variables in formulas:

### System Variables

| Variable                 | Description             | Example Value |
| ------------------------ | ----------------------- | ------------- |
| `basic_salary`           | Employee's base salary  | 500000        |
| `gross_salary`           | Basic + all allowances  | 650000        |
| `attendance_days`        | Days employee worked    | 22            |
| `total_working_days`     | Total days in period    | 22            |
| `annual_division_factor` | For annual calculations | 12            |

### Component References

You can reference other components by their type name:

- `housing_allowance` - if you have a housing component
- `transport_allowance` - if you have a transport component
- `nhf` - National Housing Fund deduction
- `pension` - Pension contribution

### Example Formulas

#### Allowances:

```javascript
// Housing Allowance (20% of basic)
basic_salary * 0.2;

// Transport Allowance (10% of basic)
basic_salary *
  0.1(
    // 13th Month (prorated)
    basic_salary / annual_division_factor
  ) *
  (attendance_days / total_working_days);
```

#### Deductions:

```javascript
// Pension (8% of basic)
basic_salary * 0.08;

// National Housing Fund (2.5% of basic)
basic_salary * 0.025;

// PAYE Tax (progressive, simplified)
gross_salary * 0.24 - 200000;
```

#### Statutory:

```javascript
// Employer Pension (10% of basic)
basic_salary * 0.1;

// NSITF (1% of basic)
basic_salary * 0.01;
```

---

## 💾 Export vs Calculation Templates

### **Calculation Template** (What You're Setting Up)

- **Purpose**: Define HOW to calculate invoice amounts
- **Contains**: Formulas for allowances, deductions, statutory
- **Used By**: Invoice Generation system
- **Format**: JSON stored in `calculation_templates` table

### **Export Template** (Excel Reports)

- **Purpose**: Define HOW to format Excel exports
- **Contains**: Column headers, cell formatting, formulas for Excel
- **Used By**: Excel export functionality
- **Format**: Configuration for PhpSpreadsheet
- **Set Up**: Separate export template configuration (different from calculation)

**Important**: The "Export" button in Template Builder creates a **backup JSON file**, not an Excel export template. Excel export templates are configured separately in the system.

---

## 🐛 Troubleshooting

### ✅ Formula Errors Fixed

- **Error**: `ReferenceError: annual_division_factor is not defined`
- **Fix**: Updated formula evaluator to include all system variables
- **Now supports**: `basic_salary`, `gross_salary`, `attendance_days`, `total_working_days`, `annual_division_factor`

### ✅ Authentication Fixed

- **Error**: `401 Unauthorized`
- **Fix**: Updated API calls to use `sanctumRequest` for authenticated requests
- **All API calls**: Now properly authenticated

### ✅ Live Preview Fixed

- **Error**: Preview not updating when changing attendance
- **Fix**: Added `useMemo` to recalculate when `sampleData` or `activeComponents` change
- **Now**: Real-time calculation updates

---

## 📋 Best Practices

### 1. **Test Before Saving**

Always use the Live Preview to test your template with different scenarios:

- Full attendance vs partial attendance
- Different salary levels
- Edge cases (0 days, maximum days)

### 2. **Use Descriptive Names**

- ❌ Bad: `comp1`, `allowance_x`
- ✅ Good: `housing_allowance`, `transport_allowance`, `night_shift_premium`

### 3. **Document Your Formulas**

Use the description field to explain complex formulas:

```
Component: Prorated 13th Month
Formula: (basic_salary / annual_division_factor) * (attendance_days / total_working_days)
Description: Annual bonus divided by 12 months, prorated by attendance
```

### 4. **Export for Backup**

After setting up a template, export it as JSON:

- Click "Export" button
- Save file as `{CLIENT}_{GRADE}_{DATE}.json`
- Store in your backup folder

### 5. **Reuse Templates**

If you have similar pay grades:

- Use Template Library to select existing template
- Modify as needed
- Save with new grade code

---

## 🎓 Example: Setting Up DRIVER1 for Fiducia

### Current State

DRIVER1 already has 9 components loaded from database:

- 3 Allowances
- 3 Deductions
- 3 Statutory

### Your Task

1. ✅ **Review components** - Check if formulas are correct
2. ✅ **Test calculations** - Use Live Preview with different attendance values
3. ✅ **Add custom if needed** - Any special allowances for Fiducia drivers?
4. ✅ **Save template** - Click "Save Template"
5. ✅ **Test invoice generation** - Generate a test invoice to verify

---

## 📊 What Happens After You Save?

1. **Template Saved to Database**

   ```sql
   INSERT INTO calculation_templates (
     name,
     pay_grade_code,
     allowance_components,
     deduction_components,
     statutory_components,
     ...
   ) VALUES (...)
   ```

2. **Available for Invoice Generation**

   - System can now calculate invoices for this pay grade
   - Formulas applied to all employees with DRIVER1 grade

3. **Visible in Template Setup**

   - Status changes from "Not Configured" to "Configured"
   - Shows component count (e.g., "9 components")

4. **Can Be Modified**
   - Click "Setup Template" again to edit
   - Changes saved to same template (updates)

---

## 🚀 Next Steps

After setting up calculation templates for all pay grades:

1. **Test Invoice Generation**

   - Generate test invoice for one employee
   - Verify calculations are correct
   - Check all components are applied

2. **Set Up Export Templates** (Separate Feature)

   - Define Excel export format
   - Configure column headers
   - Set up cell formatting

3. **Generate Production Invoices**
   - Select client and period
   - Review calculations
   - Generate and export

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors (F12)
2. Verify template is saved (check database)
3. Test with sample data in Live Preview
4. Check formula syntax (no typos in variable names)

---

**Last Updated**: October 15, 2025
**Version**: 2.0 (Visual Template Builder with Live Preview)
