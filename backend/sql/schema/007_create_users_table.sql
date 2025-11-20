-- +goose Up
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create indexes for better query performance
-- Case-insensitive email lookup
CREATE INDEX users_email_idx ON users(LOWER(email));
-- Case-insensitive unique constraint (PostgreSQL unique constraint is case-sensitive by default)
CREATE UNIQUE INDEX users_email_unique_idx ON users(LOWER(email));

-- +goose Down
-- Drop indexes
DROP INDEX IF EXISTS users_email_unique_idx;
DROP INDEX IF EXISTS users_email_idx;

-- Drop users table
DROP TABLE IF EXISTS users;

