-- Instructor Courses Table - Links instructors to course_management programs
-- This table tracks which instructor teaches which program/section

CREATE TABLE IF NOT EXISTS instructor_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    program_id INT NOT NULL COMMENT 'References course_management.id',
    student_id INT COMMENT 'Student enrolled in this course',
    form_id INT COMMENT 'Evaluation form assigned to this course',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_program_id (program_id),
    INDEX idx_student_id (student_id),
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES course_management(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
