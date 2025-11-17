-- +goose Up
-- Create contacts table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add contact_id to applications table (nullable, SET NULL on delete)
ALTER TABLE applications ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX applications_contact_id_idx ON applications(contact_id);
CREATE INDEX contacts_name_idx ON contacts(name);

-- +goose Down
-- Remove contact_id from applications
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_contact_id_fkey;
ALTER TABLE applications DROP COLUMN IF EXISTS contact_id;
DROP INDEX IF EXISTS applications_contact_id_idx;

-- Drop contacts table
DROP TABLE IF EXISTS contacts;
DROP INDEX IF EXISTS contacts_name_idx;

