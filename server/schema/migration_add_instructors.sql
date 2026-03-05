-- Migration: Add missing instructors table
-- Run this SQL to fix the missing instructors table issue

CREATE TABLE IF NOT EXISTS instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    instructor_id VARCHAR(50),
    department VARCHAR(100),
    subject_taught TEXT,
    school_role VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert existing instructors from users table (for users with role='instructor' who don't have a profile yet)
INSERT INTO instructors (user_id, instructor_id, department, school_role)
SELECT u.id, u.id, NULL, 'Instructor'
FROM users u
WHERE u.role = 'instructor'
AND u.id NOT IN (SELECT user_id FROM instructors WHERE user_id IS NOT NULL);

-- Create missing tables for subject evaluation system
CREATE TABLE IF NOT EXISTS subject_instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    instructor_id INT NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_subject_instructor (subject_id, instructor_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS subject_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_subject (subject_id, student_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS evaluation_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    subject_id INT NOT NULL,
    instructor_id INT,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS subject_evaluation_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluation_form_id INT NOT NULL,
    subject_id INT NOT NULL,
    instructor_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    responses JSON NOT NULL,
    overall_rating DECIMAL(3,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_form_id) REFERENCES evaluation_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_form (student_id, evaluation_form_id, academic_year, semester)
);

-- Create indexes
CREATE INDEX idx_subject_instructor ON subject_instructors(instructor_id, academic_year);
CREATE INDEX idx_subject_student ON subject_students(student_id, academic_year);
CREATE INDEX idx_evaluation_response_student ON subject_evaluation_responses(student_id, submitted_at);
CREATE INDEX idx_evaluation_response_subject ON subject_evaluation_responses(subject_id, instructor_id);
