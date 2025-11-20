-- +goose Up
-- Assign all existing data to user_id = 1
-- This migration assigns all existing companies, applications, and contacts to the first user

-- Assign all existing companies to user_id
UPDATE companies 
SET user_id = 1
WHERE user_id IS NULL;

-- Assign all existing applications to user_id
UPDATE applications 
SET user_id = 1
WHERE user_id IS NULL;

-- Assign all existing contacts to user_id
UPDATE contacts 
SET user_id = 1
WHERE user_id IS NULL;

-- Verify no NULL values remain (this will fail the migration if any NULLs exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM companies WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Migration failed: companies table still has NULL user_id values';
    END IF;
    IF EXISTS (SELECT 1 FROM applications WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Migration failed: applications table still has NULL user_id values';
    END IF;
    IF EXISTS (SELECT 1 FROM contacts WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Migration failed: contacts table still has NULL user_id values';
    END IF;
END $$;

-- +goose Down
-- Set user_id back to NULL (for rollback)
UPDATE contacts SET user_id = NULL;
UPDATE applications SET user_id = NULL;
UPDATE companies SET user_id = NULL;

