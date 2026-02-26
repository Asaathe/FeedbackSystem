-- Subject Enrollments Table
-- Stores multiple students per subject section

CREATE TABLE IF NOT EXISTS subject_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_section_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_id (student_id),
  INDEX idx_course_section_id (course_section_id),
  UNIQUE KEY unique_enrollment (student_id, course_section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
