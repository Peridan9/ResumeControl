-- name: GetAllApplications :many
-- Get all applications, ordered by applied_date (newest first)
SELECT * FROM applications
ORDER BY applied_date DESC;

-- name: GetAllApplicationsPaginated :many
-- Get paginated applications, ordered by applied_date (newest first)
SELECT * FROM applications
ORDER BY applied_date DESC
LIMIT $1 OFFSET $2;

-- name: CountApplications :one
-- Get total count of applications
SELECT COUNT(*) FROM applications;

-- name: CountApplicationsByStatus :one
-- Get total count of applications with a specific status
SELECT COUNT(*) FROM applications
WHERE status = $1;

-- name: GetApplicationByID :one
-- Get a single application by ID
SELECT * FROM applications
WHERE id = $1;

-- name: GetJobByApplicationID :one
-- Get the job for a specific application
SELECT * FROM jobs
WHERE application_id = $1;

-- name: GetApplicationsByStatus :many
-- Get all applications with a specific status
SELECT * FROM applications
WHERE status = $1
ORDER BY applied_date DESC;

-- name: GetApplicationsByStatusPaginated :many
-- Get paginated applications with a specific status
SELECT * FROM applications
WHERE status = $1
ORDER BY applied_date DESC
LIMIT $2 OFFSET $3;

-- name: CreateApplication :one
-- Create a new application and return the created record
-- Note: job_id is no longer needed, jobs will reference applications
-- contact_id is optional
INSERT INTO applications (status, applied_date, notes, contact_id)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: UpdateApplication :one
-- Update an application and return the updated record
UPDATE applications
SET status = $2,
    applied_date = $3,
    notes = $4,
    contact_id = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteApplication :exec
-- Delete an application by ID
DELETE FROM applications
WHERE id = $1;

