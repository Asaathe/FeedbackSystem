-- Add feedback_type column to categories table
ALTER TABLE feedback_template_categories ADD COLUMN feedback_type ENUM('subject', 'instructor', 'general') DEFAULT 'general' AFTER display_order;

-- Update existing categories to be 'subject' type (they relate to subject/course feedback)
UPDATE feedback_template_categories SET feedback_type = 'subject' WHERE id IN (1, 2, 3, 4, 5);

-- Add Instructor Feedback categories
INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT 'Teaching Style', 'How would you rate the instructor\'s teaching approach and methods', 6, 'instructor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Teaching Style');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT 'Communication', 'How effective was the instructor\'s communication with students', 7, 'instructor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Communication');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT 'Knowledge & Expertise', 'How would you rate the instructor\'s knowledge of the subject', 8, 'instructor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Knowledge & Expertise');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT 'Accessibility', 'How accessible was the instructor for questions and consultations', 9, 'instructor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Accessibility');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT 'Fairness', 'How fair was the instructor in grading and evaluation', 10, 'instructor', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Fairness');

-- Verify the results
SELECT * FROM feedback_template_categories ORDER BY feedback_type, display_order;
