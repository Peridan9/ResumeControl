-- +goose Up
-- Create applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'applied',
    applied_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX applications_job_id_idx ON applications(job_id);
CREATE INDEX applications_status_idx ON applications(status);
CREATE INDEX applications_applied_date_idx ON applications(applied_date);

-- +goose Down
-- Drop applications table
DROP TABLE IF EXISTS applications;

