# 🔍 PRE-MIGRATION VALIDATION CHECKLIST

**Date:** November 21, 2025  
**Purpose:** Comprehensive review of all migrations and seeders before execution  
**Status:** PENDING REVIEW

---

## 📂 FILES CREATED

### Migrations (8 files)

1. ✅ `2025_11_21_000001_add_payroll_columns_to_emolument_components.php`
2. ✅ `2025_11_21_000002_remove_redundant_columns_from_pay_grade_structures.php`
3. ✅ `2025_11_21_000003_create_tax_brackets_table.php`
4. ✅ `2025_11_21_000004_create_payroll_calculation_formulas_table.php`
5. ✅ `2025_11_21_000005_create_attendance_uploads_table.php`
6. ✅ `2025_11_21_000006_create_staff_attendance_table.php`
7. ✅ `2025_11_21_000007_create_payroll_runs_table.php`
8. ✅ `2025_11_21_000008_create_payroll_items_table.php`

### Seeders (3 files)

1. ✅ `UniversalPayrollComponentsSeeder.php`
2. ✅ `TaxBracketsSeeder.php`
3. ✅ `PayrollCalculationFormulasSeeder.php`

---

## 🔐 FOREIGN KEY VALIDATION

### Migration 000001: emolument_components

- **Dependencies:** NONE (modifies existing table)
- **Foreign Keys:** NONE
- **Status:** ✅ Safe to run first

### Migration 000002: pay_grade_structures

- **Dependencies:** NONE (modifies existing table)
- **Foreign Keys:** NONE
- **Status:** ✅ Safe to run second

### Migration 000003: tax_brackets

- **Dependencies:** NONE (standalone table)
- **Foreign Keys:** NONE
- **Status:** ✅ Safe to run third

### Migration 000004: payroll_calculation_formulas

- **Dependencies:** `clients`, `job_structures` (existing tables)
- **Foreign Keys:**
  - `client_id` → `clients(id)` ON DELETE CASCADE
  - `job_structure_id` → `job_structures(id)` ON DELETE CASCADE
- **Validation:**
  - ✅ `clients` table exists
  - ✅ `job_structures` table exists
- **Status:** ✅ Safe to run fourth

### Migration 000005: attendance_uploads

- **Dependencies:** `clients`, `users` (existing tables)
- **Foreign Keys:**
  - `client_id` → `clients(id)` ON DELETE CASCADE
  - `uploaded_by` → `users(id)` ON DELETE SET NULL
- **Validation:**
  - ✅ `clients` table exists
  - ✅ `users` table exists
- **Status:** ✅ Safe to run fifth

### Migration 000006: staff_attendance

- **Dependencies:** `attendance_uploads`, `staff`, `clients` (000005 + existing)
- **Foreign Keys:**
  - `attendance_upload_id` → `attendance_uploads(id)` ON DELETE CASCADE
  - `staff_id` → `staff(id)` ON DELETE CASCADE
  - `client_id` → `clients(id)` ON DELETE CASCADE
- **Validation:**
  - ✅ `attendance_uploads` created in 000005
  - ✅ `staff` table exists
  - ✅ `clients` table exists
- **Status:** ✅ Safe to run sixth (AFTER 000005)

### Migration 000007: payroll_runs

- **Dependencies:** `clients`, `attendance_uploads`, `users` (000005 + existing)
- **Foreign Keys:**
  - `client_id` → `clients(id)` ON DELETE CASCADE
  - `attendance_upload_id` → `attendance_uploads(id)` ON DELETE CASCADE
  - `created_by` → `users(id)` ON DELETE SET NULL
  - `approved_by` → `users(id)` ON DELETE SET NULL
- **Validation:**
  - ✅ `clients` table exists
  - ✅ `attendance_uploads` created in 000005
  - ✅ `users` table exists
- **Status:** ✅ Safe to run seventh (AFTER 000005)

### Migration 000008: payroll_items

- **Dependencies:** `payroll_runs`, `staff`, `clients`, `pay_grade_structures`, `staff_attendance` (000006, 000007 + existing)
- **Foreign Keys:**
  - `payroll_run_id` → `payroll_runs(id)` ON DELETE CASCADE
  - `staff_id` → `staff(id)` ON DELETE CASCADE
  - `client_id` → `clients(id)` ON DELETE CASCADE
  - `pay_grade_structure_id` → `pay_grade_structures(id)` ON DELETE RESTRICT
  - `attendance_id` → `staff_attendance(id)` ON DELETE RESTRICT
- **Validation:**
  - ✅ `payroll_runs` created in 000007
  - ✅ `staff` table exists
  - ✅ `clients` table exists
  - ✅ `pay_grade_structures` table exists
  - ✅ `staff_attendance` created in 000006
- **Status:** ✅ Safe to run eighth (AFTER 000006 & 000007)

---

## 🔑 UNIQUE CONSTRAINT VALIDATION

| Table                          | Unique Constraint          | Fields                                    | Purpose                                   |
| ------------------------------ | -------------------------- | ----------------------------------------- | ----------------------------------------- |
| `payroll_calculation_formulas` | `unique_formula_scope`     | formula_code, client_id, job_structure_id | One formula per scope                     |
| `attendance_uploads`           | `unique_client_month_year` | client_id, month, year                    | One upload per client per month           |
| `staff_attendance`             | `unique_staff_month_year`  | staff_id, month, year                     | One attendance record per staff per month |
| `payroll_runs`                 | `unique_client_month_year` | client_id, month, year                    | One payroll run per client per month      |
| `payroll_items`                | `unique_payroll_staff`     | payroll_run_id, staff_id                  | One payroll item per staff per run        |

**Validation:** ✅ All constraints prevent logical duplicates

---

## 📊 INDEX VALIDATION

### Migration 000001: emolument_components

- ✅ `idx_universal_active` (is_universal_template, is_active)
- ✅ `idx_pensionable_active` (is_pensionable, is_active)
- ✅ `idx_category_active` (payroll_category, is_active)

### Migration 000003: tax_brackets

- ✅ `idx_active_effective` (is_active, effective_from, effective_to)
- ✅ `idx_tier_active` (tier_number, is_active)

### Migration 000004: payroll_calculation_formulas

- ✅ `idx_client_job` (client_id, job_structure_id)
- ✅ `idx_code_active` (formula_code, is_active)

### Migration 000005: attendance_uploads

- ✅ `idx_status` (status)
- ✅ `idx_client_period` (client_id, year, month)

### Migration 000006: staff_attendance

- ✅ `idx_upload` (attendance_upload_id)
- ✅ `idx_staff_period` (staff_id, year, month)
- ✅ `idx_client_period` (client_id, year, month)

### Migration 000007: payroll_runs

- ✅ `idx_status` (status)
- ✅ `idx_client_period` (client_id, year, month)

### Migration 000008: payroll_items

- ✅ `idx_payroll_run` (payroll_run_id)
- ✅ `idx_staff` (staff_id)
- ✅ `idx_client` (client_id)

**Purpose:** All indexes optimize common query patterns (filters, joins, lookups)

---

## 🗂️ SEEDER VALIDATION

### UniversalPayrollComponentsSeeder

**Expected Behavior:**

- Updates existing `emolument_components` records
- Does NOT truncate (preserves existing 56 components)
- Updates 11 specific component codes

**Components to Update:**

1. BASIC_SALARY (pensionable, salary)
2. HOUSING (pensionable, allowance)
3. TRANSPORT (pensionable, allowance)
4. OTHER_ALLOWANCES (allowance)
5. MEAL_ALLOWANCE (allowance)
6. LEAVE_ALLOWANCE (deduction)
7. THIRTEENTH_MONTH (deduction)
8. OTJ_TELEPHONE (reimbursable)
9. OTJ_TRANSPORT (reimbursable)
10. UNIFORM (reimbursable)
11. CLIENT_OP_FUND (reimbursable)

**Validation Checks:**

- ⚠️ **RISK:** If any component_code doesn't exist, seeder logs warning but continues
- ✅ **MITIGATION:** Seeder has defensive checks and reports missing components
- ✅ **TRANSACTION:** Wrapped in DB transaction (rollback on error)

### TaxBracketsSeeder

**Expected Behavior:**

- Truncates existing `tax_brackets` table
- Inserts 6 new Nigerian tax tiers

**Data Integrity:**

```
Tier 1: ₦0 - ₦300,000 @ 0%
Tier 2: ₦300,000 - ₦600,000 @ 15%
Tier 3: ₦600,000 - ₦1,100,000 @ 18%
Tier 4: ₦1,100,000 - ₦1,600,000 @ 21%
Tier 5: ₦1,600,000 - ₦3,200,000 @ 23%
Tier 6: ₦3,200,000+ @ 25%
```

**Validation Checks:**

- ✅ No gaps in income ranges
- ✅ Tier 6 has `income_to = NULL` (no upper limit)
- ✅ Effective dates set (2025-01-01)
- ✅ **TRANSACTION:** Wrapped in DB transaction

### PayrollCalculationFormulasSeeder

**Expected Behavior:**

- Deletes existing system default formulas
- Inserts 12 new formulas

**Formulas:**

1. ANNUAL_GROSS
2. ANNUAL_REIMBURSABLES
3. PENSIONABLE_AMOUNT
4. MONTHLY_GROSS
5. MONTHLY_REIMBURSABLES
6. TAXABLE_INCOME
7. PAYE
8. PENSION
9. LEAVE_ALLOWANCE_DEDUCTION
10. THIRTEENTH_MONTH_DEDUCTION
11. NET_PAY
12. CREDIT_TO_BANK

**Validation Checks:**

- ✅ All formulas have `is_system_default = TRUE`
- ✅ All formulas have `client_id = NULL` (system-wide)
- ✅ All formulas have `job_structure_id = NULL` (no job override)
- ✅ Display order 1-12 (calculation sequence)
- ✅ **TRANSACTION:** Wrapped in DB transaction

---

## 🛡️ DATA SAFETY CHECKS

### Migration 000001: emolument_components

- ✅ **ALTER TABLE** (not DROP/CREATE) - existing data preserved
- ✅ New columns have DEFAULT values
- ✅ Nullable columns where appropriate
- ⚠️ **ACTION REQUIRED:** Verify existing 56 components remain intact after migration

### Migration 000002: pay_grade_structures

- ⚠️ **DROPS 4 COLUMNS:** basic_salary, transport_allowance, housing_allowance, meal_allowance
- ✅ Data safe because `emoluments` JSON field contains all data
- ⚠️ **ACTION REQUIRED:** Verify `emoluments` field populated before dropping columns
- ⚠️ **ROLLBACK:** Migration down() recreates columns but data lost (emergency only)

**CRITICAL VALIDATION BEFORE RUNNING 000002:**

```sql
-- Check if any pay_grade has NULL or empty emoluments
SELECT id, grade_code, emoluments
FROM pay_grade_structures
WHERE emoluments IS NULL OR emoluments = '{}' OR emoluments = '';

-- If results found, FIX BEFORE MIGRATION!
```

---

## 🔄 MIGRATION EXECUTION ORDER

**CORRECT ORDER (prevents foreign key errors):**

```bash
# Phase 1: Modify Existing Tables
php artisan migrate --path=/database/migrations/2025_11_21_000001_add_payroll_columns_to_emolument_components.php

# ⚠️ CRITICAL: Validate emoluments data before proceeding!
php artisan migrate --path=/database/migrations/2025_11_21_000002_remove_redundant_columns_from_pay_grade_structures.php

# Phase 2: Create Independent Tables
php artisan migrate --path=/database/migrations/2025_11_21_000003_create_tax_brackets_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000004_create_payroll_calculation_formulas_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000005_create_attendance_uploads_table.php

# Phase 3: Create Dependent Tables (Order Matters!)
php artisan migrate --path=/database/migrations/2025_11_21_000006_create_staff_attendance_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000007_create_payroll_runs_table.php
php artisan migrate --path=/database/migrations/2025_11_21_000008_create_payroll_items_table.php
```

**OR (if all migrations validated):**

```bash
php artisan migrate
```

---

## 🌱 SEEDER EXECUTION ORDER

```bash
# Seed 1: Update existing emolument components
php artisan db:seed --class=UniversalPayrollComponentsSeeder

# Seed 2: Insert tax brackets
php artisan db:seed --class=TaxBracketsSeeder

# Seed 3: Insert calculation formulas
php artisan db:seed --class=PayrollCalculationFormulasSeeder
```

---

## ✅ PRE-MIGRATION CHECKLIST

### Database Backup

- [ ] **CRITICAL:** Backup production database before running migrations
- [ ] Verify backup can be restored
- [ ] Document backup location and timestamp

### Existing Data Validation

- [ ] Check `emolument_components` table has records (should be 56)
- [ ] Check `pay_grade_structures` table emoluments field populated
- [ ] Verify no pay grades have empty/null emoluments JSON
- [ ] Check `clients` table exists and has records
- [ ] Check `users` table exists and has records
- [ ] Check `staff` table exists and has records
- [ ] Check `job_structures` table exists and has records

### Migration Files Review

- [x] All 8 migration files created
- [ ] All migration file names follow Laravel convention (YYYY*MM_DD_HHMMSS*\*)
- [ ] All migrations have proper `up()` and `down()` methods
- [ ] All foreign keys reference existing tables
- [ ] All indexes have proper naming
- [ ] All unique constraints logical and necessary

### Seeder Files Review

- [x] All 3 seeder files created
- [ ] All seeders wrapped in DB transactions
- [ ] All seeders have error handling
- [ ] All seeders have defensive checks (missing data)
- [ ] All seeders provide console output summaries

### Testing Plan

- [ ] Test migrations on local database first
- [ ] Verify all tables created successfully
- [ ] Check all foreign keys work (try deleting parent record)
- [ ] Verify unique constraints (try inserting duplicate)
- [ ] Run seeders and check record counts
- [ ] Test rollback (`php artisan migrate:rollback`)
- [ ] Verify existing data still intact

---

## ⚠️ KNOWN RISKS

### Risk 1: Emoluments Data Loss (Migration 000002)

**Severity:** HIGH  
**Probability:** LOW (if validation done)  
**Mitigation:**

- Run validation query BEFORE migration
- Fix any NULL/empty emoluments before dropping columns
- Keep backup for 30 days minimum

### Risk 2: Missing Emolument Components (Seeder)

**Severity:** MEDIUM  
**Probability:** MEDIUM  
**Mitigation:**

- Seeder logs missing components (doesn't fail)
- Manual review of seeder output
- Create missing components manually if needed

### Risk 3: Foreign Key Constraint Failure

**Severity:** MEDIUM  
**Probability:** LOW  
**Mitigation:**

- Migrations run in correct order (numbered)
- All parent tables exist before creating child tables
- ON DELETE CASCADE/SET NULL prevents orphan records

### Risk 4: Unique Constraint Violation

**Severity:** LOW  
**Probability:** LOW  
**Mitigation:**

- Unique constraints prevent future duplicates (good)
- No existing duplicate data expected (new tables)
- If violation occurs, investigate data integrity issue

---

## 📝 POST-MIGRATION VALIDATION

After running migrations, execute these queries:

```sql
-- 1. Verify emolument_components has new columns
DESCRIBE emolument_components;
-- Expected: is_universal_template, is_pensionable, payroll_category columns exist

-- 2. Verify pay_grade_structures columns removed
DESCRIBE pay_grade_structures;
-- Expected: NO basic_salary, transport_allowance, housing_allowance, meal_allowance

-- 3. Count universal components
SELECT COUNT(*) FROM emolument_components WHERE is_universal_template = TRUE;
-- Expected: 11 records

-- 4. Count tax brackets
SELECT COUNT(*) FROM tax_brackets WHERE is_active = TRUE;
-- Expected: 6 records

-- 5. Count calculation formulas
SELECT COUNT(*) FROM payroll_calculation_formulas WHERE is_system_default = TRUE;
-- Expected: 12 records

-- 6. Verify all new tables exist
SHOW TABLES LIKE '%payroll%';
SHOW TABLES LIKE '%attendance%';
-- Expected: attendance_uploads, staff_attendance, payroll_runs, payroll_items, payroll_calculation_formulas

-- 7. Check foreign keys
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hrm_database'
    AND REFERENCED_TABLE_NAME IS NOT NULL
    AND TABLE_NAME IN ('attendance_uploads', 'staff_attendance', 'payroll_runs', 'payroll_items', 'payroll_calculation_formulas');
-- Expected: All foreign keys listed
```

---

## 🎯 SUCCESS CRITERIA

Migration considered successful if:

- ✅ All 8 migrations run without errors
- ✅ All 3 seeders complete successfully
- ✅ emolument_components has 11 universal components
- ✅ tax_brackets has 6 active tiers
- ✅ payroll_calculation_formulas has 12 system formulas
- ✅ All foreign keys created correctly
- ✅ All unique constraints in place
- ✅ All indexes created
- ✅ Existing data (clients, staff, grades) unchanged
- ✅ pay_grade_structures emoluments JSON preserved
- ✅ Rollback works (test on local only!)

---

## 📞 TROUBLESHOOTING

### Issue: Foreign Key Constraint Fails

**Cause:** Parent table doesn't exist or has no records  
**Solution:** Check migration order, verify parent table exists

### Issue: Unique Constraint Violation

**Cause:** Duplicate data in unique columns  
**Solution:** Query for duplicates, remove/merge records

### Issue: Column Already Exists (000001)

**Cause:** Migration run twice or columns added manually  
**Solution:** Check if columns exist, skip migration or rollback first

### Issue: Column Doesn't Exist (000002)

**Cause:** pay_grade_structures doesn't have columns to drop  
**Solution:** Migration handles this (hasColumn check), but verify table schema

### Issue: Seeder Fails - Component Not Found

**Cause:** emolument_components missing expected component_code  
**Solution:** Create missing component or update seeder to skip

---

## 🚀 NEXT STEPS AFTER MIGRATION

1. **Run Post-Migration Validation Queries**
2. **Test Payroll Calculation Engine** (create service)
3. **Build Controllers** (AttendanceUpload, PayrollRun)
4. **Build Frontend** (Payroll Processing submodule)
5. **End-to-End Testing** (upload attendance → calculate payroll → export Excel)

---

**STATUS:** 🟡 READY FOR REVIEW  
**REVIEWER:** ******\_\_\_******  
**DATE REVIEWED:** ******\_\_\_******  
**APPROVED FOR MIGRATION:** ☐ YES ☐ NO  
**NOTES:** ******\_\_\_******
