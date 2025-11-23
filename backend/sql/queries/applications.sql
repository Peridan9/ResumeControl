-- name: GetApplicationsByUserID :many
-- Get all applications for a specific user, ordered by applied_date (newest first)
SELECT * FROM applications
WHERE user_id = $1
ORDER BY applied_date DESC;

-- name: GetApplicationsByUserIDPaginated :many
-- Get paginated applications for a specific user, ordered by applied_date (newest first)
SELECT * FROM applications
WHERE user_id = $1
ORDER BY applied_date DESC
LIMIT $2 OFFSET $3;

-- name: CountApplicationsByUserID :one
-- Get total count of applications for a specific user
SELECT COUNT(*) FROM applications
WHERE user_id = $1;

-- name: CountApplicationsByStatusAndUserID :one
-- Get total count of applications with a specific status for a specific user
SELECT COUNT(*) FROM applications
WHERE status = $1 AND user_id = $2;

-- name: GetApplicationByIDAndUserID :one
-- Get a single application by ID and user_id (ownership verification)
SELECT * FROM applications
WHERE id = $1 AND user_id = $2;

-- name: GetJobByApplicationIDAndUserID :one
-- Get the job for a specific application (verifies ownership through application's user_id)
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE j.application_id = $1 AND a.user_id = $2;

-- name: GetApplicationsByStatusAndUserID :many
-- Get all applications with a specific status for a specific user
SELECT * FROM applications
WHERE status = $1 AND user_id = $2
ORDER BY applied_date DESC;

-- name: GetApplicationsByStatusAndUserIDPaginated :many
-- Get paginated applications with a specific status for a specific user
SELECT * FROM applications
WHERE status = $1 AND user_id = $2
ORDER BY applied_date DESC
LIMIT $3 OFFSET $4;

-- name: CreateApplication :one
-- Create a new application and return the created record
-- Note: job_id is no longer needed, jobs will reference applications
-- contact_id is optional
INSERT INTO applications (status, applied_date, notes, contact_id, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateApplication :one
-- Update an application and return the updated record (verifies ownership via user_id)
UPDATE applications
SET status = $2,
    applied_date = $3,
    notes = $4,
    contact_id = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $6
RETURNING *;

-- name: DeleteApplication :exec
-- Delete an application by ID (verifies ownership via user_id)
DELETE FROM applications
WHERE id = $1 AND user_id = $2;

