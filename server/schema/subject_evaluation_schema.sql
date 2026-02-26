-- Subject Evaluation Database Schema
-- This schema adds the course_sections table to link instructors with subjects

-- Course Sections table - links instructors to specific course sections
CREATE TABLE IF NOT EXISTS course_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    section VARCHAR(10) NOT NULL,
    year_level INT NOT NULL,
    department VARCHAR(100),
    instructor_id INT NOT NULL,
    student_id INT,
    form_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_instructor_id (instructor_id),
    INDEX idx_student_id (student_id),
    INDEX idx_form_id (form_id),
    INDEX idx_course_section (course_code, section, year_level),
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Example: Insert sample course sections (for testing)
-- INSERT INTO course_sections (course_code, course_name, section, year_level, department, instructor_id) 
-- VALUES 
-- ('CS101', 'Introduction to Computer Science', 'A', 1, 'College', 2),
-- ('CS201', 'Data Structures and Algorithms', 'B', 2, 'College', 2),
-- ('CS301', 'Database Management Systems', 'A', 3, 'College', 2);
