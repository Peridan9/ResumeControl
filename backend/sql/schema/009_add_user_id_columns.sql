-- +goose Up
-- Add user_id columns to all tables (nullable for now)
-- We'll assign data to user accounts after they're created, then make these NOT NULL in migration 011

-- Add user_id column to companies table
ALTER TABLE companies ADD COLUMN user_id INTEGER;

-- Add user_id column to applications table
ALTER TABLE applications ADD COLUMN user_id INTEGER;

-- Add user_id column to contacts table
ALTER TABLE contacts ADD COLUMN user_id INTEGER;

-- Create indexes for better query performance (even though nullable, this helps with migration queries)
CREATE INDEX companies_user_id_idx ON companies(user_id);
CREATE INDEX applications_user_id_idx ON applications(user_id);
CREATE INDEX contacts_user_id_idx ON contacts(user_id);

-- +goose Down
-- Drop indexes
DROP INDEX IF EXISTS contacts_user_id_idx;
DROP INDEX IF EXISTS applications_user_id_idx;
DROP INDEX IF EXISTS companies_user_id_idx;

-- Remove user_id columns
ALTER TABLE contacts DROP COLUMN IF EXISTS user_id;
ALTER TABLE applications DROP COLUMN IF EXISTS user_id;
ALTER TABLE companies DROP COLUMN IF EXISTS user_id;

