-- Migration: Fix unique constraint on subject_offerings to include instructor_id
-- This allows the same subject/section to have different instructors in the same semester

-- Drop the existing unique constraint
ALTER TABLE subject_offerings DROP INDEX unique_offering;

-- Add new unique constraint that includes instructor_id
ALTER TABLE subject_offerings ADD UNIQUE KEY unique_offering (subject_id, program_id, year_level, section, academic_year, semester, instructor_id);

-- Note: This will fail if there are existing duplicate entries with the same values + different instructor_id
-- In that case, you may need to handle duplicates first