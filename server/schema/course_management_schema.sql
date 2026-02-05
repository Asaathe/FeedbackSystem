-- Course Management Table Migration
-- Table: course_management
-- Replaces: course_sections

CREATE TABLE IF NOT EXISTS course_management (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department ENUM('College', 'Senior High') NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    program_code VARCHAR(50) NOT NULL,
    year_level INT NOT NULL COMMENT '1, 2, 3, 4 for College; 11, 12 for Senior High',
    section VARCHAR(10) NOT NULL COMMENT 'A, B, C, etc.',
    display_label VARCHAR(100) GENERATED ALWAYS AS (
        CONCAT(program_code, ' - ', year_level, section)
    ) STORED,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_department (department),
    INDEX idx_program_code (program_code),
    INDEX idx_year_level (year_level),
    INDEX idx_section (section),
    INDEX idx_status (status),
    UNIQUE INDEX idx_unique_program (department, program_code, year_level, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Copy data from old course_sections table (if exists)
-- Run this manually if you want to preserve old data:
-- INSERT INTO course_management (department, program_name, program_code, year_level, section, display_label, status, created_at, updated_at)
-- SELECT 
--     CASE 
--         WHEN category IN ('Grade 11', 'Grade 12') THEN 'Senior High'
--         ELSE 'College'
--     END AS department,
--     IFNULL(subcategory, value) AS program_name,
--     IFNULL(subcategory, 'GEN') AS program_code,
--     CASE 
--         WHEN category = 'Grade 11' THEN 11
--         WHEN category = 'Grade 12' THEN 12
--         ELSE 1
--     END AS year_level,
--     RIGHT(value, 1) AS section,
--     label AS display_label,
--     IF(is_active, 'active', 'inactive') AS status,
--     created_at,
--     updated_at
-- FROM course_sections;
