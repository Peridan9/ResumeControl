# Problems & Solutions

This document tracks significant problems encountered during the development of ResumeControl and how they were resolved. This serves as a learning resource and showcases problem-solving approaches.

---

## Problem: Restructuring Database Schema - Applications and Jobs Relationship

**Date:** November 2024  
**Priority:** High  
**Status:** ✅ Resolved

### The Problem

Initially, the database schema had a many-to-one relationship where:
- `applications` table had a `job_id` foreign key referencing `jobs(id)`
- Multiple applications could reference the same job
- Jobs could exist independently without applications

This design led to several issues:
1. **Orphaned Jobs**: When an application was deleted, its associated job remained in the database, creating orphaned records
2. **Conceptual Mismatch**: In reality, each application should correspond to exactly one job, and jobs should only exist as part of an application (1-to-1 relationship)
3. **Data Integrity**: The system allowed creating jobs without applications, which didn't match the business logic where a job posting only matters in the context of an application

### The Challenge

Restructuring a database schema with existing data requires careful planning to:
- Preserve existing data during migration
- Handle edge cases (orphaned records, null values)
- Ensure data integrity throughout the process
- Make the migration idempotent (safe to run multiple times)
- Provide a clean rollback path

### The Solution

We restructured the relationship to make `Application` the parent entity:

1. **New Schema Design:**
   - `applications` table: No longer has `job_id`
   - `jobs` table: Now has `application_id` foreign key referencing `applications(id)`
   - Added `ON DELETE CASCADE` to ensure deleting an application deletes its job
   - Added `UNIQUE` constraint on `jobs.application_id` to enforce 1-to-1 relationship

2. **Migration Strategy:**
   - Created migration `004_restructure_jobs_applications.sql` with careful step-by-step approach:
     - Added `application_id` column to `jobs` (nullable initially)
     - Migrated existing data: `UPDATE jobs SET application_id = applications.id FROM applications WHERE jobs.id = applications.job_id`
     - Deleted orphaned jobs (jobs without applications)
     - Set `application_id` to `NOT NULL`
     - Added foreign key constraint with `ON DELETE CASCADE`
     - Dropped old `job_id` column from `applications`
   - Made migration idempotent by using `DROP COLUMN IF EXISTS` and checking for null values before setting constraints

3. **Enforcing 1-to-1 Relationship:**
   - Created migration `005_add_unique_constraint_jobs_application_id.sql`
   - Added `UNIQUE` constraint on `jobs.application_id` to ensure each application can only have one job

### Technical Details

**Migration Challenges Encountered:**

1. **Null Values Error:**
   ```
   ERROR: column "application_id" of relation "jobs" contains null values
   ```
   - **Solution:** Added explicit step to delete orphaned jobs before setting `NOT NULL` constraint

2. **Idempotency Issues:**
   - **Problem:** Migration failed if `application_id` column already existed from previous failed attempt
   - **Solution:** Added `DROP COLUMN IF EXISTS application_id` at the start to ensure clean state

3. **Dollar-Quoted String Parsing:**
   - **Problem:** Attempted to use `DO $$ BEGIN IF NOT EXISTS ... END IF; $$` block, but PostgreSQL/goose had parsing issues
   - **Solution:** Simplified approach by explicitly dropping and recreating the column

### Code Changes

**Backend:**
- Updated SQL queries to use `application_id` instead of `job_id`
- Modified `CreateJob` handler to require `application_id`
- Modified `CreateApplication` handler to no longer require `job_id`
- Added `GetJobByApplicationID` endpoint

**Frontend:**
- Updated TypeScript interfaces to reflect new schema
- Modified application creation flow: create application first, then create job with `application_id`
- Updated `ApplicationTable` and `Dashboard` to find jobs by `application_id`

### Lessons Learned

1. **Schema Design:** Always consider the business logic when designing relationships. A 1-to-1 relationship should be enforced at the database level, not just in application code.

2. **Migration Safety:** 
   - Always handle edge cases (orphaned records, null values)
   - Make migrations idempotent for easier recovery from failures
   - Test migrations on a copy of production data first

3. **Data Integrity:** Use database constraints (`UNIQUE`, `NOT NULL`, `FOREIGN KEY`) to enforce business rules at the database level, not just in application code.

4. **Cascade Deletes:** `ON DELETE CASCADE` is powerful but must be used carefully. In this case, it ensures data consistency by preventing orphaned jobs.

### Result

✅ Successfully migrated existing data  
✅ Enforced 1-to-1 relationship at database level  
✅ Eliminated orphaned job records  
✅ Improved data integrity and consistency  
✅ Clean rollback path available

---

