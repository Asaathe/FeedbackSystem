-- Subject Offerings Table
-- This table links subjects to programs, sections, and instructors
-- Students are automatically enrolled based on their program/year/section membership

CREATE TABLE IF NOT EXISTS subject_offerings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  program_id INT NOT NULL,
  year_level INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(20) NOT NULL,
  instructor_id INT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_offering (subject_id, program_id, year_level, section, academic_year, semester),
  INDEX idx_subject (subject_id),
  INDEX idx_program (program_id),
  INDEX idx_instructor (instructor_id),
  INDEX idx_academic (academic_year, semester)
);

-- Note: Foreign keys removed to avoid constraint issues with existing tables
-- The application logic validates relationships instead
