-- Add missing columns to subjects table to support instructor assignment
-- Run these commands individually in MySQL

-- Add section column
ALTER TABLE subjects ADD COLUMN section VARCHAR(10) DEFAULT NULL;

-- Add year_level column  
ALTER TABLE subjects ADD COLUMN year_level INT(11) DEFAULT NULL;

-- Add instructor_id column
ALTER TABLE subjects ADD COLUMN instructor_id INT(11) DEFAULT NULL;

-- Add course_section_id column
ALTER TABLE subjects ADD COLUMN course_section_id INT(11) DEFAULT NULL;

-- If any column already exists, you'll get an error - that's okay, the column is there

-- Verify the columns were added
-- DESCRIBE subjects;
