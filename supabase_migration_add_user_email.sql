-- Add user_email column to runs table
ALTER TABLE runs ADD COLUMN IF NOT EXISTS user_email TEXT;






