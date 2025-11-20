-- name: CreateContact :one
-- Create a new contact and return the created record
INSERT INTO contacts (name, email, phone, linkedin)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetContactByID :one
-- Get a contact by ID
SELECT * FROM contacts WHERE id = $1;

-- name: GetAllContacts :many
-- Get all contacts ordered by name
SELECT * FROM contacts ORDER BY name ASC;

-- name: UpdateContact :one
-- Update a contact and return the updated record
UPDATE contacts
SET name = $2,
    email = $3,
    phone = $4,
    linkedin = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteContact :exec
-- Delete a contact by ID
DELETE FROM contacts WHERE id = $1;

