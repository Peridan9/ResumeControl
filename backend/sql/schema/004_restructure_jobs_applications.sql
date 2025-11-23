-- +goose Up
-- Restructure: Make Application the parent, Job the child
-- This ensures jobs only exist as part of applications (no orphaned jobs)

-- Step 1: Drop application_id column if it exists (from previous failed migration)
ALTER TABLE jobs DROP COLUMN IF EXISTS application_id;

-- Step 1.5: Add application_id column to jobs table (nullable initially for data migration)
ALTER TABLE jobs ADD COLUMN application_id INTEGER;

-- Step 2: Migrate existing data
-- For each application, set its job's application_id to the application's id
-- Only update jobs that don't already have an application_id (idempotent)
UPDATE jobs 
SET application_id = applications.id 
FROM applications 
WHERE jobs.id = applications.job_id 
  AND jobs.application_id IS NULL;

-- Step 2.5: Delete orphaned jobs (jobs without applications)
-- These shouldn't exist in the new model where jobs belong to applications
DELETE FROM jobs 
WHERE application_id IS NULL;

-- Step 3: Make application_id NOT NULL after data migration and cleanup
ALTER TABLE jobs ALTER COLUMN application_id SET NOT NULL;

-- Step 4: Add foreign key constraint from jobs to applications
ALTER TABLE jobs 
ADD CONSTRAINT jobs_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

-- Step 5: Create index on application_id for better query performance
CREATE INDEX jobs_application_id_idx ON jobs(application_id);

-- Step 6: Drop the old foreign key constraint from applications to jobs
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_job_id_fkey;

-- Step 7: Drop the job_id column from applications (no longer needed)
ALTER TABLE applications DROP COLUMN IF EXISTS job_id;

-- Step 8: Drop the old index on applications.job_id (no longer exists)
DROP INDEX IF EXISTS applications_job_id_idx;

-- +goose Down
-- Reverse migration: Restore original structure

-- Step 1: Add job_id column back to applications
ALTER TABLE applications ADD COLUMN job_id INTEGER;

-- Step 2: Migrate data back: For each job, set its application's job_id
UPDATE applications 
SET job_id = jobs.id 
FROM jobs 
WHERE jobs.application_id = applications.id;

-- Step 3: Make job_id NOT NULL
ALTER TABLE applications ALTER COLUMN job_id SET NOT NULL;

-- Step 4: Add foreign key constraint back
ALTER TABLE applications 
ADD CONSTRAINT applications_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Step 5: Create index back
CREATE INDEX applications_job_id_idx ON applications(job_id);

-- Step 6: Drop the new foreign key constraint from jobs to applications
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_application_id_fkey;

-- Step 7: Drop application_id column from jobs
ALTER TABLE jobs DROP COLUMN IF EXISTS application_id;

-- Step 8: Drop the new index
DROP INDEX IF EXISTS jobs_application_id_idx;

