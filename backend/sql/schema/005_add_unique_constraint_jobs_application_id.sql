-- +goose Up
-- Add UNIQUE constraint to enforce 1-to-1 relationship between applications and jobs
-- Each application can have exactly one job, and each job belongs to exactly one application

-- Step 1: Drop the existing index (we'll replace it with a unique index)
DROP INDEX IF EXISTS jobs_application_id_idx;

-- Step 2: Add UNIQUE constraint on application_id
-- This ensures each application_id can only appear once in the jobs table
ALTER TABLE jobs 
ADD CONSTRAINT jobs_application_id_unique UNIQUE (application_id);

-- Step 3: Create unique index (replaces the regular index)
-- A unique constraint automatically creates a unique index, but we can also create it explicitly
CREATE UNIQUE INDEX jobs_application_id_idx ON jobs(application_id);

-- +goose Down
-- Remove the unique constraint

-- Step 1: Drop the unique constraint and index
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_application_id_unique;
DROP INDEX IF EXISTS jobs_application_id_idx;

-- Step 2: Recreate the regular (non-unique) index
CREATE INDEX jobs_application_id_idx ON jobs(application_id);

