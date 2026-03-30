-- Add archived columns to feedback tables for semester transition support
-- This allows old feedback to be archived while keeping the records
-- The reports will filter by semester/academic_year so archived data won't show

ALTER TABLE subject_feedback 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;

ALTER TABLE instructor_feedback 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;
