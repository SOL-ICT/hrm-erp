# Legacy Application Tables Migration Plan

## Current State Analysis

### Tables Overview
| Table | Records | Model | Status | Used By |
|-------|---------|-------|--------|---------|
| `candidate_job_applications` | 2 | `CandidateJobApplication` | **ACTIVE** | New system |
| `recruitment_applications` | 3 | `RecruitmentApplication` | **LEGACY** | Client interview controllers |
| `job_applications` | 0 | `JobApplication` | **OBSOLETE** | Admin dashboard (empty queries) |

### Active Dependencies
- `ClientInterviewController` uses `recruitment_applications`
- `ClientInterviewFeedbackController` uses `recruitment_applications`
- `RecruitmentRequestController` uses `recruitment_applications`
- `AdminController` queries both old and new tables

## Migration Strategy

### Phase 1: Data Migration (RECOMMENDED)
1. **Migrate 3 legacy records** from `recruitment_applications` to `candidate_job_applications`
2. **Update controllers** to use new table exclusively
3. **Drop legacy tables** after migration

### Phase 2: Controller Updates
Update these controllers to use `candidate_job_applications`:
- `ClientInterviewController`
- `ClientInterviewFeedbackController` 
- `RecruitmentRequestController`
- `AdminController`

### Phase 3: Cleanup
- Drop `recruitment_applications` table
- Drop `job_applications` table (already empty)
- Remove unused models
- Clean up migration files

## Migration SQL Script

```sql
-- Step 1: Migrate data from recruitment_applications to candidate_job_applications
INSERT INTO candidate_job_applications (
    candidate_id,
    recruitment_request_id,
    application_status,
    cover_letter,
    applied_at,
    created_at,
    updated_at,
    -- Map old status to new status
    meets_location_criteria,
    meets_age_criteria, 
    meets_experience_criteria,
    eligibility_score
)
SELECT 
    ra.candidate_id,
    ra.recruitment_request_id,
    CASE ra.status
        WHEN 'pending' THEN 'applied'
        WHEN 'reviewing' THEN 'under_review'
        WHEN 'shortlisted' THEN 'under_review'
        WHEN 'interviewed' THEN 'interview_completed'
        WHEN 'rejected' THEN 'rejected'
        ELSE 'applied'
    END as application_status,
    ra.cover_letter,
    COALESCE(ra.applied_at, ra.created_at) as applied_at,
    ra.created_at,
    ra.updated_at,
    -- Default eligibility to true for legacy data
    true as meets_location_criteria,
    true as meets_age_criteria,
    true as meets_experience_criteria,
    100 as eligibility_score
FROM recruitment_applications ra
WHERE ra.id NOT IN (
    -- Avoid duplicates if candidate already applied via new system
    SELECT DISTINCT ra2.candidate_id 
    FROM recruitment_applications ra2
    INNER JOIN candidate_job_applications cja 
    ON ra2.candidate_id = cja.candidate_id 
    AND ra2.recruitment_request_id = cja.recruitment_request_id
);
```

## Alternative: Keep Legacy System
If migration is too risky, we can:
1. **Document the dual system** clearly
2. **Standardize on new system** for all future applications  
3. **Gradually phase out** legacy queries
4. **Create unified views** that combine both tables

## Risk Assessment
- **Low Risk**: `job_applications` table (empty, safe to drop)
- **Medium Risk**: Migrating `recruitment_applications` data
- **High Risk**: Updating live controllers without testing

## Recommendation
**Proceed with migration** because:
- Only 3 legacy records to migrate
- New system is more robust
- Eliminates confusion between systems
- Simplifies maintenance
