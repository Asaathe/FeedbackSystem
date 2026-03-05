-- Create subject_evaluation_forms table for tracking evaluation form assignments
-- This table stores which forms are assigned to which subjects/instructors

CREATE TABLE IF NOT EXISTS subject_evaluation_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT,
    subject_instructor_id INT,
    form_id INT NOT NULL,
    evaluation_type VARCHAR(20) DEFAULT 'both',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment (subject_id, subject_instructor_id, form_id)
);

-- Add indexes for better performance
CREATE INDEX idx_sef_subject ON subject_evaluation_forms(subject_id);
CREATE INDEX idx_sef_instructor ON subject_evaluation_forms(subject_instructor_id);
CREATE INDEX idx_sef_form ON subject_evaluation_forms(form_id);
