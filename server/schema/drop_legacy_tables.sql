-- Script to drop legacy/redundant tables
-- Execute this after backing up your data!

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in order (respecting dependencies)
DROP TABLE IF EXISTS `student_enrollments`;
DROP TABLE IF EXISTS `subject_evaluation_responses`;
DROP TABLE IF EXISTS `subject_instructors`;
DROP TABLE IF EXISTS `subject_evaluation_forms`;
DROP TABLE IF EXISTS `subjects`;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are dropped
SHOW TABLES;
