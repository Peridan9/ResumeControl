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

-- Note: Validation is not needed here as migration 011 will fail if any NULL values remain
-- when trying to set NOT NULL constraint

-- +goose Down
-- Set user_id back to NULL (for rollback)
UPDATE contacts SET user_id = NULL;
UPDATE applications SET user_id = NULL;
UPDATE companies SET user_id = NULL;

