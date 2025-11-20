-- +goose Up
-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX refresh_tokens_token_hash_idx ON refresh_tokens(token_hash);
CREATE INDEX refresh_tokens_expires_at_idx ON refresh_tokens(expires_at);

-- +goose Down
-- Drop indexes
DROP INDEX IF EXISTS refresh_tokens_expires_at_idx;
DROP INDEX IF EXISTS refresh_tokens_token_hash_idx;
DROP INDEX IF EXISTS refresh_tokens_user_id_idx;

-- Drop refresh_tokens table
DROP TABLE IF EXISTS refresh_tokens;

