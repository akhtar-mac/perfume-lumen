-- Migration: Hash admin passwords
-- Run ONCE. Adds password_hash column, migrates existing plaintext passwords,
-- and removes the plaintext column.
--
-- IMPORTANT: Run this AFTER deploying the updated admin app code that uses
-- password_hash. The app falls back to `password` if `password_hash` is null
-- during the transition window.

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash text;

-- Migrate existing plaintext passwords to bcrypt hashes.
-- crypt() with gen_salt('bf', 12) produces a bcrypt hash compatible with bcryptjs.
UPDATE admin_users
SET password_hash = crypt(password, gen_salt('bf', 12))
WHERE password_hash IS NULL AND password IS NOT NULL;

-- Keep the plaintext column temporarily for fallback during rollout.
-- Drop it in a follow-up migration once all admins have logged in once:
--   ALTER TABLE admin_users DROP COLUMN password;