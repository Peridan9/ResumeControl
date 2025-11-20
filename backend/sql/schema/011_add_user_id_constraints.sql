-- +goose Up
-- Make user_id NOT NULL and add foreign key constraints
-- This should only run AFTER migration 010 has assigned all existing data to user accounts

-- Make user_id columns NOT NULL
ALTER TABLE companies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE applications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraints with CASCADE delete
-- When a user is deleted, all their data is also deleted
ALTER TABLE companies 
ADD CONSTRAINT companies_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE applications 
ADD CONSTRAINT applications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE contacts 
ADD CONSTRAINT contacts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- +goose Down
-- Remove foreign key constraints
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_fkey;
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_fkey;

-- Make user_id columns nullable again
ALTER TABLE companies ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE applications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN user_id DROP NOT NULL;

