-- Performance Indexes for Subject Offerings
-- Run these commands manually in your production MySQL database

-- Indexes for evaluation_subjects table
CREATE INDEX idx_evaluation_subjects_department ON evaluation_subjects(department);
CREATE INDEX idx_evaluation_subjects_status ON evaluation_subjects(status);
CREATE INDEX idx_evaluation_subjects_dept_status ON evaluation_subjects(department, status);

-- Indexes for subject_offerings table
CREATE INDEX idx_subject_offerings_period_status ON subject_offerings(academic_period_id, status);
CREATE INDEX idx_subject_offerings_subject_period ON subject_offerings(subject_id, academic_period_id);
CREATE INDEX idx_subject_offerings_program_period ON subject_offerings(program_id, academic_period_id);

-- Indexes for course_management table
CREATE INDEX idx_course_management_department ON course_management(department);
CREATE INDEX idx_course_management_program_code ON course_management(program_code);

-- Index for users table
CREATE INDEX idx_users_role_status ON users(role, status);