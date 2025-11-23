-- name: GetCompaniesByUserID :many
-- Get all companies for a specific user, ordered by name
SELECT * FROM companies
WHERE user_id = $1
ORDER BY name ASC;

-- name: GetCompaniesByUserIDPaginated :many
-- Get paginated companies for a specific user, ordered by name
SELECT * FROM companies
WHERE user_id = $1
ORDER BY name ASC
LIMIT $2 OFFSET $3;

-- name: CountCompaniesByUserID :one
-- Get total count of companies for a specific user
SELECT COUNT(*) FROM companies
WHERE user_id = $1;

-- name: GetCompanyByIDAndUserID :one
-- Get a single company by ID and user_id (ownership verification)
SELECT * FROM companies
WHERE id = $1 AND user_id = $2;

-- name: GetCompanyByNameAndUserID :one
-- Get a company by name and user_id (case-insensitive, for normalization check)
-- This query uses normalized comparison to check if a company exists for a specific user
SELECT * FROM companies
WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND user_id = $2
LIMIT 1;

-- name: CreateCompany :one
-- Create a new company and return the created record
INSERT INTO companies (name, website, user_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateCompany :one
-- Update a company and return the updated record (verifies ownership via user_id)
UPDATE companies
SET name = $2,
    website = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $4
RETURNING *;

-- name: DeleteCompany :exec
-- Delete a company by ID (verifies ownership via user_id)
DELETE FROM companies
WHERE id = $1 AND user_id = $2;

