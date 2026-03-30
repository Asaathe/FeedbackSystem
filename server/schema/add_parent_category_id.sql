-- Add parent_category_id column to support subcategories
ALTER TABLE feedback_template_categories ADD COLUMN parent_category_id INT NULL AFTER feedback_type;

-- Add foreign key constraint (optional - can be removed if not needed)
ALTER TABLE feedback_template_categories 
ADD CONSTRAINT fk_parent_category 
FOREIGN KEY (parent_category_id) REFERENCES feedback_template_categories(id) ON DELETE SET NULL;

-- Verify the changes
DESCRIBE feedback_template_categories;

-- Show current categories
SELECT * FROM feedback_template_categories ORDER BY feedback_type, display_order;
