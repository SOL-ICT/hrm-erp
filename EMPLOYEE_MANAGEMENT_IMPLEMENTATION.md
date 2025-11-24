# 🏗️ Employee Management Module - Implementation Strategy

**Module**: Employee Management (Termination, Promotion, Redeployment, etc.)
**Date**: November 19, 2025
**Database Reference**: See `DATABASE_SCHEMA_REFERENCE.md`
**Deployment Guide**: See `DEPLOYMENT_CHECKLIST.md`

---

## 📋 Module Overview

### Features to Implement

1. ✅ **Termination** - Terminate, Death, Resignation
2. ✅ **Query** - Staff queries/issues
3. ✅ **Suspension** - With/without pay, pending investigation
4. ✅ **Redeployment** - By Department, Designation, Service Location, Client
5. ✅ **Promotion** - Grade advancement, position change
6. ✅ **Warning Letter** - Verbal, written, final warnings
7. ✅ **Recall** - Reinstate terminated staff
8. ✅ **Caution** - Minor disciplinary action

### Core Workflow

```
1. Select Client → 2. Select Job Category → 3. Select Staff → 4. Perform Action
```

### Bulk Upload Support

- **Required**: All actions must support Excel bulk upload
- **Matching Logic**:
  1. Primary: Match by `staff_id` (unique, exact match)
  2. Fallback: Fuzzy match by name using `%LIKE%`
  3. Manual linking: Modal for unmatched entries
- **Template Download**: Small button to download pre-formatted Excel template

---

## 🗂️ File Structure

```
backend/
├── database/
│   └── migrations/
│       ├── 2025_11_19_001_create_staff_terminations_table.php
│       ├── 2025_11_19_002_create_staff_blacklist_table.php
│       ├── 2025_11_19_003_create_staff_cautions_table.php
│       ├── 2025_11_19_004_create_staff_warnings_table.php
│       ├── 2025_11_19_005_create_staff_suspensions_table.php
│       ├── 2025_11_19_006_create_staff_promotions_table.php
│       └── 2025_11_19_007_create_staff_redeployments_table.php
├── app/
│   ├── Models/
│   │   ├── StaffTermination.php
│   │   ├── StaffBlacklist.php
│   │   ├── StaffCaution.php
│   │   ├── StaffWarning.php
│   │   ├── StaffSuspension.php
│   │   ├── StaffPromotion.php
│   │   └── StaffRedeployment.php
│   ├── Http/
│   │   └── Controllers/
│   │       └── EmployeeManagement/
│   │           ├── TerminationController.php
│   │           ├── CautionController.php
│   │           ├── WarningController.php
│   │           ├── SuspensionController.php
│   │           ├── PromotionController.php
│   │           ├── RedeploymentController.php
│   │           ├── RecallController.php
│   │           └── HelperController.php (dropdowns, staff search)
│   └── Services/
│       ├── ExcelUploadService.php (bulk upload handler)
│       ├── StaffMatchingService.php (ID/name matching)
│       └── TemplateGeneratorService.php (Excel templates)
├── routes/
│   └── api.php (add employee-management routes)

frontend/
└── src/
    └── app/
        └── employee-management/
            ├── layout.tsx (sidebar navigation)
            ├── page.tsx (dashboard/home)
            ├── termination/
            │   └── page.tsx
            ├── caution/
            │   └── page.tsx
            ├── warning/
            │   └── page.tsx
            ├── suspension/
            │   └── page.tsx
            ├── promotion/
            │   └── page.tsx
            ├── redeployment/
            │   └── page.tsx (tabs for each type)
            ├── recall/
            │   └── page.tsx
            └── components/
                ├── ClientSelector.tsx (dropdown)
                ├── JobCategorySelector.tsx (dropdown)
                ├── StaffSelector.tsx (search/select)
                ├── ExcelUploader.tsx (drag-drop upload)
                ├── TemplateDownloader.tsx (download button)
                ├── UnmatchedStaffModal.tsx (manual linking)
                └── EmolumentDisplay.tsx (for promotions)
```

---

## 🔧 Implementation Steps

### Phase 1: Database Setup (Day 1)

#### Step 1.1: Create Migrations

```bash
cd /c/Project/hrm-erp
docker-compose exec laravel-api php artisan make:migration create_staff_terminations_table
docker-compose exec laravel-api php artisan make:migration create_staff_blacklist_table
docker-compose exec laravel-api php artisan make:migration create_staff_cautions_table
docker-compose exec laravel-api php artisan make:migration create_staff_warnings_table
docker-compose exec laravel-api php artisan make:migration create_staff_suspensions_table
docker-compose exec laravel-api php artisan make:migration create_staff_promotions_table
docker-compose exec laravel-api php artisan make:migration create_staff_redeployments_table
```

**Copy schema from**: `DATABASE_SCHEMA_REFERENCE.md` sections 8-14

#### Step 1.2: Run Migrations

```bash
docker-compose exec laravel-api php artisan migrate
```

#### Step 1.3: Create Models

```bash
docker-compose exec laravel-api php artisan make:model StaffTermination
docker-compose exec laravel-api php artisan make:model StaffBlacklist
docker-compose exec laravel-api php artisan make:model StaffCaution
docker-compose exec laravel-api php artisan make:model StaffWarning
docker-compose exec laravel-api php artisan make:model StaffSuspension
docker-compose exec laravel-api php artisan make:model StaffPromotion
docker-compose exec laravel-api php artisan make:model StaffRedeployment
```

**Add relationships**:

- `belongsTo(Staff::class)`
- `belongsTo(Client::class)`
- `belongsTo(User::class, 'processed_by')`

---

### Phase 2: Backend API (Day 2-3)

#### Step 2.1: Helper Endpoints (for dropdowns)

**File**: `app/Http/Controllers/EmployeeManagement/HelperController.php`

```php
GET /api/employee-management/clients
    → Returns: [{id, organisation_name, prefix}]

GET /api/employee-management/job-structures/{clientId}
    → Returns: [{id, job_title, job_code}]

GET /api/employee-management/staff/{clientId}/{jobStructureId}
    → Returns: [{id, staff_id, full_name, department, job_title}]

GET /api/employee-management/departments/{clientId}
    → Returns: ['HR', 'Finance', 'Operations', ...]

GET /api/employee-management/service-locations/{clientId}
    → Returns: [{id, location_name, location_code}]

GET /api/employee-management/pay-grades/{jobStructureId}
    → Returns: [{id, grade_name, grade_code, total_compensation, emoluments}]

GET /api/employee-management/staff/{staffId}
    → Returns: Complete staff details with current grade, emoluments
```

#### Step 2.2: Termination Controller

**File**: `app/Http/Controllers/EmployeeManagement/TerminationController.php`

```php
POST /api/employee-management/termination
    Body: {
        staff_id, client_id, termination_type, notice_period_days,
        termination_date, transaction_date, actual_relieving_date,
        reason, exit_penalty, ppe_return, exit_interview, is_blacklisted
    }
    Process:
        1. Validate input
        2. Create staff_terminations record
        3. Update staff.status = 'terminated'/'resigned'
        4. Update staff.end_date = termination_date
        5. If is_blacklisted: Create staff_blacklist record
        6. Return success

POST /api/employee-management/termination/bulk
    Body: {file: Excel upload}
    Process:
        1. Parse Excel using ExcelUploadService
        2. Match staff by staff_id or name
        3. Return matched & unmatched arrays
        4. Frontend shows unmatched modal
        5. POST /termination/bulk/confirm with manual links
        6. Process all terminations in transaction
```

#### Step 2.3: Promotion Controller

**File**: `app/Http/Controllers/EmployeeManagement/PromotionController.php`

```php
GET /api/employee-management/promotion/{staffId}/current
    → Returns current: job_structure, pay_grade, emoluments, total_comp

POST /api/employee-management/promotion
    Body: {
        staff_id, client_id, new_job_structure_id, new_grade_id,
        promotion_date, effective_date, promotion_type, notes
    }
    Process:
        1. Get previous details from staff record
        2. Create staff_promotions record
        3. Update staff.pay_grade_structure_id = new_grade_id
        4. Update staff.job_title = new job_title
        5. Update staff.salary_effective_date = effective_date
        6. Return success

POST /api/employee-management/promotion/bulk
    → Similar to termination bulk upload
```

#### Step 2.4: Redeployment Controller

**File**: `app/Http/Controllers/EmployeeManagement/RedeploymentController.php`

```php
POST /api/employee-management/redeployment
    Body: {
        staff_id, client_id, redeployment_type,
        previous_*, new_*, redeployment_date, effective_date, reason
    }
    Process:
        1. Get previous details based on redeployment_type
        2. Create staff_redeployments record
        3. Update relevant staff fields:
           - department: Update staff.department
           - designation: Update staff.job_title
           - service_location: Update staff.service_location_id, staff.location
           - client: Update staff.client_id + all related fields
        4. Return success

POST /api/employee-management/redeployment/bulk
    → Bulk upload handler
```

#### Step 2.5: Caution/Warning/Suspension Controllers

Simple CRUD controllers with:

- `index()` - List records
- `store()` - Create new record
- `update()` - Update record
- `destroy()` - Delete record
- `bulk()` - Bulk upload

---

### Phase 3: Services Layer (Day 3-4)

#### Step 3.1: Excel Upload Service

**File**: `app/Services/ExcelUploadService.php`

```php
class ExcelUploadService
{
    public function parseTerminationFile($file, $clientId)
    {
        // Use PhpSpreadsheet to read Excel
        // Expected columns: staff_id, termination_type, notice_period_days,
        //                   termination_date, reason, exit_penalty, etc.

        $matched = [];
        $unmatched = [];

        foreach ($rows as $row) {
            $staff = $this->matchStaff($row['staff_id'], $row['name'], $clientId);

            if ($staff) {
                $matched[] = [
                    'staff' => $staff,
                    'data' => $row
                ];
            } else {
                $unmatched[] = [
                    'row_number' => $rowIndex,
                    'staff_id' => $row['staff_id'],
                    'name' => $row['name'],
                    'data' => $row
                ];
            }
        }

        return ['matched' => $matched, 'unmatched' => $unmatched];
    }

    private function matchStaff($staffId, $name, $clientId)
    {
        // Try exact match by staff_id
        if ($staffId) {
            $staff = Staff::where('staff_id', $staffId)
                         ->where('client_id', $clientId)
                         ->first();
            if ($staff) return $staff;
        }

        // Fuzzy match by name
        if ($name) {
            $staff = Staff::where('client_id', $clientId)
                         ->where(function($q) use ($name) {
                             $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%$name%"])
                               ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%$name%"]);
                         })
                         ->get();

            if ($staff->count() === 1) {
                return $staff->first();
            }
        }

        return null;
    }
}
```

#### Step 3.2: Template Generator Service

**File**: `app/Services/TemplateGeneratorService.php`

```php
class TemplateGeneratorService
{
    public function generateTerminationTemplate()
    {
        // Use PhpSpreadsheet to create Excel with headers:
        // staff_id | name | termination_type | notice_period_days |
        // termination_date | transaction_date | reason | exit_penalty | etc.

        // Add sample row with example data
        // Return downloadable Excel file
    }

    public function generatePromotionTemplate() { ... }
    public function generateRedeploymentTemplate() { ... }
}
```

---

### Phase 4: Frontend (Day 5-7)

#### Step 4.1: Layout with Navigation

**File**: `frontend/src/app/employee-management/layout.tsx`

```tsx
export default function EmployeeManagementLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar>
        <NavLink href="/employee-management/termination">Termination</NavLink>
        <NavLink href="/employee-management/caution">Caution</NavLink>
        <NavLink href="/employee-management/warning">Warning Letter</NavLink>
        <NavLink href="/employee-management/suspension">Suspension</NavLink>
        <NavLink href="/employee-management/promotion">Promotion</NavLink>
        <NavLink href="/employee-management/redeployment">Redeployment</NavLink>
        <NavLink href="/employee-management/recall">Recall</NavLink>
      </Sidebar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

#### Step 4.2: Reusable Components

**ClientSelector.tsx**

```tsx
export function ClientSelector({ value, onChange }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch("/api/employee-management/clients")
      .then((res) => res.json())
      .then((data) => setClients(data));
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select Client</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.organisation_name}
        </option>
      ))}
    </select>
  );
}
```

**JobCategorySelector.tsx** - Similar, loads when client selected

**StaffSelector.tsx** - Loads when job category selected

**ExcelUploader.tsx** - Drag-drop with file validation

**UnmatchedStaffModal.tsx**

```tsx
export function UnmatchedStaffModal({ unmatched, onLink }) {
  // Show table of unmatched rows
  // For each row: dropdown to select actual staff
  // Submit button to confirm manual links
}
```

#### Step 4.3: Termination Page

**File**: `frontend/src/app/employee-management/termination/page.tsx`

```tsx
"use client";
export default function TerminationPage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [client, setClient] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [staff, setStaff] = useState("");
  const [formData, setFormData] = useState({
    termination_type: "",
    notice_period_days: 0,
    // ... all fields
  });

  const handleSingleSubmit = async () => {
    const res = await fetch("/api/employee-management/termination", {
      method: "POST",
      body: JSON.stringify({ ...formData, staff_id: staff, client_id: client }),
    });
    // Handle success/error
  };

  const handleBulkUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", client);

    const res = await fetch("/api/employee-management/termination/bulk", {
      method: "POST",
      body: formData,
    });

    const { matched, unmatched } = await res.json();

    if (unmatched.length > 0) {
      // Show UnmatchedStaffModal
      setShowModal(true);
      setUnmatched(unmatched);
    } else {
      // All matched, confirm?
      confirmBulkSubmit(matched);
    }
  };

  return (
    <div>
      <h1>Employee Termination</h1>

      <div className="mb-4">
        <button onClick={() => setMode("single")}>Single Entry</button>
        <button onClick={() => setMode("bulk")}>Bulk Upload</button>
      </div>

      {mode === "single" && (
        <div>
          <ClientSelector value={client} onChange={setClient} />
          {client && (
            <JobCategorySelector
              clientId={client}
              value={jobCategory}
              onChange={setJobCategory}
            />
          )}
          {jobCategory && (
            <StaffSelector
              clientId={client}
              jobCategoryId={jobCategory}
              value={staff}
              onChange={setStaff}
            />
          )}

          {/* Termination form fields */}
          <form onSubmit={handleSingleSubmit}>
            {/* All form fields */}
            <button type="submit">Submit Termination</button>
          </form>
        </div>
      )}

      {mode === "bulk" && (
        <div>
          <ClientSelector value={client} onChange={setClient} />
          <TemplateDownloader type="termination" />
          <ExcelUploader onUpload={handleBulkUpload} />
        </div>
      )}

      <UnmatchedStaffModal
        show={showModal}
        unmatched={unmatched}
        onConfirm={handleManualLink}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
```

#### Step 4.4: Promotion Page

Similar structure with:

- Current grade/emoluments display
- New grade selector
- Emolument comparison table
- Effective date picker

#### Step 4.5: Redeployment Page

Tabs for each type:

- **By Department**: Show department dropdown
- **By Designation**: Show designation input
- **By Service Location**: Show SOL office + location dropdowns
- **By Client**: Show all client transfer fields

---

### Phase 5: Testing (Day 8-9)

#### Local Testing Checklist

- [ ] All migrations run successfully
- [ ] Models have correct relationships
- [ ] API endpoints return expected data
- [ ] Client dropdown loads
- [ ] Job category dropdown filtered by client
- [ ] Staff selector filtered by client + job category
- [ ] Single entry termination creates record
- [ ] Staff status updates to 'terminated'
- [ ] Blacklist table populated when checked
- [ ] Excel template downloads
- [ ] Excel upload parses correctly
- [ ] Staff matching works (by ID and name)
- [ ] Unmatched modal shows and allows linking
- [ ] Bulk submit processes all entries
- [ ] Promotion updates staff grade
- [ ] Emoluments display correctly
- [ ] Redeployment updates correct fields based on type
- [ ] All validations work
- [ ] Error messages display properly

#### Test with Sample Data

```sql
-- Insert test client
INSERT INTO clients (id, organisation_name, slug, prefix, status)
VALUES (999, 'Test Company Ltd', 'test-company', 'TST', 'active');

-- Insert test job structure
INSERT INTO job_structures (id, client_id, job_code, job_title, is_active)
VALUES (999, 999, 'TESTJOB', 'Test Position', 1);

-- Insert test staff
INSERT INTO staff (id, client_id, staff_id, employee_code, first_name, last_name,
                   email, gender, entry_date, status, appointment_status, employment_type)
VALUES (999, 999, 'TST001', 'EMP001', 'John', 'Doe',
        'john.doe@test.com', 'male', '2024-01-01', 'active', 'confirmed', 'full_time');
```

---

### Phase 6: Deployment (Day 10)

Follow `DEPLOYMENT_CHECKLIST.md`:

1. **Commit all changes**

```bash
git add .
git commit -m "Add Employee Management module - Termination, Promotion, Redeployment, Caution, Warning, Suspension, Recall"
git push origin main
```

2. **SSH to production**

```bash
ssh root@nc-ph-4747.mysol360.com
cd /root/hris-app
```

3. **Deploy**

```bash
# Safe deployment
bash ./deployment/sync-to-production.sh

# Run migrations
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan migrate

# Clear caches
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan config:clear
docker-compose -f docker-compose.prod.yml exec laravel-api php artisan cache:clear

# Rebuild if needed
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **Test production**

- Visit https://mysol360.com/employee-management
- Test termination
- Test bulk upload
- Check database records

---

## ⚠️ Critical Notes

### Database Column Names - ALWAYS REFER TO `DATABASE_SCHEMA_REFERENCE.md`

- Client ID: `client_id` (NOT clientId, ClientId, etc.)
- Staff ID: `staff_id` (unique identifier)
- Employee Code: `employee_code` (alternative ID)
- Job Title: `job_title` (in staff table)
- Department: `department` (in staff table)
- Status: `status` (enum: active, terminated, etc.)

### Excel Upload Matching Priority

1. **First**: Exact match on `staff_id`
2. **Second**: Fuzzy match on name (CONCAT first_name, last_name)
3. **Third**: Manual selection via modal

### Status Updates

When terminating:

```php
$staff->status = 'terminated'; // or 'resigned'
$staff->end_date = $request->termination_date;
$staff->save();
```

### Blacklist Logic

```php
if ($request->is_blacklisted) {
    StaffBlacklist::create([
        'staff_id' => $staff->id,
        'termination_id' => $termination->id,
        'staff_name' => $staff->full_name,
        'staff_code' => $staff->staff_id,
        'client_id' => $staff->client_id,
        'reason' => $request->reason,
        'blacklisted_date' => now(),
        'blacklisted_by' => auth()->id()
    ]);
}
```

### Promotion Logic

```php
// Save previous details
$promotion = StaffPromotion::create([
    'staff_id' => $staff->id,
    'client_id' => $staff->client_id,
    'previous_job_structure_id' => $staff->job_structure_id,
    'previous_grade_id' => $staff->pay_grade_structure_id,
    'previous_total_compensation' => $staff->payGrade->total_compensation,
    'new_job_structure_id' => $request->new_job_structure_id,
    'new_grade_id' => $request->new_grade_id,
    'new_total_compensation' => $newGrade->total_compensation,
    'promotion_date' => $request->promotion_date,
    'effective_date' => $request->effective_date
]);

// Update staff
$staff->pay_grade_structure_id = $request->new_grade_id;
$staff->salary_effective_date = $request->effective_date;
$staff->save();
```

---

## 📚 Reference Documents

1. **DATABASE_SCHEMA_REFERENCE.md** - Table structures, column names, relationships
2. **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment guide
3. **DEVELOPMENT_WORKFLOW.md** - General development process
4. **QUICK_REFERENCE.md** - Quick commands

---

## 🎯 Success Criteria

Module is complete when:

- ✅ All 8 action types functional (Termination, Caution, Warning, Suspension, Promotion, Redeployment, Recall, Query)
- ✅ Single entry forms work for all actions
- ✅ Excel bulk upload works for all actions
- ✅ Staff matching by ID and name works reliably
- ✅ Unmatched staff modal allows manual linking
- ✅ Template download buttons work
- ✅ All database updates happen correctly
- ✅ Tested locally with sample data
- ✅ Deployed to production successfully
- ✅ Production testing passes

---

**Next Steps**:

1. Review this strategy
2. Start with Phase 1 (Database migrations)
3. Test each phase before moving to next
4. Refer to `DATABASE_SCHEMA_REFERENCE.md` constantly

**Last Updated**: November 19, 2025
