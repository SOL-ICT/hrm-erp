# Employee Management - Testing Guide

## 🧪 Testing Checklist

Use this guide to systematically test all Employee Management features before deploying to production.

---

## 📋 Pre-Testing Setup

### 1. Ensure Backend is Running

```bash
cd c:\Project\hrm-erp\backend
php artisan serve
# Should be running on http://localhost:8000
```

### 2. Ensure Frontend is Running

```bash
cd c:\Project\hrm-erp\frontend
npm run dev
# Should be running on http://localhost:3000
```

### 3. Database Migrations

```bash
cd c:\Project\hrm-erp\backend
php artisan migrate:status

# Verify these migrations exist:
# ✓ 2025_01_XX_create_staff_terminations_table
# ✓ 2025_01_XX_create_staff_blacklist_table
# ✓ 2025_01_XX_create_staff_promotions_table
# ✓ 2025_01_XX_create_staff_redeployments_table
# ✓ 2025_01_XX_create_staff_cautions_table
# ✓ 2025_01_XX_create_staff_warnings_table
# ✓ 2025_01_XX_create_staff_suspensions_table
```

### 4. Test Data Requirements

- At least 1 active client with staff
- At least 3-5 staff members for testing
- Job structures and pay grades configured

---

## 🎯 Navigation Testing

### Test 1: Menu Visibility

**Steps:**

1. Login to application
2. Click "HR & Payroll Management" in sidebar
3. Verify submenu expands

**Expected Result:**

```
✓ HR & Payroll Management expands
✓ Shows submodules:
  - Employee Record
  - Employee Management  ← Should be visible
  - Payroll Processing
  - Invoicing
```

### Test 2: Navigation to Employee Management

**Steps:**

1. Click "Employee Management" in submenu
2. Wait for page to load

**Expected Result:**

```
✓ Page loads without errors
✓ Title shows "Employee Management"
✓ Subtitle shows "Manage all staff actions..."
✓ 8 tabs are visible:
  ⛔ Termination
  📈 Promotion
  🔄 Redeployment
  ⚠️ Caution
  🚨 Warning
  ⏸️ Suspension
  ❓ Query
  🚫 Blacklist
✓ Termination tab is active by default
✓ "← Back" button visible in top right
```

### Test 3: Tab Switching

**Steps:**

1. Click each tab (Termination → Promotion → Redeployment → etc.)
2. Verify content changes

**Expected Result:**

```
✓ Tab highlights when active (blue background)
✓ Content area updates instantly (no page reload)
✓ Each tab shows unique content
✓ No JavaScript errors in console
```

---

## ⛔ Termination Tab Testing

### Test 4: Single Termination Entry

**Steps:**

1. Click "Termination" tab
2. Select a client from dropdown
3. Select a staff member
4. Fill form:
   - Termination Type: "Voluntary"
   - Resignation Date: Today's date
   - Notice Period: 30
   - Relieving Date: 30 days from today
   - Exit Interview: "Yes"
   - PPE Return: "Yes"
   - Reason: "Test termination"
   - Check "Add to Blacklist"
5. Click "Create Termination"

**Expected Result:**

```
✓ Client dropdown populates with format: "PREFIX - Organisation Name"
✓ Staff dropdown populates after client selection
✓ Staff shows as: "STAFF_ID - First Name Last Name"
✓ Notice period accepts max 30 days
✓ Form submits successfully
✓ Success message appears: "Termination created successfully"
✓ Form resets
✓ Terminations table updates with new record
✓ Blacklist record created (verify in Blacklist tab)
```

### Test 5: Notice Period Validation

**Steps:**

1. Fill termination form
2. Enter Notice Period: 31 (exceeds limit)
3. Click "Create Termination"

**Expected Result:**

```
✓ Backend rejects with error message
✓ Error displayed: "Notice period cannot exceed 30 days"
✓ Record NOT created
```

### Test 6: Bulk Upload - Download Template

**Steps:**

1. Scroll to "Bulk Upload Terminations" section
2. Click "📥 Download Template"

**Expected Result:**

```
✓ Excel file downloads
✓ Filename: terminations_upload_template.xlsx (or similar)
✓ Template has headers:
  - staff_id
  - termination_type
  - resignation_date
  - notice_period
  - actual_relieving_date
  - exit_interview
  - ppe_return
  - reason
  - is_blacklisted
✓ Template has sample data row (optional)
```

### Test 7: Bulk Upload - Valid Data

**Steps:**

1. Download template
2. Fill with 3 valid staff records
3. Upload file
4. Click "Upload"

**Expected Result:**

```
✓ File uploads successfully
✓ Success message: "3 terminations uploaded successfully"
✓ Terminations table shows 3 new records
✓ No unmatched staff modal
✓ No error display
```

### Test 8: Bulk Upload - Unmatched Staff

**Steps:**

1. Download template
2. Fill with 2 rows:
   - Row 1: Valid staff_id
   - Row 2: Invalid staff_id (e.g., "INVALID001")
3. Upload file

**Expected Result:**

```
✓ Success message: "1 termination uploaded successfully"
✓ Unmatched Staff Modal appears
✓ Modal shows Row 2 details
✓ Modal offers manual staff selection (future enhancement)
✓ User can close modal
```

### Test 9: Bulk Upload - Validation Errors

**Steps:**

1. Download template
2. Fill with invalid data:
   - Row 2: Notice period = 35 (invalid)
   - Row 3: Missing required field
3. Upload file

**Expected Result:**

```
✓ Validation errors displayed
✓ Shows row numbers with specific errors
✓ Format: "Row 2: Notice period cannot exceed 30 days"
✓ Format: "Row 3: Resignation date is required"
✓ No records created for invalid rows
```

---

## 📈 Promotion Tab Testing

### Test 10: Single Promotion Entry

**Steps:**

1. Click "Promotion" tab
2. Select client
3. Select staff member (verify current position shows)
4. Select new job structure
5. Select new pay grade (should filter by job)
6. Verify emolument preview shows
7. Enter promotion date and effective date
8. Enter reason
9. Click "Create Promotion"

**Expected Result:**

```
✓ Current position box shows:
  - Job: [Current Job Title]
  - Grade: [Current Grade Name]
  - Emoluments: [JSON snapshot]
✓ Job structure dropdown populates
✓ Pay grade dropdown filters by selected job
✓ New position preview box shows:
  - Emoluments: [New JSON snapshot]
✓ Promotion created successfully
✓ Form resets
✓ Promotions table updates
```

### Test 11: Pay Grade Filtering

**Steps:**

1. Select job structure A
2. Note pay grades shown
3. Select job structure B
4. Verify pay grades change

**Expected Result:**

```
✓ Pay grade dropdown only shows grades linked to selected job
✓ Previous pay grade selection clears when job changes
✓ No unrelated pay grades visible
```

### Test 12: Emolument Snapshot Verification

**Steps:**

1. Create promotion
2. Check backend database: staff_promotions table
3. Verify old_emoluments and new_emoluments columns

**Expected Result:**

```
✓ old_emoluments contains JSON snapshot of previous grade's emoluments
✓ new_emoluments contains JSON snapshot of new grade's emoluments
✓ Both are valid JSON objects
```

---

## 🔄 Redeployment Tab Testing

### Test 13: Department Redeployment

**Steps:**

1. Click "Redeployment" tab
2. Select client and staff
3. Select "Department" as redeployment type
4. Enter new department name
5. Enter dates and reason
6. Submit

**Expected Result:**

```
✓ Form shows only "New Department" field
✓ Job/grade fields hidden
✓ Redeployment created successfully
✓ Record shows type: "department"
```

### Test 14: Designation Redeployment

**Steps:**

1. Select "Designation" as type
2. Verify form shows job and pay grade dropdowns
3. Select new job and grade
4. Submit

**Expected Result:**

```
✓ Job structure and pay grade fields appear
✓ Department and service location fields hidden
✓ Redeployment created with new designation
```

### Test 15: Client Redeployment (Cross-Client)

**Steps:**

1. Select "Client" as type
2. Select different client (not current)
3. Select job structure for new client
4. Select pay grade (should only show grades for new client)
5. Submit

**Expected Result:**

```
✓ New client dropdown shows all clients except current
✓ Job structures refresh for new client
✓ Pay grades refresh for new client
✓ Pay grade validation: must belong to new client's jobs
✓ old_client_id saved in database
✓ Redeployment created successfully
```

### Test 16: Cross-Client Validation

**Steps:**

1. Create client redeployment
2. Try to assign pay grade from old client

**Expected Result:**

```
✓ Backend rejects with error
✓ Error message: "Pay grade must belong to the new client"
✓ Record NOT created
```

---

## ⚠️ Caution Tab Testing

### Test 17: Single Caution Entry

**Steps:**

1. Click "Caution" tab
2. Select client and staff
3. Enter caution date
4. Select status: "Active"
5. Enter reason
6. Submit

**Expected Result:**

```
✓ Caution created successfully
✓ Shows in cautions table
✓ Status displays as yellow badge: "active"
```

### Test 18: Caution Status Colors

**Steps:**

1. Create 3 cautions with different statuses:
   - Active
   - Resolved
   - Withdrawn
2. Verify table display

**Expected Result:**

```
✓ Active: Yellow badge
✓ Resolved: Green badge
✓ Withdrawn: Gray badge
```

---

## 🚨 Warning Tab Testing

### Test 19: Warning Levels

**Steps:**

1. Click "Warning" tab
2. Create 3 warnings with different levels:
   - First Warning
   - Second Warning
   - Final Warning

**Expected Result:**

```
✓ All warnings created successfully
✓ Table shows color-coded badges:
  - First: Yellow
  - Second: Orange
  - Final: Red
```

### Test 20: Warning Escalation

**Steps:**

1. Create warning with status "Escalated"
2. Verify in table

**Expected Result:**

```
✓ Status shows as red badge: "escalated"
```

---

## ⏸️ Suspension Tab Testing

### Test 21: Auto-Calculated Days

**Steps:**

1. Click "Suspension" tab
2. Select client and staff
3. Enter start date: 2025-01-15
4. Enter end date: 2025-01-20
5. Observe "Days" field

**Expected Result:**

```
✓ Days field auto-calculates: 5
✓ Field is read-only (grayed out)
✓ Updates instantly when dates change
```

### Test 22: Suspension Status

**Steps:**

1. Create suspensions with different statuses:
   - Active
   - Completed
   - Lifted

**Expected Result:**

```
✓ Active: Yellow badge
✓ Completed: Green badge
✓ Lifted: Gray badge
```

---

## ❓ Query Tab Testing

### Test 23: Query Creation

**Steps:**

1. Click "Query" tab
2. Select client and staff
3. Enter query date
4. Enter query details
5. Leave response empty
6. Submit with status "Pending"

**Expected Result:**

```
✓ Query created successfully
✓ Shows in table with status: "pending" (yellow badge)
```

### Test 24: Query Response

**Steps:**

1. Create query
2. Edit to add response
3. Enter response text
4. Enter response date
5. Change status to "Responded"
6. Submit

**Expected Result:**

```
✓ Response saved
✓ Response date saved
✓ Status updates to "responded" (blue badge)
```

### Test 25: No Bulk Upload (Verify)

**Steps:**

1. Verify Query tab UI

**Expected Result:**

```
✓ No "Bulk Upload" section visible
✓ Only single entry form and table
✓ No template download button
```

---

## 🚫 Blacklist Tab Testing

### Test 26: Blacklist Auto-Creation

**Steps:**

1. Navigate to Termination tab
2. Create termination with "Add to Blacklist" checked
3. Navigate to Blacklist tab
4. Search for terminated staff

**Expected Result:**

```
✓ Blacklist record exists
✓ Shows staff details
✓ Blacklist date matches termination date
✓ Reason copied from termination
```

### Test 27: JSON Snapshot Viewer

**Steps:**

1. Click "View Details" on blacklist record
2. Examine modal

**Expected Result:**

```
✓ Modal opens
✓ Shows basic information:
  - Staff ID
  - Name
  - Blacklist Date
  - Reason
✓ Shows "Staff Data Snapshot (JSON)" section
✓ JSON is formatted and readable
✓ Contains complete staff object from termination time
```

### Test 28: Blacklist Search

**Steps:**

1. Enter staff ID in search bar
2. Verify filtering
3. Clear search
4. Enter staff name
5. Verify filtering

**Expected Result:**

```
✓ Search filters results in real-time
✓ Matches staff ID
✓ Matches first name
✓ Matches last name
✓ Matches reason text
✓ Clear search shows all records
```

### Test 29: Remove from Blacklist

**Steps:**

1. Click "Remove" button on blacklist record
2. Confirm dialog
3. Verify removal

**Expected Result:**

```
✓ Confirmation dialog appears
✓ After confirm, record removed from table
✓ Success message shown
✓ Record deleted from database
```

### Test 30: No Direct Creation (Verify)

**Steps:**

1. Verify Blacklist tab UI

**Expected Result:**

```
✓ No "Create Blacklist" button
✓ No form for adding blacklist entries
✓ Only search, table, and view/remove actions
✓ Info box explains auto-creation via termination
```

---

## 🔧 Cross-Tab Testing

### Test 31: Client Selection Persistence

**Steps:**

1. Select client in Termination tab
2. Switch to Promotion tab
3. Verify client selection

**Expected Result:**

```
✓ Client selection does NOT persist (each tab independent)
✓ User must select client again in each tab
```

### Test 32: Theme Consistency

**Steps:**

1. Navigate between all 8 tabs
2. Observe styling

**Expected Result:**

```
✓ All tabs use consistent theme
✓ Card backgrounds match
✓ Text colors match
✓ Borders consistent
✓ Buttons styled uniformly
```

### Test 33: Responsive Design

**Steps:**

1. Resize browser window
2. Test on different screen sizes

**Expected Result:**

```
✓ Tabs wrap on smaller screens
✓ Forms remain usable
✓ Tables scroll horizontally if needed
✓ No layout breaks
```

---

## 🚨 Error Handling Testing

### Test 34: Network Error

**Steps:**

1. Stop backend server
2. Try to create termination
3. Observe error handling

**Expected Result:**

```
✓ Error message displayed
✓ Message: "Failed to create termination" (or similar)
✓ Form data preserved (not cleared)
✓ No JavaScript crashes
```

### Test 35: Authentication Error

**Steps:**

1. Clear authentication token
2. Try to access Employee Management

**Expected Result:**

```
✓ Redirects to login page
✓ Or shows "Unauthorized" message
✓ No sensitive data exposed
```

### Test 36: Invalid Data Submission

**Steps:**

1. Submit form with:
   - Future resignation date (invalid)
   - Negative notice period
   - Missing required fields

**Expected Result:**

```
✓ Backend validation catches errors
✓ Frontend shows specific error messages
✓ Invalid fields highlighted (if implemented)
✓ Record NOT created
```

---

## 📊 Performance Testing

### Test 37: Large Dataset

**Steps:**

1. Create 100+ termination records (use bulk upload)
2. Navigate to Termination tab
3. Observe table loading

**Expected Result:**

```
✓ Table loads within 2-3 seconds
✓ No browser lag
✓ Pagination works (if implemented)
✓ Search/filter functional
```

### Test 38: Concurrent Tab Operations

**Steps:**

1. Open Termination tab
2. Start filling form
3. Switch to Promotion tab
4. Fill form there
5. Switch back to Termination
6. Submit both forms

**Expected Result:**

```
✓ No data mixing between tabs
✓ Each tab maintains its own state
✓ Both submissions succeed independently
```

---

## ✅ Acceptance Criteria

### Minimum Passing Requirements:

- [ ] All 8 tabs render without errors
- [ ] Client and staff selectors populate correctly
- [ ] Single entry forms submit successfully (all tabs)
- [ ] Bulk upload works for 6 action types (excluding Query and Blacklist)
- [ ] Template download works for all bulk upload tabs
- [ ] Blacklist auto-creation works via termination
- [ ] Search and filtering work
- [ ] Data validation prevents invalid submissions
- [ ] No console errors during normal use
- [ ] Responsive design works on desktop and tablet

### Nice-to-Have Features (Future):

- [ ] Unmatched staff manual mapping in modal
- [ ] Edit/delete functionality for existing records
- [ ] Advanced filtering (date ranges, status, etc.)
- [ ] Export to Excel functionality
- [ ] Email notifications on actions
- [ ] Audit trail viewing

---

## 🐛 Known Issues (If Any)

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** High/Medium/Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [What should happen]
   - **Actual:** [What actually happens]
   - **Fix Status:** Pending/In Progress/Fixed

---

## 📝 Test Results Log

Date: ******\_\_\_******  
Tester: ******\_\_\_******  
Environment: Local / Staging / Production

| Test # | Test Name                         | Status        | Notes |
| ------ | --------------------------------- | ------------- | ----- |
| 1      | Menu Visibility                   | ☐ Pass ☐ Fail |       |
| 2      | Navigation to Employee Management | ☐ Pass ☐ Fail |       |
| 3      | Tab Switching                     | ☐ Pass ☐ Fail |       |
| ...    | ...                               | ...           |       |

---

## 🚀 Production Deployment Pre-Flight

Before deploying to production, verify:

- [ ] All tests pass in local environment
- [ ] All tests pass in staging environment (if available)
- [ ] Database migrations tested
- [ ] Backup of production database created
- [ ] Rollback plan documented
- [ ] Deployment scheduled during low-traffic period
- [ ] Team notified of deployment

---

**Happy Testing! 🎉**

For issues or questions, refer to:

- EMPLOYEE_MANAGEMENT_IMPLEMENTATION_COMPLETE.md
- EMPLOYEE_MANAGEMENT_NAVIGATION_ARCHITECTURE.md
