-- Academic Periods Table
-- This table manages semester/quarter periods for College and Senior High
-- Supports both semester (College) and quarter (Senior High) systems

CREATE TABLE IF NOT EXISTS academic_periods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department ENUM('College', 'Senior High') NOT NULL,
  period_type ENUM('semester', 'quarter') NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  period_number INT NOT NULL COMMENT '1st, 2nd, 3rd, 4th',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  auto_transition BOOLEAN DEFAULT FALSE,
  transition_time TIME DEFAULT '06:00:00',
  status ENUM('upcoming', 'active', 'completed', 'archived') DEFAULT 'upcoming',
  previous_period_id INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_dept_period (department, period_type, academic_year, period_number),
  INDEX idx_department (department),
  INDEX idx_status (status),
  INDEX idx_academic_year (academic_year),
  INDEX idx_dates (start_date, end_date)
);

-- Semester Reset Log Table
-- Tracks all semester/quarter transitions for audit purposes

CREATE TABLE IF NOT EXISTS semester_reset_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department VARCHAR(50) NOT NULL,
  from_period_id INT,
  to_period_id INT,
  from_academic_year VARCHAR(20),
  from_period_number INT,
  to_academic_year VARCHAR(20),
  to_period_number INT,
  reset_type ENUM('subjects', 'evaluations', 'both') NOT NULL,
  triggered_by ENUM('manual', 'auto') DEFAULT 'manual',
  trigger_user_id INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_department (department),
  INDEX idx_triggered_by (triggered_by),
  INDEX idx_created_at (created_at)
);

-- Insert default academic periods for initial setup (optional)
-- These will be the starting points that admins can modify

-- Example for College (2 semesters per year)
-- INSERT INTO academic_periods (department, period_type, academic_year, period_number, start_date, end_date, status) VALUES
-- ('College', 'semester', '2025-2026', 1, '2025-06-01', '2025-10-31', 'active'),
-- ('College', 'semester', '2025-2026', 2, '2025-11-01', '2026-03-31', 'upcoming');

-- Example for Senior High (4 quarters per year)
-- INSERT INTO academic_periods (department, period_type, academic_year, period_number, start_date, end_date, status) VALUES
-- ('Senior High', 'quarter', '2025-2026', 1, '2025-06-01', '2025-08-31', 'active'),
-- ('Senior High', 'quarter', '2025-2026', 2, '2025-09-01', '2025-11-30', 'upcoming'),
-- ('Senior High', 'quarter', '2025-2026', 3, '2025-12-01', '2026-02-28', 'upcoming'),
-- ('Senior High', 'quarter', '2025-2026', 4, '2026-03-01', '2026-05-31', 'upcoming');
