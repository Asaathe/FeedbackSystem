-- Add section_id column to forms table for linking forms to specific subject sections
-- This allows tracking feedback per section (subject_offering) instead of per subject

ALTER TABLE forms ADD COLUMN section_id INT(11) DEFAULT NULL AFTER subject_id;

-- Add foreign key constraint (optional, can be added later if needed)
-- ALTER TABLE forms ADD CONSTRAINT fk_forms_section FOREIGN KEY (section_id) REFERENCES subject_offerings(id) ON DELETE SET NULL;

-- Add index for faster lookups
ALTER TABLE forms ADD INDEX idx_section_id (section_id);
