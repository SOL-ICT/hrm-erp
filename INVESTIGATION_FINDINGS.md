# Investigation Findings - Template System Issues

## Date: October 14, 2025

### Questions Answered:

#### 1. **What's in the Template Library?**

**Answer: YES, Mock/Hardcoded Data**

**Location:** `frontend/src/components/admin/modules/hr-payroll-management/submodules/template-builder/components/`

- **TemplateLibrary.jsx**: Contains 4 hardcoded template presets:
  - Senior Manager Template (Housing 25%, Transport 15%, Lunch 8%, Education 10%, Tax 7%, Pension 8%)
  - Mid-Level Employee Template
  - Entry Level Template
  - Executive Package Template
- **ComponentPalette.jsx**: Contains 13 hardcoded components:
  - **Allowances:** Housing 20%, Transport 10%, Lunch 5%, Education 5%, Medical ₦50k, Entertainment 3%, Utility 4%, 13th Month
  - **Deductions:** Tax 5%, Loan
  - **Statutory:** Pension 8%, NHIS 1.5%, NHF 2.5%

**NO FIDUCIA COMPONENTS** - These are generic templates, not client-specific.

---

#### 2. **Where Do I Upload Components?**

**Answer: Feature Doesn't Exist Yet**

The Visual Builder was created with a **static component palette**. There is currently:

- ❌ NO UI to add custom components
- ❌ NO database table for component definitions (only `calculation_templates` for full templates)
- ❌ NO API endpoint to save/fetch components

**What's Needed:**

- Component management UI in Visual Builder
- Backend API to save custom components
- Database table or JSON storage for components
- Ability to create Fiducia-specific components (Driver grade specific allowances/deductions)

---

#### 3. **Why Does Fiducia Show "Not Configured"?**

**Root Causes Identified:**

**Issue A: Frontend Not Fetching Database Templates**

- The Visual Builder currently uses mock data only
- `TemplateSetupTab.jsx` likely isn't calling the correct API endpoint
- No connection between frontend and `calculation_templates` table

**Issue B: API Endpoint Missing or Incorrect**

- Need to verify `calculationTemplateAPI` endpoints are correct
- Check if `getTemplateByClientGrade` method exists
- Ensure Laravel routes are properly set up

**Issue C: Data Format Mismatch**

- Database stores templates as JSON in `calculation_templates.template_components`
- Frontend expects specific structure
- May need data transformation layer

---

## Database Connection Issues

**Problem:** MySQL not running (docker not started?)

```
Error: php_network_getaddresses: getaddrinfo for hrm-mysql failed
```

**Need to:**

1. Start Docker containers (`docker-compose up -d`)
2. Verify Fiducia client exists in database
3. Check if `calculation_templates` has Fiducia driver grade template
4. Verify template JSON structure

---

## Action Plan

### Immediate Fixes:

1. ✅ **Remove Classic UI from Frontend** (hide, don't delete)

   - Comment out or conditional render classic interface
   - Make Visual Builder the default and only visible option

2. **Connect Visual Builder to Real Database**

   - Modify Visual Builder to fetch components from API
   - Save templates to `calculation_templates` table
   - Load existing templates when opening builder

3. **Fix Fiducia Template Loading**

   - Debug why existing template doesn't show
   - Check API response format
   - Ensure client_id + pay_grade_id mapping works

4. **Add Component Upload Feature**

   - Create modal in Visual Builder for adding custom components
   - Add form: name, category (allowance/deduction/statutory), formula, description
   - Save to database (either new table or enhance `calculation_templates`)

5. **End-to-End Testing**
   - Create Fiducia Driver component
   - Build template in Visual Builder
   - Save and generate invoice
   - Verify calculations

---

## Technical Details

### Current System:

- **Backend:** Laravel with `calculation_templates` table
- **Frontend:** Visual Builder with mock data (not connected to backend)
- **Issue:** Two separate systems not talking to each other

### What Works:

✅ Backend calculation engine (TestRealEndToEndWorkflow.php PASSING)
✅ Visual Builder UI (drag & drop, preview)
✅ Fullscreen overlay (no longer cramped in modal)

### What Doesn't Work:

❌ Visual Builder → Database connection
❌ Template loading from database
❌ Component customization/upload
❌ Fiducia template showing in UI

---

## Next Steps:

1. Start Docker/MySQL
2. Verify Fiducia data in database
3. Hide classic interface
4. Connect Visual Builder to backend API
5. Test complete workflow
