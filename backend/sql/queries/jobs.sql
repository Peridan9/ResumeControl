-- name: GetAllJobs :many
-- Get all jobs, ordered by created_at (newest first)
SELECT * FROM jobs
ORDER BY created_at DESC;

-- name: GetJobByID :one
-- Get a single job by ID
SELECT * FROM jobs
WHERE id = $1;

-- name: GetJobsByCompanyID :many
-- Get all jobs for a specific company
SELECT * FROM jobs
WHERE company_id = $1
ORDER BY created_at DESC;

-- name: CreateJob :one
-- Create a new job and return the created record
INSERT INTO jobs (company_id, title, description, requirements, location)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateJob :one
-- Update a job and return the updated record
UPDATE jobs
SET title = $2,
    description = $3,
    requirements = $4,
    location = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteJob :exec
-- Delete a job by ID
DELETE FROM jobs
WHERE id = $1;

