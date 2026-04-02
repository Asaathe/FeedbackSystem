-- Migration: Add academic_period_id foreign key to feedback and subject offering tables
-- This migration establishes proper referential integrity between academic periods and data

-- Step 1: Add academic_period_id column to subject_offerings (nullable first)
ALTER TABLE `subject_offerings` 
ADD COLUMN `academic_period_id` INT(11) NULL DEFAULT NULL 
COMMENT 'Foreign key to academic_periods.id' AFTER `semester`;

-- Step 2: Add academic_period_id column to subject_feedback (nullable first)
ALTER TABLE `subject_feedback` 
ADD COLUMN `academic_period_id` INT(11) NULL DEFAULT NULL 
COMMENT 'Foreign key to academic_periods.id' AFTER `semester`;

-- Step 3: Add academic_period_id column to instructor_feedback (nullable first)
ALTER TABLE `instructor_feedback` 
ADD COLUMN `academic_period_id` INT(11) NULL DEFAULT NULL 
COMMENT 'Foreign key to academic_periods.id' AFTER `semester`;

-- Step 4: Add foreign key constraints (after data is populated)
-- Uncomment after running the backfill queries below
-- ALTER TABLE `subject_offerings` 
--     ADD CONSTRAINT `fk_subject_offerings_academic_period` 
--     FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL;

-- ALTER TABLE `subject_feedback` 
--     ADD CONSTRAINT `fk_subject_feedback_academic_period` 
--     FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL;

-- ALTER TABLE `instructor_feedback` 
--     ADD CONSTRAINT `fk_instructor_feedback_academic_period` 
--     FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods`(`id`) ON DELETE SET NULL;

-- ============================================================
-- BACKFILL QUERIES - Run these to populate existing data
-- ============================================================

-- Backfill subject_offerings
-- Updates academic_period_id by matching department + academic_year + semester to academic_periods
/*
UPDATE subject_offerings so
INNER JOIN academic_periods ap ON 
    ap.department = (
        SELECT department FROM evaluation_subjects WHERE id = so.subject_id
    )
    AND ap.academic_year = so.academic_year
    AND (
        (ap.period_type = 'semester' AND (
            (ap.period_number = 1 AND so.semester IN ('1st', '1'))
            OR (ap.period_number = 2 AND so.semester IN ('2nd', '2'))
            OR (ap.period_number = 3 AND so.semester IN ('3rd', '3', 'Summer'))
        ))
        OR (ap.period_type = 'quarter' AND so.semester = ap.period_number)
    )
SET so.academic_period_id = ap.id
WHERE so.academic_period_id IS NULL;
*/

-- Backfill subject_feedback
/*
UPDATE subject_feedback sf
INNER JOIN academic_periods ap ON 
    ap.department = (
        SELECT department FROM evaluation_subjects WHERE id = sf.subject_id
    )
    AND ap.academic_year = sf.academic_year
    AND (
        (ap.period_type = 'semester' AND (
            (ap.period_number = 1 AND sf.semester IN ('1st', '1'))
            OR (ap.period_number = 2 AND sf.semester IN ('2nd', '2'))
            OR (ap.period_number = 3 AND sf.semester IN ('3rd', '3', 'Summer'))
        ))
        OR (ap.period_type = 'quarter' AND sf.semester = ap.period_number)
    )
SET sf.academic_period_id = ap.id
WHERE sf.academic_period_id IS NULL;
*/

-- Backfill instructor_feedback
/*
UPDATE instructor_feedback ifb
INNER JOIN academic_periods ap ON 
    ap.department = (
        SELECT department FROM evaluation_subjects WHERE id = ifb.subject_id
    )
    AND ap.academic_year = ifb.academic_year
    AND (
        (ap.period_type = 'semester' AND (
            (ap.period_number = 1 AND ifb.semester IN ('1st', '1'))
            OR (ap.period_number = 2 AND ifb.semester IN ('2nd', '2'))
            OR (ap.period_number = 3 AND ifb.semester IN ('3rd', '3', 'Summer'))
        ))
        OR (ap.period_type = 'quarter' AND ifb.semester = ap.period_number)
    )
SET ifb.academic_period_id = ap.id
WHERE ifb.academic_period_id IS NULL;
*/

-- ============================================================
-- INDEXES - Add indexes for better query performance
-- ============================================================
CREATE INDEX idx_subject_offerings_academic_period ON subject_offerings(academic_period_id);
CREATE INDEX idx_subject_feedback_academic_period ON subject_feedback(academic_period_id);
CREATE INDEX idx_instructor_feedback_academic_period ON instructor_feedback(academic_period_id);