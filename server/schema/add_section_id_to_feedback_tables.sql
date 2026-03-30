-- Add section_id column to subject_feedback and instructor_feedback tables
-- This allows tracking feedback per section (subject_offering) instead of per subject

-- Add section_id to subject_feedback table
ALTER TABLE subject_feedback ADD COLUMN section_id INT(11) DEFAULT NULL AFTER subject_id;

-- Add index for faster lookups
ALTER TABLE subject_feedback ADD INDEX idx_section_id (section_id);

-- Add section_id to instructor_feedback table
ALTER TABLE instructor_feedback ADD COLUMN section_id INT(11) DEFAULT NULL AFTER subject_id;

-- Add index for faster lookups
ALTER TABLE instructor_feedback ADD INDEX idx_section_id (section_id);
