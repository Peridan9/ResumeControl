-- name: CreateRefreshToken :one
-- Create a new refresh token and return the created record
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetRefreshTokenByHash :one
-- Get a refresh token by its hash
SELECT * FROM refresh_tokens
WHERE token_hash = $1
LIMIT 1;

-- name: GetRefreshTokensByUserID :many
-- Get all refresh tokens for a specific user
SELECT * FROM refresh_tokens
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: RevokeRefreshToken :exec
-- Revoke a refresh token by setting revoked_at timestamp
UPDATE refresh_tokens
SET revoked_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: RevokeAllUserRefreshTokens :exec
-- Revoke all refresh tokens for a specific user
UPDATE refresh_tokens
SET revoked_at = CURRENT_TIMESTAMP
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: DeleteExpiredRefreshTokens :exec
-- Delete expired refresh tokens (for maintenance/cleanup)
DELETE FROM refresh_tokens
WHERE expires_at < CURRENT_TIMESTAMP;

