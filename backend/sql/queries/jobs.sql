-- name: GetJobsByUserID :many
-- Get all jobs for a specific user (through applications), ordered by created_at (newest first)
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE a.user_id = $1
ORDER BY j.created_at DESC;

-- name: GetJobsByUserIDPaginated :many
-- Get paginated jobs for a specific user (through applications), ordered by created_at (newest first)
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE a.user_id = $1
ORDER BY j.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountJobsByUserID :one
-- Get total count of jobs for a specific user (through applications)
SELECT COUNT(*) FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE a.user_id = $1;

-- name: GetJobByIDAndUserID :one
-- Get a single job by ID and verify ownership through application's user_id
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE j.id = $1 AND a.user_id = $2;

-- name: GetJobsByCompanyIDAndUserID :many
-- Get all jobs for a specific company and user (through applications)
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE j.company_id = $1 AND a.user_id = $2
ORDER BY j.created_at DESC;

-- name: GetJobsByApplicationIDAndUserID :many
-- Get all jobs for a specific application and verify ownership through application's user_id
SELECT j.* FROM jobs j
INNER JOIN applications a ON j.application_id = a.id
WHERE j.application_id = $1 AND a.user_id = $2
ORDER BY j.created_at DESC;

-- name: CreateJob :one
-- Create a new job and return the created record
-- Jobs now belong to applications (application_id is required)
-- Note: user_id verification happens in handler by checking application ownership
INSERT INTO jobs (application_id, company_id, title, description, requirements, location)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateJob :one
-- Update a job and return the updated record (verifies ownership through application's user_id)
UPDATE jobs
SET title = $2,
    description = $3,
    requirements = $4,
    location = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE jobs.id = $1
  AND EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = jobs.application_id AND a.user_id = $6
  )
RETURNING *;

-- name: DeleteJob :exec
-- Delete a job by ID (verifies ownership through application's user_id)
DELETE FROM jobs
WHERE jobs.id = $1
  AND EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = jobs.application_id AND a.user_id = $2
  );

