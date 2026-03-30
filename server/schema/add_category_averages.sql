-- Add category_averages column to instructor_feedback and subject_feedback tables
-- This enables storing Main Category = Average of Subcategories

-- Add category_averages column to instructor_feedback table
ALTER TABLE instructor_feedback 
ADD COLUMN category_averages JSON NULL AFTER overall_rating;

-- Add category_averages column to subject_feedback table
ALTER TABLE subject_feedback 
ADD COLUMN category_averages JSON NULL AFTER overall_rating;

-- Add index for faster queries on category averages
ALTER TABLE instructor_feedback ADD INDEX idx_category_averages ((CAST(category_averages AS CHAR(500))));
ALTER TABLE subject_feedback ADD INDEX idx_category_averages ((CAST(category_averages AS CHAR(500))));
