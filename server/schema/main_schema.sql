-- ============================================
-- FeedbACTS System - Consolidated Schema
-- Run this file to create all tables in correct order
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================
-- CORE TABLES (Run First)
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS `Users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'instructor', 'student', 'alumni', 'employer') NOT NULL DEFAULT 'student',
  `status` ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_image` VARCHAR(500) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Academic Periods Table
CREATE TABLE IF NOT EXISTS `Academic_Periods` (
  `academic_period_id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_name` VARCHAR(100) NOT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('upcoming', 'active', 'completed') NOT NULL DEFAULT 'upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_academic_period` (`academic_year`, `semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Programs/Courses Table
CREATE TABLE IF NOT EXISTS `Programs` (
  `program_id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_code` VARCHAR(20) NOT NULL UNIQUE,
  `program_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration_years` INT DEFAULT 4,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subjects Table
CREATE TABLE IF NOT EXISTS `Subjects` (
  `subject_id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_code` VARCHAR(20) NOT NULL UNIQUE,
  `subject_name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `units` INT DEFAULT 3,
  `program_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`program_id`) REFERENCES `Programs`(`program_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subject Offerings Table
CREATE TABLE IF NOT EXISTS `Subject_Offerings` (
  `offering_id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `instructor_id` INT NOT NULL,
  `academic_period_id` INT NOT NULL,
  `section` VARCHAR(20) DEFAULT 'A',
  `schedule` VARCHAR(100) DEFAULT NULL,
  `room` VARCHAR(50) DEFAULT NULL,
  `max_students` INT DEFAULT 50,
  `status` ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_offering` (`subject_id`, `instructor_id`, `academic_period_id`, `section`),
  FOREIGN KEY (`subject_id`) REFERENCES `Subjects`(`subject_id`) ON DELETE CASCADE,
  FOREIGN KEY (`instructor_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`academic_period_id`) REFERENCES `Academic_Periods`(`academic_period_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subject Sections Table
CREATE TABLE IF NOT EXISTS `Subject_Sections` (
  `section_id` INT AUTO_INCREMENT PRIMARY KEY,
  `offering_id` INT NOT NULL,
  `section_name` VARCHAR(20) NOT NULL,
  `max_students` INT DEFAULT 50,
  `schedule` VARCHAR(100) DEFAULT NULL,
  `room` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_section` (`offering_id`, `section_name`),
  FOREIGN KEY (`offering_id`) REFERENCES `Subject_Offerings`(`offering_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subject Students Table
CREATE TABLE IF NOT EXISTS `subject_students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `section_id` INT DEFAULT NULL,
  `academic_year` VARCHAR(20) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `enrollment_status` ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_enrollment` (`subject_id`, `student_id`, `academic_year`, `semester`),
  FOREIGN KEY (`subject_id`) REFERENCES `Subjects`(`subject_id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create indexes for subject_students
CREATE INDEX idx_subject_student ON subject_students(student_id, academic_year);
CREATE INDEX idx_subject_enrollment ON subject_students(subject_id, enrollment_status);

-- ============================================
-- FORM SYSTEM TABLES
-- ============================================

-- Form Categories
CREATE TABLE IF NOT EXISTS `Form_Categories` (
  `category_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `category_type` ENUM('student_feedback', 'instructor_feedback', 'alumni_feedback', 'employer_feedback') NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `parent_category_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_category_id`) REFERENCES `Form_Categories`(`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Forms Table
CREATE TABLE IF NOT EXISTS `Forms` (
  `form_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `form_type` ENUM('student_feedback', 'instructor_feedback', 'alumni_feedback', 'employer_feedback', 'self_evaluation') NOT NULL,
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `deadline` DATETIME DEFAULT NULL,
  `anonymous` BOOLEAN DEFAULT FALSE,
  `allow_multiple` BOOLEAN DEFAULT FALSE,
  `target_role` VARCHAR(50) DEFAULT NULL,
  `section_id` INT DEFAULT NULL,
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Questions Table
CREATE TABLE IF NOT EXISTS `Questions` (
  `question_id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `section_id` INT DEFAULT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('rating', 'text', 'multiple_choice', 'checkbox', 'dropdown', 'file_upload') NOT NULL,
  `is_required` BOOLEAN DEFAULT FALSE,
  `options` TEXT DEFAULT NULL,
  `order_index` INT DEFAULT 0,
  `category_id` INT DEFAULT NULL,
  `min_rating` INT DEFAULT 1,
  `max_rating` INT DEFAULT 5,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`) REFERENCES `Forms`(`form_id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `Form_Categories`(`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Form Responses
CREATE TABLE IF NOT EXISTS `Form_Responses` (
  `response_id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('submitted', 'reviewed', 'flagged') DEFAULT 'submitted',
  FOREIGN KEY (`form_id`) REFERENCES `Forms`(`form_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_response` (`form_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Response Answers
CREATE TABLE IF NOT EXISTS `Response_Answers` (
  `answer_id` INT AUTO_INCREMENT PRIMARY KEY,
  `response_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `answer_text` TEXT,
  `rating_value` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`response_id`) REFERENCES `Form_Responses`(`response_id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `Questions`(`question_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- EVALUATION SYSTEM TABLES
-- ============================================

-- Evaluation Periods
CREATE TABLE IF NOT EXISTS `evaluation_periods` (
  `period_id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_name` VARCHAR(100) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('upcoming', 'active', 'completed') NOT NULL DEFAULT 'upcoming',
  `academic_year` VARCHAR(20) NOT NULL,
  `semester` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Evaluation Subjects
CREATE TABLE IF NOT EXISTS `evaluation_subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `instructor_id` INT NOT NULL,
  `section_id` INT DEFAULT NULL,
  `status` ENUM('pending', 'open', 'closed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`period_id`) REFERENCES `evaluation_periods`(`period_id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `Subjects`(`subject_id`) ON DELETE CASCADE,
  FOREIGN KEY (`instructor_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_eval_subject` (`period_id`, `subject_id`, `instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subject Evaluation Responses
CREATE TABLE IF NOT EXISTS `subject_evaluation_responses` (
  `response_id` INT AUTO_INCREMENT PRIMARY KEY,
  `evaluation_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_anonymous` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluation_subjects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_eval_response` (`evaluation_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create indexes for subject_evaluation_responses
CREATE INDEX idx_evaluation_response_student ON subject_evaluation_responses(student_id, submitted_at);

-- ============================================
-- FEEDBACK TEMPLATE SYSTEM
-- ============================================

-- Feedback Templates
CREATE TABLE IF NOT EXISTS `feedback_templates` (
  `template_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `template_type` ENUM('student', 'instructor', 'alumni', 'employer', 'self') NOT NULL,
  `content` JSON NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Subject Feedback
CREATE TABLE IF NOT EXISTS `subject_feedback` (
  `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
  `subject_id` INT NOT NULL,
  `instructor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `rating` DECIMAL(3,2) DEFAULT NULL,
  `feedback_text` TEXT,
  `category_id` INT DEFAULT NULL,
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subject_id`) REFERENCES `Subjects`(`subject_id`) ON DELETE CASCADE,
  FOREIGN KEY (`instructor_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `Form_Categories`(`category_id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_subject_feedback` (`subject_id`, `instructor_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index for subject_feedback
CREATE INDEX idx_subject_feedback_subject ON subject_feedback(subject_id, instructor_id);

-- Instructor Feedback
CREATE TABLE IF NOT EXISTS `instructor_feedback` (
  `feedback_id` INT AUTO_INCREMENT PRIMARY KEY,
  `instructor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `rating` DECIMAL(3,2) DEFAULT NULL,
  `feedback_text` TEXT,
  `category_id` INT DEFAULT NULL,
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`instructor_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `Form_Categories`(`category_id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_instructor_feedback` (`instructor_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index for instructor_feedback
CREATE INDEX idx_instructor_feedback_instructor ON instructor_feedback(instructor_id);

-- ============================================
-- ALUMNI EMPLOYMENT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS `Alumni_Employment` (
  `employment_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `company_name` VARCHAR(255) NOT NULL,
  `job_title` VARCHAR(255) NOT NULL,
  `industry` VARCHAR(100) DEFAULT NULL,
  `employment_type` ENUM('full_time', 'part_time', 'contract', 'internship', 'self_employed') DEFAULT 'full_time',
  `location` VARCHAR(255) DEFAULT NULL,
  `salary_range` VARCHAR(50) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `is_current` BOOLEAN DEFAULT TRUE,
  `employment_status` ENUM('employed', 'unemployed', 'self_employed', 'pursuing_studies') DEFAULT 'employed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `alumni_employment_tracker` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `is_employed` BOOLEAN DEFAULT FALSE,
  `employment_status` VARCHAR(50) DEFAULT NULL,
  `needs_update` BOOLEAN DEFAULT FALSE,
  `last_update_request` DATETIME DEFAULT NULL,
  `last_verified` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_tracker` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS `Notifications` (
  `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('info', 'success', 'warning', 'error', 'reminder') NOT NULL DEFAULT 'info',
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` DATETIME DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `action_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `preference_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email_notifications` BOOLEAN DEFAULT TRUE,
  `push_notifications` BOOLEAN DEFAULT TRUE,
  `feedback_reminders` BOOLEAN DEFAULT TRUE,
  `system_updates` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- STUDENT PROMOTION
-- ============================================

CREATE TABLE IF NOT EXISTS `Student_Promotions` (
  `promotion_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `from_year` VARCHAR(20) NOT NULL,
  `to_year` VARCHAR(20) NOT NULL,
  `from_semester` VARCHAR(20) NOT NULL,
  `to_semester` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  `gpa` DECIMAL(4,2) DEFAULT NULL,
  `total_credits` INT DEFAULT 0,
  `passed_credits` INT DEFAULT 0,
  `remarks` TEXT DEFAULT NULL,
  `approved_by` INT DEFAULT NULL,
  `approved_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `Settings` (
  `setting_id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `setting_type` ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  `category` VARCHAR(50) DEFAULT 'general',
  `description` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default settings
INSERT IGNORE INTO `Settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`) VALUES
('system_name', 'FeedbACTS System', 'string', 'general', 'The name of the system'),
('feedback_deadline_days', '7', 'number', 'feedback', 'Default days before feedback deadline'),
('max_file_size', '10485760', 'number', 'upload', 'Maximum upload file size in bytes'),
('smtp_host', 'smtp.gmail.com', 'string', 'email', 'SMTP server host'),
('smtp_port', '587', 'number', 'email', 'SMTP server port'),
('alumni_update_frequency', '6', 'number', 'employment', 'Months between employment update requests');

-- ============================================
-- REORDER SCHEMA (Run after other schemas)
-- ============================================

CREATE TABLE IF NOT EXISTS `Reorder_Requests` (
  `request_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` INT NOT NULL,
  `current_section` VARCHAR(20) NOT NULL,
  `requested_section` VARCHAR(20) NOT NULL,
  `reason` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `processed_by` INT DEFAULT NULL,
  `processed_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`subject_id`) REFERENCES `Subjects`(`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- COMPLETE! All tables created in correct order
-- ============================================