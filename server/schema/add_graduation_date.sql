-- Add graduation_date column to alumni_employment table
-- This is used to determine when to send the first employment update request (1 year after graduation)

ALTER TABLE alumni_employment 
ADD COLUMN graduation_date DATE DEFAULT NULL AFTER alumni_user_id;

-- Create index for faster queries on graduation_date
CREATE INDEX idx_employment_graduation_date ON alumni_employment(graduation_date);
