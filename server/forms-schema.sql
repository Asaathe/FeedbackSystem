-- ============================================================
-- FEEDBACK FORMS SYSTEM DATABASE SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS Forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    target_audience VARCHAR(100) NOT NULL,
    status ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft',
    image_url VARCHAR(500),
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submission_count INT DEFAULT 0,
    
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_target_audience (target_audience),
    INDEX idx_status (status),
    INDEX idx_is_template (is_template),
    INDEX idx_created_by (created_by),
    INDEX idx_dates (start_date, end_date)
);

-- Questions table - stores individual questions for each form
CREATE TABLE IF NOT EXISTS Questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('text', 'textarea', 'multiple-choice', 'checkbox', 'dropdown', 'rating', 'linear-scale') NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    min_value INT,
    max_value INT,
    order_index INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_order (order_index)
);

-- Question_Options table - stores options for choice-based questions
CREATE TABLE IF NOT EXISTS Question_Options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_order (order_index)
);

-- Form_Deployments table - tracks when and to whom forms are deployed
CREATE TABLE IF NOT EXISTS Form_Deployments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    deployed_by INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_filters JSON, -- Stores deployment filters (e.g., specific courses, departments)
    deployment_status ENUM('scheduled', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    FOREIGN KEY (deployed_by) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_deployment_status (deployment_status),
    INDEX idx_dates (start_date, end_date)
);

-- Form_Responses table - stores completed form submissions
CREATE TABLE IF NOT EXISTS Form_Responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    user_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_data JSON NOT NULL, -- Stores all question responses as JSON
    
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_response (form_id, user_id), -- Prevent duplicate submissions
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_submitted_at (submitted_at)
);

-- Form_Assignments table - tracks which users are assigned to which forms
CREATE TABLE IF NOT EXISTS Form_Assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'expired') NOT NULL DEFAULT 'pending',
    
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (form_id, user_id),
    INDEX idx_form_id (form_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- Form_Analytics table - stores aggregated analytics data for forms
CREATE TABLE IF NOT EXISTS Form_Analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    metric_type ENUM('submission_count', 'completion_rate', 'average_rating', 'response_time') NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (form_id) REFERENCES Forms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_metric (form_id, metric_type, metric_date),
    INDEX idx_form_id (form_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_metric_date (metric_date)
);

-- Form_Categories table - manages form categories
CREATE TABLE IF NOT EXISTS Form_Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO Form_Categories (name, description) VALUES
('Academic', 'Feedback related to academic programs, courses, and instruction'),
('Facilities', 'Feedback about campus facilities, infrastructure, and resources'),
('Services', 'Feedback on administrative services and support'),
('Alumni', 'Feedback from alumni about their experience and suggestions'),
('Career Support', 'Feedback about career services and employment support'),
('Technology', 'Feedback about IT services and technology resources'),
('Student Life', 'Feedback about student activities and campus life'),
('Library', 'Feedback about library services and resources'),
('Finance', 'Feedback about financial services and billing'),
('Health Services', 'Feedback about health and wellness services')
ON DUPLICATE KEY UPDATE name=name;

-- ============================================================
-- VIEWS FOR EASY DATA ACCESS
-- ============================================================

-- View to get form summary with analytics
CREATE OR REPLACE VIEW Form_Summary AS
SELECT 
    f.id,
    f.title,
    f.description,
    f.category,
    f.target_audience,
    f.status,
    f.image_url,
    f.start_date,
    f.end_date,
    f.is_template,
    f.created_by,
    f.created_at,
    f.updated_at,
    f.submission_count,
    u.full_name as creator_name,
    COUNT(DISTINCT fr.id) as current_submissions,
    COUNT(DISTINCT fa.id) as total_assignments,
    COUNT(DISTINCT CASE WHEN fa.status = 'completed' THEN fa.id END) as completed_assignments
FROM Forms f
LEFT JOIN Users u ON f.created_by = u.id
LEFT JOIN Form_Responses fr ON f.id = fr.form_id
LEFT JOIN Form_Assignments fa ON f.id = fa.form_id
GROUP BY f.id;

-- View to get question details with options
CREATE OR REPLACE VIEW Question_Details AS
SELECT 
    q.id,
    q.form_id,
    q.question_text,
    q.question_type,
    q.description,
    q.required,
    q.min_value,
    q.max_value,
    q.order_index,
    GROUP_CONCAT(
        JSON_OBJECT(
            'id', qo.id,
            'option_text', qo.option_text,
            'order_index', qo.order_index
        ) ORDER BY qo.order_index
    ) as options_json
FROM Questions q
LEFT JOIN Question_Options qo ON q.id = qo.question_id
GROUP BY q.id
ORDER BY q.form_id, q.order_index;

-- ============================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================================

-- Procedure to create a new form with questions
DELIMITER //
CREATE PROCEDURE CreateFormWithQuestions(
    IN p_title VARCHAR(255),
    IN p_description TEXT,
    IN p_category VARCHAR(100),
    IN p_target_audience VARCHAR(100),
    IN p_is_template BOOLEAN,
    IN p_created_by INT,
    IN p_questions JSON
)
BEGIN
    DECLARE form_id INT;
    DECLARE question_count INT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    
    -- Insert form
    INSERT INTO Forms (title, description, category, target_audience, is_template, created_by)
    VALUES (p_title, p_description, p_category, p_target_audience, p_is_template, p_created_by);
    
    SET form_id = LAST_INSERT_ID();
    
    -- Insert questions if provided
    IF p_questions IS NOT NULL THEN
        SET question_count = JSON_LENGTH(p_questions);
        
        WHILE i < question_count DO
            INSERT INTO Questions (
                form_id, 
                question_text, 
                question_type, 
                description, 
                required, 
                min_value, 
                max_value, 
                order_index
            )
            VALUES (
                form_id,
                JSON_UNQUOTE(JSON_EXTRACT(p_questions, CONCAT('$[', i, '].question'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_questions, CONCAT('$[', i, '].type'))),
                JSON_UNQUOTE(JSON_EXTRACT(p_questions, CONCAT('$[', i, '].description'))),
                JSON_EXTRACT(p_questions, CONCAT('$[', i, '].required')),
                JSON_EXTRACT(p_questions, CONCAT('$[', i, '].min')),
                JSON_EXTRACT(p_questions, CONCAT('$[', i, '].max')),
                i
            );
            
            SET i = i + 1;
        END WHILE;
    END IF;
    
    SELECT form_id as new_form_id;
END //
DELIMITER ;

-- Procedure to deploy a form to target audience
DELIMITER //
CREATE PROCEDURE DeployForm(
    IN p_form_id INT,
    IN p_deployed_by INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_target_filters JSON
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert deployment record
    INSERT INTO Form_Deployments (form_id, deployed_by, start_date, end_date, target_filters, deployment_status)
    VALUES (p_form_id, p_deployed_by, p_start_date, p_end_date, p_target_filters, 'active');
    
    -- Update form status to active
    UPDATE Forms SET status = 'active' WHERE id = p_form_id;
    
    -- Create assignments for target users based on filters
    -- This is a simplified version - in production, you'd implement more complex filtering logic
    INSERT INTO Form_Assignments (form_id, user_id, status)
    SELECT DISTINCT p_form_id, u.id, 'pending'
    FROM Users u
    WHERE u.status = 'active'
    AND (
        p_target_filters IS NULL OR
        JSON_CONTAINS(p_target_filters, JSON_QUOTE(u.role), '$.roles') OR
        JSON_CONTAINS(p_target_filters, JSON_QUOTE(u.role), '$.target_audience')
    )
    AND NOT EXISTS (
        SELECT 1 FROM Form_Assignments fa 
        WHERE fa.form_id = p_form_id AND fa.user_id = u.id
    );
    
    COMMIT;
    
    SELECT 'Form deployed successfully' as message;
END //
DELIMITER ;

-- ============================================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================================

-- Trigger to update submission count when a response is added
DELIMITER //
CREATE TRIGGER UpdateSubmissionCount
AFTER INSERT ON Form_Responses
FOR EACH ROW
BEGIN
    UPDATE Forms 
    SET submission_count = submission_count + 1 
    WHERE id = NEW.form_id;
END //
DELIMITER ;

-- Trigger to validate question type and options
DELIMITER //
CREATE TRIGGER ValidateQuestionOptions
BEFORE INSERT ON Questions
FOR EACH ROW
BEGIN
    IF NEW.question_type IN ('multiple-choice', 'checkbox', 'dropdown') THEN
        IF NEW.id IS NOT NULL THEN
            -- Check if options exist for choice-based questions
            -- This would be validated at application level primarily
            SET NEW.required = TRUE; -- Make choice questions required by default
        END IF;
    END IF;
END //
DELIMITER ;

-- ============================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================

-- Insert sample forms
INSERT INTO Forms (title, description, category, target_audience, status, is_template, created_by) VALUES
('End of Semester Instructor Feedback', 'Rate your instructor and course experience', 'Academic', 'Students', 'active', TRUE, 1),
('Campus Facilities Survey', 'Feedback on campus facilities and infrastructure', 'Facilities', 'All', 'draft', TRUE, 1),
('Alumni Career Services Feedback', 'Feedback on career services from alumni perspective', 'Career Support', 'Alumni', 'active', TRUE, 1),
('Student Satisfaction Survey', 'Overall student satisfaction with university services', 'Services', 'Students', 'active', FALSE, 1);

-- Insert sample questions for the first form
INSERT INTO Questions (form_id, question_text, question_type, description, required, order_index) VALUES
(1, 'How would you rate the overall quality of instruction?', 'rating', 'Rate from 1 (Poor) to 5 (Excellent)', TRUE, 0),
(1, 'How clear were the course objectives and expectations?', 'rating', 'Rate from 1 (Not Clear) to 5 (Very Clear)', TRUE, 1),
(1, 'How would you rate the instructor\'s knowledge of the subject matter?', 'rating', 'Rate from 1 (Poor) to 5 (Excellent)', TRUE, 2),
(1, 'How effective was the instructor in explaining the material?', 'rating', 'Rate from 1 (Not Effective) to 5 (Very Effective)', TRUE, 3),
(1, 'How would you rate the instructor\'s availability for help outside of class?', 'rating', 'Rate from 1 (Never Available) to 5 (Always Available)', TRUE, 4),
(1, 'What aspects of the course did you find most valuable?', 'textarea', 'Please provide specific feedback', FALSE, 5),
(1, 'What suggestions do you have for improving the course?', 'textarea', 'Your suggestions are valuable to us', FALSE, 6);

-- Insert options for rating questions (1-5 scale)
INSERT INTO Question_Options (question_id, option_text, order_index) VALUES
(1, '1 - Poor', 0),
(1, '2 - Fair', 1),
(1, '3 - Good', 2),
(1, '4 - Very Good', 3),
(1, '5 - Excellent', 4),
(2, '1 - Not Clear', 0),
(2, '2 - Slightly Clear', 1),
(2, '3 - Moderately Clear', 2),
(2, '4 - Very Clear', 3),
(2, '5 - Extremely Clear', 4),
(3, '1 - Poor', 0),
(3, '2 - Fair', 1),
(3, '3 - Good', 2),
(3, '4 - Very Good', 3),
(3, '5 - Excellent', 4),
(4, '1 - Not Effective', 0),
(4, '2 - Slightly Effective', 1),
(4, '3 - Moderately Effective', 2),
(4, '4 - Very Effective', 3),
(4, '5 - Extremely Effective', 4),
(5, '1 - Never Available', 0),
(5, '2 - Rarely Available', 1),
(5, '3 - Sometimes Available', 2),
(5, '4 - Usually Available', 3),
(5, '5 - Always Available', 4);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional indexes for better query performance
CREATE INDEX idx_form_responses_user_form ON Form_Responses(user_id, form_id);
CREATE INDEX idx_form_assignments_user_status ON Form_Assignments(user_id, status);
CREATE INDEX idx_form_deployments_status_dates ON Form_Deployments(deployment_status, start_date, end_date);
CREATE INDEX idx_questions_form_type ON Questions(form_id, question_type);
CREATE INDEX idx_question_options_question_order ON Question_Options(question_id, order_index);

-- ============================================================
-- END OF SCHEMA
-- ============================================================