-- name: GetAllCompanies :many
-- Get all companies, ordered by name
SELECT * FROM companies
ORDER BY name ASC;

-- name: GetCompanyByID :one
-- Get a single company by ID
SELECT * FROM companies
WHERE id = $1;

-- name: GetCompanyByName :one
-- Get a company by name (case-insensitive, for normalization check)
-- This query uses normalized comparison to check if a company exists
SELECT * FROM companies
WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
LIMIT 1;

-- name: CreateCompany :one
-- Create a new company and return the created record
INSERT INTO companies (name, website)
VALUES ($1, $2)
RETURNING *;

-- name: UpdateCompany :one
-- Update a company and return the updated record
UPDATE companies
SET name = $2,
    website = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteCompany :exec
-- Delete a company by ID
DELETE FROM companies
WHERE id = $1;

