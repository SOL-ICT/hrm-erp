# Database Schema Reference - Employee Management Module

**Last Updated:** 2025-11-19  
**Purpose:** Canonical reference for table/column names used in Employee Management implementation

---

## Core Hierarchy (Correct Understanding)

```
clients
  └─ job_structures (Job Family - parent concept tied to client)
       └─ pay_grade_structures (Grades with emoluments under each job structure)
            └─ staff (employees linked to a grade via pay_grade_structure_id)
```

**Key Point:** `job_categories` table exists but is **NOT used** for this module. The primary grouping is `job_structures` → `pay_grade_structures`.

---

## Table: `clients`

**Purpose:** Client organizations that SOL provides HR services to

### Key Columns

| Column      | Type            | Description   |
| ----------- | --------------- | ------------- |
| `id`        | bigint unsigned | Primary key   |
| `name`      | varchar(255)    | Client name   |
| `code`      | varchar(50)     | Client code   |
| `is_active` | tinyint(1)      | Active status |

### Usage

- Dropdown: `SELECT id, name, code FROM clients WHERE is_active=1 ORDER BY name`

---

## Table: `job_structures`

**Purpose:** Job Families/Structures per client (parent concept)

### Key Columns

| Column           | Type                         | Description                       |
| ---------------- | ---------------------------- | --------------------------------- |
| `id`             | bigint unsigned              | Primary key                       |
| `client_id`      | bigint unsigned              | FK → clients.id                   |
| `job_code`       | varchar(20)                  | Job code                          |
| `job_title`      | varchar(255)                 | Job title/name                    |
| `description`    | text                         | Description                       |
| `contract_type`  | enum('employment','service') | Contract type                     |
| `pay_structures` | json                         | JSON array of pay structure types |
| `is_active`      | tinyint(1)                   | Active status                     |

### Sample Data

```
id=17, client_id=1, job_code='OPERATIVE', job_title='OL', pay_structures='["T2"]'
id=20, client_id=25, job_code='DRIVER', job_title='DRIVER', pay_structures='["T3"]'
```

### Usage

- Load job structures for client: `SELECT * FROM job_structures WHERE client_id=? AND is_active=1`

---

## Table: `pay_grade_structures`

**Purpose:** Grades/levels under each job structure with emolument breakdowns

### Key Columns

| Column                | Type            | Description                                     |
| --------------------- | --------------- | ----------------------------------------------- |
| `id`                  | bigint unsigned | Primary key                                     |
| `job_structure_id`    | bigint unsigned | FK → job_structures.id (parent job family)      |
| `grade_name`          | varchar(100)    | Grade name (e.g., "OL", "Grade 2", "Associate") |
| `grade_code`          | varchar(20)     | Grade code                                      |
| `pay_structure_type`  | varchar(10)     | Pay structure type                              |
| `emoluments`          | json            | **JSON object with emolument components**       |
| `total_compensation`  | decimal(12,2)   | Total compensation amount                       |
| `basic_salary`        | decimal(12,2)   | Basic salary                                    |
| `transport_allowance` | decimal(12,2)   | Transport allowance                             |
| `housing_allowance`   | decimal(12,2)   | Housing allowance                               |
| `meal_allowance`      | decimal(12,2)   | Meal allowance                                  |
| `currency`            | varchar(3)      | Currency code (default: NGN)                    |
| `is_active`           | tinyint(1)      | Active status                                   |

### Sample Data

```
id=19, grade_name='OL', grade_code='OL1', job_structure_id=17, total_compensation=165000.00
id=20, grade_name='Grade 2', grade_code='OL2', job_structure_id=17, total_compensation=180000.00
id=21, grade_name='Associate', grade_code='ASSOCIATE 1', job_structure_id=18, total_compensation=98000.00
```

### Usage

- Load grades for job structure: `SELECT * FROM pay_grade_structures WHERE job_structure_id=? AND is_active=1 ORDER BY grade_name`
- Get emoluments for promotion comparison: `SELECT emoluments, total_compensation FROM pay_grade_structures WHERE id=?`

---

## Table: `staff`

**Purpose:** Employee records

### Key Columns for Employee Management

| Column                   | Type            | Description                                            |
| ------------------------ | --------------- | ------------------------------------------------------ |
| `id`                     | bigint unsigned | Primary key                                            |
| `staff_id`               | varchar(20)     | **Unique staff identifier** (for Excel matching)       |
| `employee_code`          | varchar(20)     | Employee code                                          |
| `client_id`              | bigint unsigned | FK → clients.id                                        |
| `service_location_id`    | bigint unsigned | FK → service_locations.id                              |
| `staff_type_id`          | bigint unsigned | FK → client_staff_types.id                             |
| `pay_grade_structure_id` | bigint unsigned | **FK → pay_grade_structures.id (current grade)**       |
| `first_name`             | varchar(255)    | First name (for fuzzy matching)                        |
| `middle_name`            | varchar(255)    | Middle name                                            |
| `last_name`              | varchar(255)    | Last name (for fuzzy matching)                         |
| `email`                  | varchar(255)    | Email                                                  |
| `job_title`              | varchar(255)    | **Job title/designation** (text field, not FK)         |
| `department`             | varchar(255)    | **Department** (text field, not FK)                    |
| `location`               | varchar(255)    | Location description                                   |
| `status`                 | enum            | 'active','inactive','terminated','resigned','on_leave' |
| `entry_date`             | date            | Entry/start date                                       |
| `end_date`               | date            | End date (nullable)                                    |
| `appointment_status`     | enum            | 'probation','confirmed','contract','intern'            |

### Sample Data

```
id=2, staff_id='SOLADMIN001', first_name='System', last_name='Administrator', client_id=1, pay_grade_structure_id=19
id=3, staff_id='SOLSOL001', first_name='Damilola', last_name='Adelani', client_id=1, pay_grade_structure_id=19
id=10, staff_id='SOL/FDC/002', first_name='Benjamin', last_name='Godfrey', client_id=25, pay_grade_structure_id=23
```

### Usage

- Load staff for client & job structure:
  ```sql
  SELECT s.* FROM staff s
  INNER JOIN pay_grade_structures pgs ON s.pay_grade_structure_id = pgs.id
  WHERE s.client_id=? AND pgs.job_structure_id=? AND s.status='active'
  ```
- Match by staff_id: `SELECT * FROM staff WHERE staff_id=?`
- Fuzzy match by name: `SELECT * FROM staff WHERE client_id=? AND (CONCAT(first_name,' ',last_name) LIKE ? OR CONCAT(last_name,' ',first_name) LIKE ?)`

---

## Table: `service_locations`

**Purpose:** SOL service locations (for redeployment by service location)

### Key Columns

| Column          | Type            | Description         |
| --------------- | --------------- | ------------------- |
| `id`            | bigint unsigned | Primary key         |
| `location_code` | varchar(20)     | Location code       |
| `location_name` | varchar(255)    | Location name       |
| `short_name`    | varchar(100)    | Short name          |
| `client_id`     | bigint unsigned | FK → clients.id     |
| `sol_office_id` | bigint unsigned | FK → sol_offices.id |
| `state`         | varchar(100)    | State               |
| `city`          | varchar(100)    | City                |
| `full_address`  | text            | Full address        |
| `sol_region`    | varchar(100)    | SOL region          |
| `sol_zone`      | varchar(100)    | SOL zone            |
| `is_active`     | tinyint(1)      | Active status       |

### Sample Data

```
id=1, location_code='ACC-LAG-001', location_name='Access Bank Victoria Island Head Office', client_id=3
id=2, location_code='ACC-LAG-002', location_name='Access Bank Ikeja Branch', client_id=3
```

### Usage

- Load locations for client: `SELECT * FROM service_locations WHERE client_id=? AND is_active=1`
- For SOL-wide redeployment: `SELECT * FROM service_locations WHERE is_active=1 ORDER BY location_name`

---

## Employee Management Tables (To Be Created)

### `staff_terminations`

| Column                  | Type                                     | Notes                      |
| ----------------------- | ---------------------------------------- | -------------------------- |
| `id`                    | bigint unsigned                          | PK                         |
| `staff_id`              | bigint unsigned                          | FK → staff.id              |
| `client_id`             | bigint unsigned                          | FK → clients.id            |
| `termination_type`      | enum('terminated','death','resignation') | Type                       |
| `notice_period_days`    | int                                      | Max 30                     |
| `termination_date`      | date                                     |                            |
| `transaction_date`      | date                                     |                            |
| `actual_relieving_date` | date                                     |                            |
| `reason`                | text                                     | Reason                     |
| `exit_penalty`          | enum('yes','no')                         |                            |
| `ppe_return`            | enum('n/a','yes','no')                   |                            |
| `exit_interview`        | enum('n/a','yes','no')                   |                            |
| `is_blacklisted`        | tinyint(1)                               | If true, copy to blacklist |
| `processed_by`          | bigint unsigned                          | FK → users.id              |
| `created_at`            | timestamp                                |                            |
| `updated_at`            | timestamp                                |                            |

### `staff_blacklist`

| Column                   | Type            | Notes                      |
| ------------------------ | --------------- | -------------------------- |
| `id`                     | bigint unsigned | PK                         |
| `staff_id`               | bigint unsigned | FK → staff.id              |
| `client_id`              | bigint unsigned | FK → clients.id            |
| `termination_id`         | bigint unsigned | FK → staff_terminations.id |
| `blacklist_date`         | date            |                            |
| `reason`                 | text            |                            |
| `staff_details_snapshot` | json            | Copy of staff record       |
| `created_at`             | timestamp       |                            |

### `staff_promotions`

| Column                       | Type            | Notes                        |
| ---------------------------- | --------------- | ---------------------------- |
| `id`                         | bigint unsigned | PK                           |
| `staff_id`                   | bigint unsigned | FK → staff.id                |
| `client_id`                  | bigint unsigned | FK → clients.id              |
| `old_job_structure_id`       | bigint unsigned | FK → job_structures.id       |
| `old_pay_grade_structure_id` | bigint unsigned | FK → pay_grade_structures.id |
| `new_job_structure_id`       | bigint unsigned | FK → job_structures.id       |
| `new_pay_grade_structure_id` | bigint unsigned | FK → pay_grade_structures.id |
| `effective_date`             | date            |                              |
| `old_emoluments`             | json            | Snapshot                     |
| `new_emoluments`             | json            | Snapshot                     |
| `processed_by`               | bigint unsigned | FK → users.id                |
| `created_at`                 | timestamp       |                              |
| `updated_at`                 | timestamp       |                              |

### `staff_redeployments`

| Column                    | Type                                                         | Notes                     |
| ------------------------- | ------------------------------------------------------------ | ------------------------- |
| `id`                      | bigint unsigned                                              | PK                        |
| `staff_id`                | bigint unsigned                                              | FK → staff.id             |
| `client_id`               | bigint unsigned                                              | FK → clients.id           |
| `redeployment_type`       | enum('department','designation','service_location','client') | Type                      |
| `old_department`          | varchar(255)                                                 |                           |
| `new_department`          | varchar(255)                                                 |                           |
| `old_designation`         | varchar(255)                                                 |                           |
| `new_designation`         | varchar(255)                                                 |                           |
| `old_service_location_id` | bigint unsigned                                              | FK → service_locations.id |
| `new_service_location_id` | bigint unsigned                                              | FK → service_locations.id |
| `old_client_id`           | bigint unsigned                                              | FK → clients.id           |
| `new_client_id`           | bigint unsigned                                              | FK → clients.id           |
| `effective_date`          | date                                                         |                           |
| `reason`                  | text                                                         |                           |
| `processed_by`            | bigint unsigned                                              | FK → users.id             |
| `created_at`              | timestamp                                                    |                           |
| `updated_at`              | timestamp                                                    |                           |

### `staff_cautions`, `staff_warnings`, `staff_suspensions`

Simple record-keeping tables with:

- `staff_id`, `client_id`, `reason`, `issued_date`, `issued_by`, `status`, `notes`, `created_at`, `updated_at`

---

## UI Workflow Queries (Quick Reference)

### Step 1: Select Client

```sql
SELECT id, name, code FROM clients WHERE is_active=1 ORDER BY name;
```

### Step 2: Load Job Structures for Client

```sql
SELECT id, job_code, job_title, description
FROM job_structures
WHERE client_id=:client_id AND is_active=1;
```

### Step 3: Load Grades for Job Structure

```sql
SELECT id, grade_name, grade_code, total_compensation, emoluments
FROM pay_grade_structures
WHERE job_structure_id=:job_structure_id AND is_active=1
ORDER BY grade_name;
```

### Step 4: Load Staff for Client + Job Structure

```sql
SELECT s.id, s.staff_id, s.first_name, s.last_name, s.email,
       s.job_title, s.department, s.location,
       pgs.grade_name, pgs.grade_code
FROM staff s
INNER JOIN pay_grade_structures pgs ON s.pay_grade_structure_id = pgs.id
WHERE s.client_id=:client_id
  AND pgs.job_structure_id=:job_structure_id
  AND s.status='active';
```

### For Promotions: Load Current Grade Details

```sql
SELECT
  js.job_title as current_job_structure,
  pgs.grade_name as current_grade,
  pgs.emoluments as current_emoluments,
  pgs.total_compensation as current_total
FROM staff s
INNER JOIN pay_grade_structures pgs ON s.pay_grade_structure_id = pgs.id
INNER JOIN job_structures js ON pgs.job_structure_id = js.id
WHERE s.id=:staff_id;
```

### For Redeployments: Load Service Locations

```sql
SELECT id, location_code, location_name, short_name, state, city
FROM service_locations
WHERE client_id=:client_id AND is_active=1
ORDER BY location_name;
```

### For Redeployments: Get Unique Departments/Designations for Client

```sql
-- Departments
SELECT DISTINCT department
FROM staff
WHERE client_id=:client_id AND department IS NOT NULL
ORDER BY department;

-- Designations
SELECT DISTINCT job_title
FROM staff
WHERE client_id=:client_id AND job_title IS NOT NULL
ORDER BY job_title;
```

---

## Excel Bulk Upload Matching Strategy

### Primary Match (Exact)

```sql
SELECT * FROM staff WHERE staff_id = :excel_staff_id;
```

### Fallback Match (Fuzzy Name)

```sql
SELECT * FROM staff
WHERE client_id = :client_id
  AND (
    CONCAT(first_name, ' ', last_name) LIKE :name_pattern
    OR CONCAT(last_name, ' ', first_name) LIKE :name_pattern
  )
LIMIT 10;
```

Where `:name_pattern` = `'%' . $excelName . '%'`

### Return Unmatched for Manual Linking

If no match found, add to `unmatched_rows` array with Excel row data for UI modal.

---

## Cross-Client Redeployment Logic (IMPORTANT)

### Business Rule

When redeploying staff to a **different client**, we preserve full audit trail while allowing new client to have different structure.

### Implementation Strategy

1. **Record redeployment in `staff_redeployments`:**

   - `old_client_id`, `new_client_id`
   - `old_department`, `new_department`
   - `old_designation`, `new_designation`
   - `old_service_location_id`, `new_service_location_id`
   - This creates **permanent audit trail** of the move

2. **Update `staff` table:**

   - `client_id` = new_client_id
   - `pay_grade_structure_id` = new grade (must belong to new client's job_structure)
   - `department`, `job_title`, `service_location_id` = new values
   - Keep `staff_id` unchanged for continuity

3. **Validation:**

   - Ensure `new_pay_grade_structure_id.job_structure.client_id == new_client_id`
   - Wrap in DB transaction (redeployment insert + staff update)

4. **UI Flow:**

   - Select staff (from old client)
   - Choose new client → load job_structures → select job_structure → load pay_grades → select grade
   - Choose new department, designation, service_location
   - Preview old vs new details → confirm

5. **Audit Preservation:**
   - Old client invoices/payroll still reference same `staff.id` (FK intact)
   - `staff_redeployments.old_client_id` allows historical queries
   - Consider adding `old_emoluments` and `new_emoluments` JSON columns for salary audit

---

## Important Notes

1. **NO job_categories:** Do not query or reference `job_categories` table for this module
2. **Grade = pay_grade_structures:** Always use `pay_grade_structures` when referring to "grades"
3. **Job Structure = Job Family:** `job_structures` is the parent concept
4. **Department/Designation:** Stored as text in `staff.department` and `staff.job_title` (no FK tables)
5. **Staff Matching:** Use `staff_id` first, then fuzzy name match as fallback
6. **Emoluments:** Stored as JSON in `pay_grade_structures.emoluments` column
7. **Cross-Client Redeployment:** Preserve old client data in `staff_redeployments` table, update staff to new client structure (see section above)

---

**Always refer to this document when writing queries or creating migrations to avoid column name mistakes.**
