-- Add separate categories for Instructor Feedback
-- Run this script to add instructor-specific feedback categories

-- Insert Instructor Feedback categories
INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT * FROM (SELECT 'Teaching Style', 'How would you rate the instructor\'s teaching approach and methods', 6, 'instructor', 1, NOW(), NOW()) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Teaching Style' AND feedback_type = 'instructor');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT * FROM (SELECT 'Communication', 'How effective was the instructor\'s communication with students', 7, 'instructor', 1, NOW(), NOW()) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Communication' AND feedback_type = 'instructor');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT * FROM (SELECT 'Knowledge & Expertise', 'How would you rate the instructor\'s knowledge of the subject', 8, 'instructor', 1, NOW(), NOW()) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Knowledge & Expertise' AND feedback_type = 'instructor');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT * FROM (SELECT 'Accessibility', 'How accessible was the instructor for questions and consultations', 9, 'instructor', 1, NOW(), NOW()) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Accessibility' AND feedback_type = 'instructor');

INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, is_active, created_at, updated_at)
SELECT * FROM (SELECT 'Fairness', 'How fair was the instructor in grading and evaluation', 10, 'instructor', 1, NOW(), NOW()) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM feedback_template_categories WHERE category_name = 'Fairness' AND feedback_type = 'instructor');

-- Verify the results
SELECT * FROM feedback_template_categories ORDER BY display_order;
