-- Migration: Sync subjects to evaluation_subjects
-- This ensures all subjects in the 'subjects' table exist in 'evaluation_subjects'
-- Run this script to fix the foreign key constraint issue

-- Insert subjects that exist in 'subjects' but not in 'evaluation_subjects'
INSERT INTO evaluation_subjects (id, subject_code, subject_name, department, units, description, status, created_at, updated_at)
SELECT s.id, s.subject_code, s.subject_name, s.department, s.units, NULL, 'active', NOW(), NOW()
FROM subjects s
WHERE NOT EXISTS (
    SELECT 1 FROM evaluation_subjects es WHERE es.id = s.id
)
ON DUPLICATE KEY UPDATE 
    subject_code = VALUES(subject_code),
    subject_name = VALUES(subject_name),
    department = VALUES(department),
    units = VALUES(units),
    status = 'active',
    updated_at = NOW();

-- Verify the results
SELECT 'Subjects in subjects table:' AS info, COUNT(*) AS count FROM subjects;
SELECT 'Subjects in evaluation_subjects table:' AS info, COUNT(*) AS count FROM evaluation_subjects;
