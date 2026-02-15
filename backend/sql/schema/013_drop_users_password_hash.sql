-- +goose Up
-- Drop password_hash; auth is now handled by Clerk only.
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- +goose Down
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
