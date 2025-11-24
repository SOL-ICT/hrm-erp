# E2E TESTING GUIDE - PAYROLL PROCESSING MODULE

## Task 24: Complete End-to-End Testing

**Testing Date:** November 21, 2025  
**Tester:** [Your Name]  
**System Version:** Phase 2 Complete (Tasks 1-23)  
**Testing Duration:** 2-3 hours (estimated)

---

## PREREQUISITES

### Environment Setup

- [ ] Docker Desktop running
- [ ] Backend server running (`docker-compose up -d` or `php artisan serve`)
- [ ] Frontend server running (`npm run dev` in frontend folder)
- [ ] Database migrated with all tables
- [ ] Database seeded with:
  - [ ] 11 Universal emolument components
  - [ ] 6 PAYE tax brackets (Nigeria 2025)
  - [ ] 10 Payroll settings (pension, NHF, NSITF, ITF, formulas)
  - [ ] At least 1 test client with staff
  - [ ] At least 1 job structure with pay grades

### Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Database:** http://localhost:8081 (phpMyAdmin)

### Test User Credentials

- **Role:** Admin (with payroll permissions)
- **Login:** [Your admin credentials]

---

## TESTING WORKFLOWS

## WORKFLOW 1: PAY GRADE BULK UPLOAD ⭐ START HERE

**Purpose:** Verify bulk upload of pay grade emoluments via Excel  
**Estimated Time:** 20 minutes  
**Priority:** HIGH (Required for payroll calculation)

### Pre-Test Setup

- [ ] Verify at least 1 client exists
- [ ] Verify at least 1 job structure exists for that client
- [ ] Verify at least 3-5 pay grades exist for that job structure
- [ ] Verify 11 universal components exist (check backend)

### Test Steps

#### Step 1: Navigate to Bulk Upload

1. [ ] Login to system
2. [ ] Navigate to: **Client & Contract Management → Salary Structure**
3. [ ] Select a client from dropdown
4. [ ] Select a job structure (e.g., "Senior Management")
5. [ ] Verify pay grades table loads
6. [ ] Click **"Bulk Upload"** button (should open BulkUploadModal)

**Expected Result:**

- ✅ Modal opens with title "BULK UPLOAD PAY GRADES"
- ✅ Shows client name and job structure in header
- ✅ Shows Step 1 active (Download Template)
- ✅ Progress indicator shows 4 steps

**Screenshot:** `screenshot-1-bulk-upload-modal-open.png`

---

#### Step 2: Download Template

1. [ ] Click **"Download Template"** button
2. [ ] Wait for download spinner
3. [ ] Verify Excel file downloads to Downloads folder

**Expected Result:**

- ✅ Excel file downloads successfully
- ✅ Filename format: `pay_grades_bulk_template_{client_name}_{timestamp}.xlsx`
- ✅ Modal auto-advances to Step 2 (Upload)
- ✅ Progress indicator shows Step 1 complete (checkmark)

**Screenshot:** `screenshot-2-template-downloaded.png`

---

#### Step 3: Verify Template Structure

1. [ ] Open downloaded Excel file
2. [ ] Verify columns present:
   - [ ] Grade Name
   - [ ] Grade Code
   - [ ] 11 Universal Component columns (BASIC_SALARY, HOUSING_ALLOWANCE, etc.)
   - [ ] Any client-specific custom component columns
3. [ ] Verify rows contain:
   - [ ] All pay grades for selected job structure
   - [ ] Grade names and codes pre-filled
   - [ ] Component amount cells empty (ready for input)

**Expected Result:**

- ✅ Excel has correct structure
- ✅ All pay grades listed
- ✅ All components listed as columns
- ✅ Ready for manual amount entry

**Screenshot:** `screenshot-3-excel-template-structure.png`

---

#### Step 4: Fill Template with Test Data

1. [ ] In Excel, fill amounts for at least 3 pay grades
2. [ ] Example amounts:

   ```
   Grade: Senior Manager (SM-001)
   - BASIC_SALARY: 500000
   - HOUSING_ALLOWANCE: 200000
   - TRANSPORT_ALLOWANCE: 50000
   - LUNCH_ALLOWANCE: 30000
   - (Leave other components at 0 or blank)

   Grade: Manager (MG-001)
   - BASIC_SALARY: 350000
   - HOUSING_ALLOWANCE: 150000
   - TRANSPORT_ALLOWANCE: 40000

   Grade: Supervisor (SV-001)
   - BASIC_SALARY: 250000
   - HOUSING_ALLOWANCE: 100000
   ```

3. [ ] Save Excel file
4. [ ] Close Excel

**Screenshot:** `screenshot-4-excel-filled-amounts.png`

---

#### Step 5: Upload Filled Template

1. [ ] Return to browser (should still be on Step 2)
2. [ ] Click **"Choose File"** or drag-drop file to dropzone
3. [ ] Select the filled Excel file
4. [ ] Verify file appears in dropzone (name, size shown)
5. [ ] Click **"Upload & Preview"** button
6. [ ] Wait for upload spinner

**Expected Result:**

- ✅ File selected successfully
- ✅ Dropzone border turns green
- ✅ Shows file name and size
- ✅ Upload button enabled
- ✅ Upload completes without errors
- ✅ Modal auto-advances to Step 3 (Preview)

**Screenshot:** `screenshot-5-file-uploaded.png`

---

#### Step 6: Review Preview

1. [ ] Verify Step 3 (Preview & Confirm) is active
2. [ ] Verify success banner: "File Uploaded Successfully!"
3. [ ] Verify preview count matches number of grades
4. [ ] Review each pay grade card:
   - [ ] Grade name and code shown in header
   - [ ] EmolumentGridEditor shows all components
   - [ ] Amounts match what you entered in Excel
   - [ ] Total compensation calculated correctly
   - [ ] Color-coded category badges visible
   - [ ] Pensionable indicator correct

**Expected Result:**

- ✅ All grades displayed in preview
- ✅ All amounts match Excel
- ✅ Total compensation = sum of amounts
- ✅ Grid is read-only (no edit/delete buttons)
- ✅ "Confirm & Save All" button enabled

**Screenshot:** `screenshot-6-preview-all-grades.png`

---

#### Step 7: Test Back Navigation

1. [ ] Click **"Back to Upload"** button
2. [ ] Verify returns to Step 2
3. [ ] File should still be selected
4. [ ] Click **"Upload & Preview"** again
5. [ ] Verify returns to Step 3 preview

**Expected Result:**

- ✅ Back navigation works
- ✅ Preview data persists
- ✅ Can navigate between steps without losing data

---

#### Step 8: Confirm and Save

1. [ ] Click **"Confirm & Save All"** button
2. [ ] Wait for confirmation spinner
3. [ ] Verify success message appears

**Expected Result:**

- ✅ Confirmation completes successfully
- ✅ Modal advances to Step 4 (Success)
- ✅ Success message: "Successfully updated {N} pay grades!"
- ✅ Green checkmark icon shown
- ✅ Auto-close message displayed
- ✅ Modal closes after 2 seconds
- ✅ Parent table refreshes automatically

**Screenshot:** `screenshot-7-bulk-upload-success.png`

---

#### Step 9: Verify Database Changes

1. [ ] Navigate to phpMyAdmin (http://localhost:8081)
2. [ ] Open table: `pay_grade_structures`
3. [ ] Filter by `job_structure_id` used in test
4. [ ] For each pay grade, verify:
   - [ ] `emoluments` column contains JSON array
   - [ ] JSON structure matches: `[{component_id, component_code, amount}, ...]`
   - [ ] `total_compensation` column = sum of all amounts

**Expected Result:**

- ✅ All pay grades updated in database
- ✅ emoluments JSON correctly formatted
- ✅ total_compensation calculated correctly

**Screenshot:** `screenshot-8-database-verification.png`

---

### WORKFLOW 1: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 2: CUSTOM COMPONENT CRUD

**Purpose:** Verify creation, editing, and deletion of client-specific emolument components  
**Estimated Time:** 15 minutes  
**Priority:** HIGH

### Test Steps

#### Step 1: Open Manage Components Modal

1. [ ] Navigate to: **Client & Contract Management → Salary Structure**
2. [ ] Select a client
3. [ ] Click **"Manage Custom Components"** button

**Expected Result:**

- ✅ ManageEmolumentComponentsModal opens
- ✅ Shows client name in header
- ✅ Table loads with existing components (if any)
- ✅ "Create New Component" button visible

**Screenshot:** `screenshot-9-manage-components-modal.png`

---

#### Step 2: Create Custom Component

1. [ ] Click **"Create New Component"** button
2. [ ] Form appears, fill in:
   - **Component Name:** `Performance Bonus`
   - **Description:** `Monthly performance-based bonus`
   - **Category:** `Benefit`
   - **Payroll Category:** `allowance`
   - **Is Pensionable:** ✅ Checked
   - **Is Taxable:** ✅ Checked
3. [ ] Verify `component_code` auto-generated (e.g., `PERFORMANCE_BONUS`)
4. [ ] Click **"Save Component"** button

**Expected Result:**

- ✅ Form validation passes
- ✅ Component created successfully
- ✅ Success alert: "Component created successfully"
- ✅ Table refreshes with new component
- ✅ Component appears in table with:
  - Green "Benefit" badge
  - "allowance" payroll category
  - Pensionable/Taxable indicators shown
  - Edit and Delete buttons visible

**Screenshot:** `screenshot-10-custom-component-created.png`

---

#### Step 3: Edit Custom Component

1. [ ] Find the newly created component in table
2. [ ] Click **"Edit"** button
3. [ ] Modify:
   - **Description:** `Quarterly performance-based bonus`
   - **Is Pensionable:** ❌ Unchecked
4. [ ] Click **"Update Component"** button

**Expected Result:**

- ✅ Form pre-fills with existing values
- ✅ Update successful
- ✅ Success alert: "Component updated successfully"
- ✅ Table refreshes
- ✅ Changes reflected in table (pensionable indicator removed)

**Screenshot:** `screenshot-11-custom-component-edited.png`

---

#### Step 4: Verify Component in Bulk Template

1. [ ] Close Manage Components modal
2. [ ] Click **"Bulk Upload"** button
3. [ ] Click **"Download Template"**
4. [ ] Open Excel template
5. [ ] Verify new custom component appears as column

**Expected Result:**

- ✅ Custom component column present in Excel
- ✅ Column name matches component name
- ✅ Ready to accept amounts

**Screenshot:** `screenshot-12-custom-component-in-template.png`

---

#### Step 5: Verify Component in Pay Grade Form

1. [ ] Close bulk upload modal
2. [ ] Click **"Edit"** on any pay grade
3. [ ] Click **"Add Existing Component"** dropdown
4. [ ] Verify custom component appears in list
5. [ ] Select custom component and enter amount (e.g., 50000)
6. [ ] Verify it appears in EmolumentGridEditor
7. [ ] Save pay grade

**Expected Result:**

- ✅ Custom component appears in dropdown
- ✅ Can add to grid with amount
- ✅ Total compensation updates
- ✅ Saves successfully

**Screenshot:** `screenshot-13-custom-component-in-pay-grade-form.png`

---

#### Step 6: Delete Custom Component

1. [ ] Return to **Manage Custom Components** modal
2. [ ] Find the custom component
3. [ ] Click **"Delete"** button
4. [ ] Confirm deletion in confirmation dialog

**Expected Result:**

- ✅ Confirmation dialog appears
- ✅ Deletion successful
- ✅ Success alert: "Component deleted successfully"
- ✅ Component removed from table
- ✅ Component no longer appears in dropdowns/templates

**Screenshot:** `screenshot-14-custom-component-deleted.png`

---

#### Step 7: Verify Cannot Delete Universal Components

1. [ ] In Manage Components modal, find a universal component (e.g., BASIC_SALARY)
2. [ ] Verify Edit and Delete buttons are hidden/disabled

**Expected Result:**

- ✅ Universal components cannot be edited
- ✅ Universal components cannot be deleted
- ✅ Only view-only display shown

---

### WORKFLOW 2: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 3: ATTENDANCE UPLOAD FOR PAYROLL

**Purpose:** Verify attendance CSV/Excel upload for payroll calculation  
**Estimated Time:** 15 minutes  
**Priority:** HIGH (Required for payroll calculation)

### Pre-Test Setup

- [ ] Prepare test CSV file with attendance data
- [ ] CSV structure:
  ```csv
  staff_id,staff_name,days_present,days_absent,total_days
  EMP001,John Doe,22,0,22
  EMP002,Jane Smith,20,2,22
  EMP003,Bob Johnson,21,1,22
  ```

### Test Steps

#### Step 1: Navigate to Attendance Upload

1. [ ] Navigate to: **HR & Payroll Management → Payroll Processing**
2. [ ] Click **"Attendance for Payroll"** tab
3. [ ] Verify two-column layout:
   - Left: Upload form
   - Right: Instructions

**Expected Result:**

- ✅ Tab loads successfully
- ✅ Upload form visible on left
- ✅ Instructions visible on right
- ✅ Recent uploads table visible at bottom

**Screenshot:** `screenshot-15-attendance-upload-page.png`

---

#### Step 2: Download Template

1. [ ] Click **"Download Template"** button
2. [ ] Verify CSV template downloads

**Expected Result:**

- ✅ CSV file downloads
- ✅ Contains correct headers
- ✅ Includes sample data row

---

#### Step 3: Upload Attendance File

1. [ ] Select client from dropdown
2. [ ] Select month (e.g., November)
3. [ ] Select year (e.g., 2025)
4. [ ] Click **"Choose File"** and select test CSV
5. [ ] Verify file validation:
   - [ ] File type: .csv or .xlsx
   - [ ] File size: max 5MB
6. [ ] Click **"Upload Attendance"** button

**Expected Result:**

- ✅ File validation passes
- ✅ Upload initiates
- ✅ Preview modal opens showing:
  - Matched records (green)
  - Unmatched records (yellow)
  - Mapping interface for failures

**Screenshot:** `screenshot-16-attendance-upload-preview.png`

---

#### Step 4: Handle Unmatched Records

1. [ ] If any records failed to match:
   - [ ] Use mapping dropdown to select correct staff
   - [ ] OR mark as "Skip this record"
2. [ ] Click **"Confirm & Save"** button

**Expected Result:**

- ✅ Manual mapping works
- ✅ Can skip unmatched records
- ✅ Save completes successfully
- ✅ Success message shows matched count

**Screenshot:** `screenshot-17-attendance-mapping.png`

---

#### Step 5: Set Ready for Processing

1. [ ] Find uploaded file in "Recent Uploads" table
2. [ ] Verify status is "Pending"
3. [ ] Click **"Set Ready for Processing"** action button
4. [ ] Confirm action

**Expected Result:**

- ✅ Status changes to "Ready for Processing"
- ✅ `ready_for_processing` flag = TRUE in database
- ✅ File now available for payroll run creation

**Screenshot:** `screenshot-18-attendance-ready-for-processing.png`

---

#### Step 6: Verify Database Records

1. [ ] Navigate to phpMyAdmin
2. [ ] Check table: `attendance_uploads`
   - [ ] Verify `is_for_payroll` = 1
   - [ ] Verify `ready_for_processing` = 1
3. [ ] Check table: `attendance_records`
   - [ ] Verify all records created
   - [ ] Verify `ready_for_calculation` = 1 for matched records

**Expected Result:**

- ✅ Upload record saved correctly
- ✅ All matched attendance records saved
- ✅ Flags set correctly

---

### WORKFLOW 3: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 4: PAYROLL RUN EXECUTION (COMPLETE LIFECYCLE)

**Purpose:** Test complete payroll workflow from creation to export  
**Estimated Time:** 30 minutes  
**Priority:** CRITICAL

### Pre-Test Requirements

- [ ] ✅ Pay grades have emoluments (from Workflow 1)
- [ ] ✅ Attendance uploaded and ready (from Workflow 3)
- [ ] ✅ Staff have assigned pay grades
- [ ] ✅ Payroll settings seeded (tax brackets, formulas)

### Test Steps

#### Step 1: Create Payroll Run

1. [ ] Navigate to: **HR & Payroll Management → Payroll Processing**
2. [ ] Verify **"Payroll Runs"** tab is active
3. [ ] Click **"Create New Payroll Run"** button
4. [ ] Fill in modal:
   - **Client:** Select test client
   - **Month:** November
   - **Year:** 2025
   - **Attendance Upload:** Select uploaded file (status = "Ready for Processing")
5. [ ] Click **"Create Payroll Run"** button

**Expected Result:**

- ✅ Payroll run created successfully
- ✅ Status = "Draft" (yellow badge)
- ✅ Appears in payroll runs table
- ✅ Shows month, year, client, created date
- ✅ Actions: Calculate, Delete available

**Screenshot:** `screenshot-19-payroll-run-created.png`

---

#### Step 2: Calculate Payroll

1. [ ] Find newly created payroll run in table
2. [ ] Click **"Calculate"** action button
3. [ ] Wait for calculation progress indicator
4. [ ] Calculation may take 5-30 seconds depending on staff count

**Expected Result:**

- ✅ Calculation starts (spinner shows)
- ✅ Calculation completes successfully
- ✅ Status changes to "Calculated" (blue badge)
- ✅ Success message: "Payroll calculated successfully"
- ✅ Shows calculated count (e.g., "50 staff")
- ✅ Actions: View Details, Approve, Recalculate, Cancel available

**Screenshot:** `screenshot-20-payroll-calculated.png`

---

#### Step 3: View Payroll Details

1. [ ] Click **"View Details"** button
2. [ ] PayrollRunDetailModal opens
3. [ ] Verify tabs:
   - **Summary:** Shows totals, stats
   - **Staff List:** Shows all payroll items
4. [ ] Review summary data:
   - [ ] Total staff count
   - [ ] Total gross pay
   - [ ] Total deductions
   - [ ] Total net pay
   - [ ] Total credit to bank
5. [ ] Switch to **Staff List** tab
6. [ ] Verify each staff item shows:
   - [ ] Staff name, employee ID
   - [ ] Gross salary
   - [ ] Deductions breakdown (PAYE, Pension, etc.)
   - [ ] Net pay
   - [ ] Credit to bank
   - [ ] Days present/absent
   - [ ] Proration factor

**Expected Result:**

- ✅ Detail modal loads successfully
- ✅ Summary calculations correct
- ✅ All staff items displayed
- ✅ Calculations match formulas in payroll_settings
- ✅ No negative values (unless intended)
- ✅ Total net pay = sum of all staff net pay
- ✅ Credit to bank = net pay + reimbursables

**Screenshot:** `screenshot-21-payroll-details-summary.png`  
**Screenshot:** `screenshot-22-payroll-details-staff-list.png`

---

#### Step 4: Verify Calculations

1. [ ] Pick 2-3 staff items randomly
2. [ ] Manually verify calculations using payroll settings:

   **Example Verification:**

   ```
   Staff: John Doe (EMP001)
   Pay Grade: Senior Manager
   Days Present: 22 / 22 (Proration = 1.0)

   Step 1: Gross Salary Calculation
   - BASIC_SALARY: 500,000
   - HOUSING_ALLOWANCE: 200,000
   - TRANSPORT_ALLOWANCE: 50,000
   - LUNCH_ALLOWANCE: 30,000
   - Total Gross = 780,000 × 1.0 = 780,000

   Step 2: Taxable Income Calculation
   - Gross Income: 780,000
   - Less CRA (20% or ₦200k, higher): 200,000
   - Less Pension (8% of basic): 40,000
   - Taxable Income: 540,000

   Step 3: PAYE Calculation (Progressive)
   - First 300,000 @ 7%: 21,000
   - Next 240,000 @ 11%: 26,400
   - Total PAYE: 47,400

   Step 4: Other Deductions
   - Pension (employee 8%): 40,000
   - NHF (2.5%): 19,500
   - NSITF (1%): 7,800
   - ITF (1%): 7,800

   Step 5: Net Pay
   - Gross Pay: 780,000
   - Less PAYE: -47,400
   - Less Pension: -40,000
   - Less NHF: -19,500
   - Less NSITF: -7,800
   - Less ITF: -7,800
   - Net Pay: 657,500

   Step 6: Credit to Bank
   - Net Pay: 657,500
   - Plus Reimbursables: 0 (if any)
   - Credit to Bank: 657,500
   ```

3. [ ] Compare calculated values in UI with manual calculation
4. [ ] Verify within ±1 Naira (rounding differences acceptable)

**Expected Result:**

- ✅ Calculations match manual verification
- ✅ Tax brackets applied correctly
- ✅ Statutory deductions calculated correctly
- ✅ Proration applied correctly for partial attendance
- ✅ Formulas from payroll_settings used correctly

---

#### Step 5: Test Recalculation

1. [ ] Click **"Recalculate"** button
2. [ ] Confirm recalculation
3. [ ] Wait for calculation to complete

**Expected Result:**

- ✅ Recalculation completes successfully
- ✅ Old payroll_items deleted
- ✅ New payroll_items created
- ✅ Calculations match previous run (if no data changed)
- ✅ Status remains "Calculated"

---

#### Step 6: Approve Payroll

1. [ ] Click **"Approve"** button
2. [ ] Confirm approval
3. [ ] Verify status change

**Expected Result:**

- ✅ Approval successful
- ✅ Status changes to "Approved" (green badge)
- ✅ Actions: View Details, Export, Cancel available
- ✅ Calculate and Recalculate buttons hidden
- ✅ Cannot edit approved payroll

**Screenshot:** `screenshot-23-payroll-approved.png`

---

#### Step 7: Export to Excel

1. [ ] Click **"Export"** button
2. [ ] Wait for Excel generation
3. [ ] Excel file downloads

**Expected Result:**

- ✅ Excel file downloads successfully
- ✅ Filename format: `payroll_{client}_{month}_{year}.xlsx`
- ✅ Excel contains all staff with:
  - Staff details
  - Gross salary breakdown
  - Deductions breakdown
  - Net pay
  - Credit to bank
  - Summary totals at bottom
- ✅ Formatting is professional and readable
- ✅ Status changes to "Exported" (purple badge)

**Screenshot:** `screenshot-24-excel-export-structure.png`

---

#### Step 8: Verify Cannot Edit After Export

1. [ ] Verify actions available:
   - [ ] View Details: ✅ Available
   - [ ] Calculate/Recalculate: ❌ Hidden
   - [ ] Approve: ❌ Hidden
   - [ ] Cancel: ❌ Hidden (cannot cancel exported)
   - [ ] Delete: ❌ Hidden
2. [ ] Verify status badge is purple "Exported"

**Expected Result:**

- ✅ Exported payroll is read-only
- ✅ Cannot modify or delete
- ✅ Audit trail preserved

---

#### Step 9: Test Duplicate Prevention

1. [ ] Try to create another payroll run for same client/month/year
2. [ ] Click **"Create New Payroll Run"**
3. [ ] Fill in same client, month, year
4. [ ] Click **"Create Payroll Run"**

**Expected Result:**

- ✅ Validation error: "Payroll run already exists for this period"
- ✅ Error code 409 (Conflict)
- ✅ Shows existing payroll run details
- ✅ Creation blocked

**Screenshot:** `screenshot-25-duplicate-prevention.png`

---

### WORKFLOW 4: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 5: PAYROLL SETTINGS CUSTOMIZATION

**Purpose:** Verify editing and resetting payroll settings  
**Estimated Time:** 20 minutes  
**Priority:** HIGH

### Test Steps

#### Step 1: Navigate to Payroll Settings

1. [ ] Navigate to: **HR & Payroll Management → Payroll Processing**
2. [ ] Click **"Payroll Settings"** tab
3. [ ] Verify 4 sections visible:
   - Tax Configuration
   - Statutory Deductions
   - Calculation Formulas
   - Universal Components (read-only reference)

**Expected Result:**

- ✅ Tab loads successfully
- ✅ All 4 sections displayed
- ✅ Current settings loaded from database
- ✅ Edit buttons visible for editable settings

**Screenshot:** `screenshot-26-payroll-settings-page.png`

---

#### Step 2: Edit PAYE Tax Bracket

1. [ ] In **Tax Configuration** section, find PAYE brackets table
2. [ ] Click **"Edit"** button on row 2 (₦300,001 - ₦600,000)
3. [ ] Modify tax rate from 11% to 12%
4. [ ] Click **"Save"**
5. [ ] Verify validation:
   - [ ] No overlap with other brackets
   - [ ] Rate between 0-100%
   - [ ] Min/max thresholds valid

**Expected Result:**

- ✅ Edit mode activates
- ✅ Tax rate updates successfully
- ✅ Success alert: "PAYE bracket updated successfully"
- ✅ Table refreshes with new rate
- ✅ Database updated

**Screenshot:** `screenshot-27-paye-bracket-edited.png`

---

#### Step 3: Edit Pension Rate

1. [ ] In **Statutory Deductions** section, find Pension card
2. [ ] Click **"Edit"** button
3. [ ] Modify employee rate from 8% to 10%
4. [ ] Modify employer rate from 10% to 12%
5. [ ] Click **"Save"**

**Expected Result:**

- ✅ Edit form appears
- ✅ Rates update successfully
- ✅ Success alert shown
- ✅ Card displays new rates

**Screenshot:** `screenshot-28-pension-rate-edited.png`

---

#### Step 4: Test Formula Validation

1. [ ] In **Calculation Formulas** section, expand "Gross Pay" accordion
2. [ ] Click **"Edit"** button
3. [ ] Modify formula to invalid syntax: `gross_pay = basic ++ allowances`
4. [ ] Click **"Test Formula"** button

**Expected Result:**

- ✅ Validation error: "Invalid formula syntax"
- ✅ Red error message below formula input
- ✅ Cannot save invalid formula
- ✅ Test button provides feedback

---

#### Step 5: Edit Valid Formula

1. [ ] Fix formula to valid syntax: `gross_pay = basic + allowances`
2. [ ] Click **"Test Formula"** button
3. [ ] Verify test passes with sample values
4. [ ] Click **"Save Formula"**

**Expected Result:**

- ✅ Test passes successfully
- ✅ Shows sample calculation result
- ✅ Formula saves successfully
- ✅ Database updated

**Screenshot:** `screenshot-29-formula-edited.png`

---

#### Step 6: Create Test Payroll with New Settings

1. [ ] Navigate back to **Payroll Runs** tab
2. [ ] Create new payroll run (for different client or future month)
3. [ ] Calculate payroll
4. [ ] View details
5. [ ] Verify calculations use NEW settings:
   - [ ] PAYE uses 12% for bracket 2 (instead of 11%)
   - [ ] Pension uses 10% employee rate (instead of 8%)

**Expected Result:**

- ✅ Calculations reflect updated settings
- ✅ PAYE calculated with new 12% rate
- ✅ Pension calculated with new 10% rate
- ✅ Settings changes applied immediately

**Screenshot:** `screenshot-30-payroll-with-new-settings.png`

---

#### Step 7: Reset Settings to Default

1. [ ] Return to **Payroll Settings** tab
2. [ ] In **Tax Configuration** section, click **"Reset to Default"** button
3. [ ] Confirm reset action
4. [ ] Verify all PAYE brackets revert to Nigeria 2025 defaults

**Expected Result:**

- ✅ Confirmation dialog appears
- ✅ Reset completes successfully
- ✅ PAYE bracket 2 reverts to 11%
- ✅ All other brackets revert to defaults
- ✅ Success alert: "Tax configuration reset to default"

**Screenshot:** `screenshot-31-settings-reset.png`

---

#### Step 8: View Audit Trail (Optional)

1. [ ] Click **"View Change History"** button (if implemented)
2. [ ] Verify audit trail shows:
   - [ ] Original values
   - [ ] Modified values
   - [ ] Timestamp of change
   - [ ] User who made change
   - [ ] Reason for change (if provided)

**Expected Result:**

- ✅ Audit trail displays correctly
- ✅ All changes logged
- ✅ Full history available

---

### WORKFLOW 5: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 6: PAY GRADE MANUAL ENTRY (UNIVERSAL TEMPLATE)

**Purpose:** Verify manual pay grade emolument entry using universal template  
**Estimated Time:** 10 minutes  
**Priority:** MEDIUM

### Test Steps

#### Step 1: Edit Pay Grade

1. [ ] Navigate to: **Client & Contract Management → Salary Structure**
2. [ ] Select a client
3. [ ] Click **"Edit"** on any pay grade

**Expected Result:**

- ✅ PayGradeForm modal opens
- ✅ Two new buttons visible:
  - "Load Universal Template" (blue)
  - "Manage Custom Components" (purple)
- ✅ EmolumentGridEditor visible (may be empty)

**Screenshot:** `screenshot-32-pay-grade-form-enhanced.png`

---

#### Step 2: Load Universal Template

1. [ ] Click **"Load Universal Template"** button
2. [ ] Wait for loading spinner
3. [ ] Verify 11 components loaded in grid

**Expected Result:**

- ✅ 11 universal components appear in EmolumentGridEditor
- ✅ All amounts initialized to 0
- ✅ Components include:
  - BASIC_SALARY (Blue badge)
  - HOUSING_ALLOWANCE (Green badge)
  - TRANSPORT_ALLOWANCE (Green badge)
  - LUNCH_ALLOWANCE (Green badge)
  - UTILITY_ALLOWANCE (Green badge)
  - EDUCATION_ALLOWANCE (Green badge)
  - MEDICAL_ALLOWANCE (Green badge)
  - PENSION_EMPLOYER (Purple badge)
  - NHF (Red badge)
  - NSITF (Red badge)
  - ITF (Red badge)
- ✅ Total compensation shows ₦0
- ✅ Pensionable indicators shown correctly

**Screenshot:** `screenshot-33-universal-template-loaded.png`

---

#### Step 3: Edit Amounts

1. [ ] Click on amount cell for BASIC_SALARY
2. [ ] Enter: 400000
3. [ ] Click on HOUSING_ALLOWANCE, enter: 180000
4. [ ] Click on TRANSPORT_ALLOWANCE, enter: 40000
5. [ ] Tab through or click to trigger calculation

**Expected Result:**

- ✅ Amounts update in grid
- ✅ Total compensation updates automatically
- ✅ Total = 400,000 + 180,000 + 40,000 = ₦620,000
- ✅ Currency formatting applied (₦ symbol, commas)

**Screenshot:** `screenshot-34-amounts-entered.png`

---

#### Step 4: Remove Component

1. [ ] Click **"Remove"** button on ITF component
2. [ ] Verify component removed from grid
3. [ ] Verify total compensation remains correct

**Expected Result:**

- ✅ Component removed from grid
- ✅ Total compensation unaffected (ITF was 0)
- ✅ Component can be re-added via "Add Existing Component" dropdown

---

#### Step 5: Save Pay Grade

1. [ ] Click **"Save"** button (in PayGradeForm)
2. [ ] Wait for save completion

**Expected Result:**

- ✅ Pay grade saves successfully
- ✅ Success alert shown
- ✅ Modal closes
- ✅ Parent table refreshes
- ✅ Total compensation column updated in table

**Screenshot:** `screenshot-35-pay-grade-saved.png`

---

#### Step 6: Verify Database

1. [ ] Navigate to phpMyAdmin
2. [ ] Find saved pay grade in `pay_grade_structures`
3. [ ] Verify `emoluments` JSON column contains:
   ```json
   [
     {"component_id": 1, "component_code": "BASIC_SALARY", "amount": 400000},
     {"component_id": 2, "component_code": "HOUSING_ALLOWANCE", "amount": 180000},
     {"component_id": 3, "component_code": "TRANSPORT_ALLOWANCE", "amount": 40000},
     ...
   ]
   ```
4. [ ] Verify `total_compensation` = 620000

**Expected Result:**

- ✅ JSON structure correct
- ✅ All amounts saved
- ✅ Total compensation calculated correctly

---

### WORKFLOW 6: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## WORKFLOW 7: ERROR HANDLING & EDGE CASES

**Purpose:** Verify system handles errors gracefully  
**Estimated Time:** 15 minutes  
**Priority:** MEDIUM

### Test Cases

#### Test 1: Upload Invalid File Type

1. [ ] In Bulk Upload modal, try uploading .pdf file
2. [ ] Verify error: "Invalid file type. Please upload an Excel file (.xlsx or .xls)"

**Expected Result:** ✅ File rejected with clear error message

---

#### Test 2: Upload Oversized File

1. [ ] Try uploading Excel file > 5MB
2. [ ] Verify error: "File size exceeds 5MB. Please upload a smaller file."

**Expected Result:** ✅ File rejected with size limit message

---

#### Test 3: Create Payroll Without Attendance

1. [ ] Create payroll run without selecting attendance upload
2. [ ] Try to calculate
3. [ ] Verify error: "No attendance data found for calculation"

**Expected Result:** ✅ Calculation blocked with helpful error

---

#### Test 4: Calculate with Missing Pay Grades

1. [ ] Create payroll run with staff who have no pay grade assigned
2. [ ] Try to calculate
3. [ ] Verify error lists staff without pay grades

**Expected Result:** ✅ Calculation fails with specific staff list

---

#### Test 5: Network Timeout Simulation

1. [ ] Disable internet connection temporarily
2. [ ] Try any API action (e.g., create payroll run)
3. [ ] Verify error: "Connection failed. Please check your internet."

**Expected Result:** ✅ User-friendly network error message

---

#### Test 6: Delete Approved Payroll

1. [ ] Try to delete payroll run with status "Approved"
2. [ ] Verify error: "Cannot delete approved payroll run"

**Expected Result:** ✅ Deletion blocked for approved runs

---

#### Test 7: Recalculate Exported Payroll

1. [ ] Try to recalculate payroll with status "Exported"
2. [ ] Verify action button hidden or disabled

**Expected Result:** ✅ Recalculation not available for exported runs

---

### WORKFLOW 7: TEST RESULTS

**Status:** [ ] PASS / [ ] FAIL  
**Issues Found:** **********\_\_\_**********  
**Notes:** **********\_\_\_**********

---

## OVERALL TEST SUMMARY

### Test Execution Metrics

- **Total Workflows Tested:** 7
- **Total Test Steps:** ~150
- **Passed:** **\_** / **\_**
- **Failed:** **\_** / **\_**
- **Pass Rate:** **\_**%

### Critical Paths Status

| Workflow               | Status              | Priority | Issues   |
| ---------------------- | ------------------- | -------- | -------- |
| Pay Grade Bulk Upload  | [ ] PASS / [ ] FAIL | HIGH     | **\_\_** |
| Custom Component CRUD  | [ ] PASS / [ ] FAIL | HIGH     | **\_\_** |
| Attendance Upload      | [ ] PASS / [ ] FAIL | HIGH     | **\_\_** |
| Payroll Run Execution  | [ ] PASS / [ ] FAIL | CRITICAL | **\_\_** |
| Payroll Settings       | [ ] PASS / [ ] FAIL | HIGH     | **\_\_** |
| Pay Grade Manual Entry | [ ] PASS / [ ] FAIL | MEDIUM   | **\_\_** |
| Error Handling         | [ ] PASS / [ ] FAIL | MEDIUM   | **\_\_** |

### Issues Found

| #   | Workflow     | Severity                 | Description      | Screenshot     |
| --- | ------------ | ------------------------ | ---------------- | -------------- |
| 1   | **\_\_\_\_** | Critical/High/Medium/Low | ****\_\_\_\_**** | ****\_\_\_**** |
| 2   | **\_\_\_\_** | Critical/High/Medium/Low | ****\_\_\_\_**** | ****\_\_\_**** |
| 3   | **\_\_\_\_** | Critical/High/Medium/Low | ****\_\_\_\_**** | ****\_\_\_**** |

### Performance Observations

- **Payroll Calculation Time (50 staff):** **\_** seconds
- **Bulk Upload Time (10 grades):** **\_** seconds
- **Excel Export Time:** **\_** seconds
- **Page Load Time:** **\_** seconds

### Browser Compatibility (Optional)

- [ ] Chrome (recommended)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Database Integrity

- [ ] All migrations ran successfully
- [ ] All seeders ran successfully
- [ ] No orphaned records
- [ ] Foreign keys enforced
- [ ] JSON columns valid

---

## NEXT STEPS

### If All Tests PASS ✅

1. Mark Task 24 as COMPLETE
2. Proceed to Task 25: Final Doc Check
3. Prepare for Task 26: Project Completion & Handoff

### If Tests FAIL ❌

1. Document all failures in "Issues Found" table
2. Prioritize Critical and High severity issues
3. Fix issues before proceeding
4. Re-run failed workflows
5. Update test status

---

## APPENDIX: QUICK REFERENCE

### API Endpoints Used in Testing

```
POST   /api/salary-structure/pay-grades/bulk-upload
POST   /api/salary-structure/pay-grades/bulk-confirm
GET    /api/salary-structure/pay-grades/bulk-template

POST   /api/emolument-components
PUT    /api/emolument-components/{id}
DELETE /api/emolument-components/{id}

POST   /api/attendance-export/upload
GET    /api/attendance/uploads/payroll

POST   /api/payroll/runs
POST   /api/payroll/runs/{id}/calculate
POST   /api/payroll/runs/{id}/approve
GET    /api/payroll/runs/{id}/export

GET    /api/payroll/settings
PUT    /api/payroll/settings/{key}
POST   /api/payroll/settings/{key}/reset
```

### Database Tables to Monitor

- `pay_grade_structures` (emoluments JSON)
- `emolument_components` (universal + custom)
- `attendance_uploads` (is_for_payroll flag)
- `attendance_records` (ready_for_calculation flag)
- `payroll_runs` (status transitions)
- `payroll_items` (calculation results)
- `payroll_settings` (tax brackets, formulas)

### Common Test Data

```javascript
// Test Client
client_id: 1;
client_name: "Test Corporation";

// Test Staff
staff_id: "EMP001";
staff_name: "John Doe";
pay_grade_id: 5;

// Test Pay Grade
grade_name: "Senior Manager";
grade_code: "SM-001";
total_compensation: 780000;

// Test Attendance
days_present: 22;
days_absent: 0;
total_days: 22;
```

---

**Testing Completed By:** **********\_**********  
**Date:** **********\_**********  
**Time Spent:** **\_** hours  
**Overall Status:** [ ] PASS / [ ] FAIL  
**Ready for Production:** [ ] YES / [ ] NO

---

_End of E2E Testing Guide_
