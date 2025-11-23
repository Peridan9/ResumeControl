-- name: CreateUser :one
-- Create a new user and return the created record
INSERT INTO users (email, password_hash, name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
-- Get a user by email (case-insensitive)
SELECT * FROM users
WHERE LOWER(email) = LOWER($1)
LIMIT 1;

-- name: GetUserByID :one
-- Get a user by ID
SELECT * FROM users
WHERE id = $1;

-- name: UpdateUser :one
-- Update user information
UPDATE users
SET name = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: UpdateUserLastLogin :exec
-- Update the last_login timestamp
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: DeleteUser :exec
-- Delete a user by ID (CASCADE will delete all related data)
DELETE FROM users
WHERE id = $1;

