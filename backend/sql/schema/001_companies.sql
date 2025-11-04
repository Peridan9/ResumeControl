-- +goose Up
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX companies_name_normalized_idx 
ON companies (LOWER(TRIM(name)));

-- +goose Down
DROP TABLE IF EXISTS companies;

