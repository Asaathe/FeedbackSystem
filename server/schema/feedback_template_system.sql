-- Feedback Template System Schema
-- This file contains the tables needed for the standardized Feedback Template System

-- ============================================
-- Feedback Template Categories (rating categories)
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_template_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_name (category_name)
);

-- ============================================
-- Evaluation Period (activation settings)
-- ============================================
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_period (academic_year, semester)
);

-- ============================================
-- Student Subject Feedback (subject ratings)
-- ============================================
CREATE TABLE IF NOT EXISTS subject_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    instructor_id INT NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    responses JSON NOT NULL,
    overall_rating DECIMAL(3,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_subject_feedback (student_id, subject_id, academic_year, semester)
);

-- ============================================
-- Student Instructor Feedback (instructor ratings)
-- ============================================
CREATE TABLE IF NOT EXISTS instructor_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    instructor_id INT NOT NULL,
    subject_id INT NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    responses JSON NOT NULL,
    overall_rating DECIMAL(3,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_instructor_feedback (student_id, instructor_id, academic_year, semester)
);

-- ============================================
-- Insert default categories if not exist
-- ============================================
INSERT INTO feedback_template_categories (category_name, description, display_order) 
SELECT * FROM (SELECT 'Clarity of Teaching', 'How clear was the instructor''s teaching style', 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Clarity of Teaching');

INSERT INTO feedback_template_categories (category_name, description, display_order) 
SELECT * FROM (SELECT 'Course Organization', 'How well was the course organized', 2) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Course Organization');

INSERT INTO feedback_template_categories (category_name, description, display_order) 
SELECT * FROM (SELECT 'Learning Materials', 'Quality of learning materials provided', 3) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Learning Materials');

INSERT INTO feedback_template_categories (category_name, description, display_order) 
SELECT * FROM (SELECT 'Student Engagement', 'Level of student engagement in class', 4) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Student Engagement');

INSERT INTO feedback_template_categories (category_name, description, display_order) 
SELECT * FROM (SELECT 'Overall Experience', 'Overall learning experience', 5) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Overall Experience');

-- ============================================
-- Create indexes for better query performance
-- ============================================
CREATE INDEX idx_subject_feedback_student ON subject_feedback(student_id, submitted_at);
CREATE INDEX idx_subject_feedback_subject ON subject_feedback(subject_id, instructor_id);
CREATE INDEX idx_instructor_feedback_student ON instructor_feedback(student_id, submitted_at);
CREATE INDEX idx_instructor_feedback_instructor ON instructor_feedback(instructor_id);
