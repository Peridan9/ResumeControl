-- +goose Up
-- Add Clerk user id for linking Clerk identity to local user
ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(255) UNIQUE;
CREATE UNIQUE INDEX users_clerk_user_id_idx ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS users_clerk_user_id_idx;
ALTER TABLE users DROP COLUMN IF EXISTS clerk_user_id;
