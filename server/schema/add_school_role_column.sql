-- Migration: Add school_role column to instructors table
-- Description: Adds a new column to store the instructor's school role (e.g., IT Instructor, DEAN, etc.)

ALTER TABLE instructors 
ADD COLUMN school_role VARCHAR(255) DEFAULT NULL AFTER department;

-- Verify the column was added
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'instructors' AND COLUMN_NAME = 'school_role';
