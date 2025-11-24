# CRITICAL CORRECTIONS - Exact Database Column Names

## ⚠️ NOMENCLATURE ERRORS FOUND AND CORRECTED

### 1. **clients** Table

❌ **WRONG:** `client_name`, `client_code`  
✅ **CORRECT:** `organisation_name`, `prefix`

**Columns:**

- `id` - Primary key
- `organisation_name` - Client organization name
- `prefix` - Client prefix/code
- `status` - Status
- Other columns: cac_registration_number, slug, payment_terms, contact_person_name, etc.

### 2. **job_structures** Table

❌ **WRONG:** `name`  
✅ **CORRECT:** `job_title`

**Columns:**

- `id` - Primary key
- `client_id` - FK to clients
- `job_code` - Job code
- `job_title` - Job title (NOT "name")
- `description` - Description
- `contract_type` - enum('employment','service')
- `contract_nature` - Contract nature
- `pay_structures` - JSON array
- `is_active` - Active status

### 3. **pay_grade_structures** Table

❌ **WRONG:** `grade_level`  
✅ **CORRECT:** No `grade_level` column exists!

**Columns:**

- `id` - Primary key
- `job_structure_id` - FK to job_structures
- `grade_name` - Grade name (e.g., "OL", "Grade 2")
- `grade_code` - Grade code
- `pay_structure_type` - Pay structure type
- `emoluments` - JSON object with components
- `total_compensation` - Total amount
- `basic_salary` - Basic salary
- `transport_allowance` - Transport allowance
- `housing_allowance` - Housing allowance
- `meal_allowance` - Meal allowance
- `currency` - Currency code
- `is_active` - Active status

### 4. **service_locations** Table

✅ **CORRECT:** Most columns are correct

**Columns:**

- `id` - Primary key
- `location_code` - Location code
- `unique_id` - Unique identifier
- `location_name` - Location name
- `short_name` - Short name
- `address` - Address (NOT full_address)
- `full_address` - Full address (exists separately)
- `city` - City
- `state` - State
- `country` - Country
- `sol_region` - SOL region
- `sol_zone` - SOL zone
- `client_id` - FK to clients
- `sol_office_id` - FK to sol_offices
- `is_active` - Active status

### 5. **staff_terminations** Table

❌ **WRONG (in TerminationController):** `relieving_date`  
✅ **CORRECT:** `actual_relieving_date`

❌ **WRONG (in TerminationController):** `ppe_return_status`, `exit_interview_status`  
✅ **CORRECT:** `ppe_return`, `exit_interview`

**Correct columns:**

- `termination_type` - enum('terminated', 'death', 'resignation')
- `notice_period_days` - integer
- `termination_date` - date
- `transaction_date` - date
- `actual_relieving_date` - date (NOT relieving_date)
- `reason` - text
- `exit_penalty` - enum('yes', 'no')
- `ppe_return` - enum('n/a', 'yes', 'no') (NOT ppe_return_status)
- `exit_interview` - enum('n/a', 'yes', 'no') (NOT exit_interview_status)
- `is_blacklisted` - boolean

---

## REQUIRED FIXES

### Fix 1: HelperController.php

```php
// Line 20 - WRONG
$clients = Client::select('id', 'client_name', 'client_code')

// CORRECT
$clients = Client::select('id', 'organisation_name', 'prefix')
```

```php
// Line 33 - WRONG
$query = JobStructure::select('id', 'client_id', 'name', 'description');

// CORRECT
$query = JobStructure::select('id', 'client_id', 'job_title', 'description');
```

```php
// Line 52 - WRONG
$query = PayGradeStructure::select('id', 'job_structure_id', 'grade_level', 'grade_name', 'emoluments');

// CORRECT
$query = PayGradeStructure::select('id', 'job_structure_id', 'grade_name', 'grade_code', 'emoluments', 'total_compensation');
```

```php
// Line 63 - WRONG
$payGrades = $query->orderBy('grade_level')->get();

// CORRECT
$payGrades = $query->orderBy('grade_name')->get();
```

### Fix 2: TerminationController.php

```php
// Lines with 'relieving_date' - WRONG
'relieving_date' => 'nullable|date',
'relieving_date' => $request->relieving_date,

// CORRECT
'actual_relieving_date' => 'nullable|date',
'actual_relieving_date' => $request->actual_relieving_date,
```

```php
// Lines with 'ppe_return_status', 'exit_interview_status' - WRONG
'ppe_return_status' => ['nullable', Rule::in([...])],
'exit_interview_status' => ['nullable', Rule::in([...])],

// CORRECT
'ppe_return' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
'exit_interview' => ['nullable', Rule::in(['n/a', 'yes', 'no'])],
```

### Fix 3: StaffTermination Model

```php
// In fillable array - WRONG
'relieving_date',
'ppe_return_status',
'exit_interview_status',

// CORRECT
'actual_relieving_date',
'ppe_return',
'exit_interview',
```

```php
// In casts array - add
'actual_relieving_date' => 'date',
```

---

## VALIDATION

All other tables (staff_promotions, staff_redeployments, staff_cautions, staff_warnings, staff_suspensions, staff_blacklist) appear to have correct column naming as they were designed based on the migrations, not existing tables.

**Next Step:** Apply these fixes before proceeding with Bulk Upload Service and Frontend implementation.
