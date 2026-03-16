-- Migration: add_password_hash_to_users
-- Run this against your PostgreSQL database if the users table already exists.
-- If running from scratch, Drizzle migrations will handle this automatically.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar;

-- Verify:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name = 'password_hash';
