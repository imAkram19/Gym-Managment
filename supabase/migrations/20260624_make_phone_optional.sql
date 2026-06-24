-- Make phone column optional (nullable) on members table
ALTER TABLE members ALTER COLUMN phone DROP NOT NULL;
