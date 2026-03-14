-- Table structure for table `subject_sections`
-- This table links subjects to course_management (programs/sections)
-- Instead of enrolling each student individually, we create a single record
-- that represents the class program assignment

CREATE TABLE IF NOT EXISTS `subject_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) NOT NULL COMMENT 'Reference to subjects.id or evaluation_subjects.id',
  `program_id` int(11) NOT NULL COMMENT 'Reference to course_management.id (program/section)',
  `instructor_id` int(11) DEFAULT NULL COMMENT 'Optional reference to instructors.id',
  `academic_year` year(4) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject_program` (`subject_id`, `program_id`, `academic_year`, `semester`),
  KEY `idx_subject_id` (`subject_id`),
  KEY `idx_program_id` (`program_id`),
  KEY `idx_instructor_id` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Links subjects to programs/sections for class assignments';

-- Note: Foreign key constraints removed to allow flexibility with different subject tables
-- The system uses subjects from various tables (subjects, evaluation_subjects, instructor_courses)
-- Application logic should ensure data integrity
