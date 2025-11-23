-- name: GetContactsByUserID :many
-- Get all contacts for a specific user, ordered by name
SELECT * FROM contacts
WHERE user_id = $1
ORDER BY name ASC;

-- name: GetContactByIDAndUserID :one
-- Get a contact by ID and user_id (ownership verification)
SELECT * FROM contacts
WHERE id = $1 AND user_id = $2;

-- name: CreateContact :one
-- Create a new contact and return the created record
INSERT INTO contacts (name, email, phone, linkedin, user_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateContact :one
-- Update a contact and return the updated record (verifies ownership via user_id)
UPDATE contacts
SET name = $2,
    email = $3,
    phone = $4,
    linkedin = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1 AND user_id = $6
RETURNING *;

-- name: DeleteContact :exec
-- Delete a contact by ID (verifies ownership via user_id)
DELETE FROM contacts
WHERE id = $1 AND user_id = $2;

