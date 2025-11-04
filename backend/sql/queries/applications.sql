-- name: GetAllApplications :many
-- Get all applications, ordered by applied_date (newest first)
SELECT * FROM applications
ORDER BY applied_date DESC;

-- name: GetApplicationByID :one
-- Get a single application by ID
SELECT * FROM applications
WHERE id = $1;

-- name: GetApplicationsByJobID :many
-- Get all applications for a specific job
SELECT * FROM applications
WHERE job_id = $1
ORDER BY applied_date DESC;

-- name: GetApplicationsByStatus :many
-- Get all applications with a specific status
SELECT * FROM applications
WHERE status = $1
ORDER BY applied_date DESC;

-- name: CreateApplication :one
-- Create a new application and return the created record
INSERT INTO applications (job_id, status, applied_date, notes)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateApplication :one
-- Update an application and return the updated record
UPDATE applications
SET status = $2,
    applied_date = $3,
    notes = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteApplication :exec
-- Delete an application by ID
DELETE FROM applications
WHERE id = $1;

