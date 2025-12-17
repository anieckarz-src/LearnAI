-- Migration Part 1: Add 'user' value to enum
-- This must be in a separate migration because new enum values must be committed before use

-- Add 'user' to the enum (this will be committed before the next migration runs)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

