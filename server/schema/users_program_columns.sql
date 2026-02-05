-- Add program_id column to students table
-- The Users table should NOT have these fields - they belong in the students table

-- Add program_id column to students table
ALTER TABLE students 
ADD COLUMN program_id INT NULL COMMENT 'References course_management.id';

-- Note: Users table should NOT be modified
-- Users table structure (keep as is):
-- id, email, password_hash, full_name, role, status, registration_date

-- Students table now has:
-- user_id, studentID, program_id, contact_number, subjects
