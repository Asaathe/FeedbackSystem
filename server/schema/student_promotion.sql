-- Student Promotion Feature Schema
-- This schema adds tracking for student promotions (academic year advancement)

-- Add columns to track academic year and promotion history
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS academic_year YEAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS promotion_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS previous_program_id INT DEFAULT NULL;

-- Create table to track student promotion history
CREATE TABLE IF NOT EXISTS student_promotion_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Reference to students.id',
    user_id INT NOT NULL COMMENT 'Reference to users.id',
    previous_program_id INT COMMENT 'Previous course_management.id',
    new_program_id INT NOT NULL COMMENT 'New course_management.id',
    promotion_type ENUM('academic_year', 'graduation') NOT NULL,
    promotion_date DATE NOT NULL,
    promoted_by INT NOT NULL COMMENT 'Admin user who performed promotion',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_user_id (user_id),
    INDEX idx_promotion_date (promotion_date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_program_id) REFERENCES course_management(id) ON DELETE SET NULL,
    FOREIGN KEY (new_program_id) REFERENCES course_management(id) ON DELETE CASCADE,
    FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create table to track graduation records
CREATE TABLE IF NOT EXISTS graduation_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Reference to students.id',
    user_id INT NOT NULL COMMENT 'Reference to users.id',
    program_id INT NOT NULL COMMENT 'Course at time of graduation',
    graduation_year YEAR NOT NULL,
    degree VARCHAR(100) DEFAULT NULL,
    honors VARCHAR(100) DEFAULT NULL,
    ceremony_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_student_id (student_id),
    INDEX idx_user_id (user_id),
    INDEX idx_graduation_year (graduation_year),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES course_management(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View to get students eligible for promotion
CREATE OR REPLACE VIEW students_eligible_for_promotion AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.status as user_status,
    s.id as student_id,
    s.studentID,
    s.program_id,
    cm.program_name,
    cm.program_code,
    cm.year_level,
    cm.section,
    cm.course_section,
    cm.department,
    cm.status as program_status
FROM users u
INNER JOIN students s ON u.id = s.user_id
INNER JOIN course_management cm ON s.program_id = cm.id
WHERE u.role = 'student' 
    AND u.status = 'active'
    AND cm.status = 'active'
ORDER BY cm.department, cm.program_code, cm.year_level, cm.section;

-- View to get promotion history
CREATE OR REPLACE VIEW promotion_history_view AS
SELECT 
    sph.id,
    sph.student_id,
    u.full_name as student_name,
    u.email as student_email,
    s.studentID,
    sph.promotion_type,
    sph.promotion_date,
    sph.notes,
    sph.created_at,
    cm_old.program_code as old_program_code,
    cm_old.year_level as old_year_level,
    cm_old.section as old_section,
    cm_new.program_code as new_program_code,
    cm_new.year_level as new_year_level,
    cm_new.section as new_section,
    promoter.full_name as promoted_by_name
FROM student_promotion_history sph
INNER JOIN users u ON sph.user_id = u.id
INNER JOIN students s ON sph.student_id = s.id
LEFT JOIN course_management cm_old ON sph.previous_program_id = cm_old.id
LEFT JOIN course_management cm_new ON sph.new_program_id = cm_new.id
INNER JOIN users promoter ON sph.promoted_by = promoter.id
ORDER BY sph.promotion_date DESC;
