-- Course Sections Table Schema
-- This table stores all available course-year and section combinations

CREATE TABLE IF NOT EXISTS course_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique identifier (e.g., BSIT-1A)',
  label VARCHAR(100) NOT NULL COMMENT 'Display label for dropdown',
  category VARCHAR(50) NOT NULL COMMENT 'Category: Grade 11, Grade 12, College',
  subcategory VARCHAR(50) COMMENT 'Subcategory: ABM, HUMSS, STEM, BSIT, etc.',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this course is currently available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_subcategory (subcategory),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial data - Grade 11
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('ABM11-LOVE', 'ABM11-LOVE', 'Grade 11', 'ABM'),
('ABM11-HOPE', 'ABM11-HOPE', 'Grade 11', 'ABM'),
('ABM11-FAITH', 'ABM11-FAITH', 'Grade 11', 'ABM'),
('HUMSS11-LOVE', 'HUMSS11-LOVE', 'Grade 11', 'HUMSS'),
('HUMSS11-HOPE', 'HUMSS11-HOPE', 'Grade 11', 'HUMSS'),
('HUMSS11-FAITH', 'HUMSS11-FAITH', 'Grade 11', 'HUMSS'),
('HUMSS11-JOY', 'HUMSS11-JOY', 'Grade 11', 'HUMSS'),
('HUMSS11-GENEROSITY', 'HUMSS11-GENEROSITY', 'Grade 11', 'HUMSS'),
('HUMSS11-HUMILITY', 'HUMSS11-HUMILITY', 'Grade 11', 'HUMSS'),
('HUMSS11-INTEGRITY', 'HUMSS11-INTEGRITY', 'Grade 11', 'HUMSS'),
('HUMSS11-WISDOM', 'HUMSS11-WISDOM', 'Grade 11', 'HUMSS'),
('STEM11-HOPE', 'STEM11-HOPE', 'Grade 11', 'STEM'),
('STEM11-FAITH', 'STEM11-FAITH', 'Grade 11', 'STEM'),
('STEM11-JOY', 'STEM11-JOY', 'Grade 11', 'STEM'),
('STEM11-GENEROSITY', 'STEM11-GENEROSITY', 'Grade 11', 'STEM'),
('ICT11-LOVE', 'ICT11-LOVE', 'Grade 11', 'ICT'),
('ICT11-HOPE', 'ICT11-HOPE', 'Grade 11', 'ICT');

-- Insert initial data - Grade 12
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('ABM12-LOVE', 'ABM12-LOVE', 'Grade 12', 'ABM'),
('ABM12-HOPE', 'ABM12-HOPE', 'Grade 12', 'ABM'),
('ABM12-FAITH', 'ABM12-FAITH', 'Grade 12', 'ABM'),
('HUMSS12-LOVE', 'HUMSS12-LOVE', 'Grade 12', 'HUMSS'),
('HUMSS12-HOPE', 'HUMSS12-HOPE', 'Grade 12', 'HUMSS'),
('HUMSS12-FAITH', 'HUMSS12-FAITH', 'Grade 12', 'HUMSS'),
('HUMSS12-JOY', 'HUMSS12-JOY', 'Grade 12', 'HUMSS'),
('HUMSS12-GENEROSITY', 'HUMSS12-GENEROSITY', 'Grade 12', 'HUMSS'),
('HUMSS12-HUMILITY', 'HUMSS12-HUMILITY', 'Grade 12', 'HUMSS'),
('STEM12-LOVE', 'STEM12-LOVE', 'Grade 12', 'STEM'),
('STEM12-HOPE', 'STEM12-HOPE', 'Grade 12', 'STEM'),
('STEM12-FAITH', 'STEM12-FAITH', 'Grade 12', 'STEM'),
('STEM12-JOY', 'STEM12-JOY', 'Grade 12', 'STEM'),
('STEM12-GENEROSITY', 'STEM12-GENEROSITY', 'Grade 12', 'STEM'),
('ICT12-LOVE', 'ICT12-LOVE', 'Grade 12', 'ICT'),
('ICT12-HOPE', 'ICT12-HOPE', 'Grade 12', 'ICT');

-- Insert initial data - College - BSIT
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSIT-1A', 'BSIT-1A', 'College', 'BSIT'),
('BSIT-1B', 'BSIT-1B', 'College', 'BSIT'),
('BSIT-1C', 'BSIT-1C', 'College', 'BSIT'),
('BSIT-2A', 'BSIT-2A', 'College', 'BSIT'),
('BSIT-2B', 'BSIT-2B', 'College', 'BSIT'),
('BSIT-2C', 'BSIT-2C', 'College', 'BSIT'),
('BSIT-3A', 'BSIT-3A', 'College', 'BSIT'),
('BSIT-3B', 'BSIT-3B', 'College', 'BSIT'),
('BSIT-3C', 'BSIT-3C', 'College', 'BSIT'),
('BSIT-4A', 'BSIT-4A', 'College', 'BSIT'),
('BSIT-4B', 'BSIT-4B', 'College', 'BSIT'),
('BSIT-4C', 'BSIT-4C', 'College', 'BSIT');

-- Insert initial data - College - BSBA
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSBA-1A', 'BSBA-1A', 'College', 'BSBA'),
('BSBA-2A', 'BSBA-2A', 'College', 'BSBA'),
('BSBA-3A', 'BSBA-3A', 'College', 'BSBA'),
('BSBA-4A', 'BSBA-4A', 'College', 'BSBA');

-- Insert initial data - College - BSCS
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSCS-1A', 'BSCS-1A', 'College', 'BSCS'),
('BSCS-2A', 'BSCS-2A', 'College', 'BSCS'),
('BSCS-3A', 'BSCS-3A', 'College', 'BSCS'),
('BSCS-4A', 'BSCS-4A', 'College', 'BSCS');

-- Insert initial data - College - BSEN
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSEN-1A', 'BSEN-1A', 'College', 'BSEN'),
('BSEN-2A', 'BSEN-2A', 'College', 'BSEN'),
('BSEN-3A', 'BSEN-3A', 'College', 'BSEN'),
('BSEN-4A', 'BSEN-4A', 'College', 'BSEN');

-- Insert initial data - College - BSOA
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSOA-1A', 'BSOA-1A', 'College', 'BSOA'),
('BSOA-2A', 'BSOA-2A', 'College', 'BSOA'),
('BSOA-3A', 'BSOA-3A', 'College', 'BSOA'),
('BSOA-4A', 'BSOA-4A', 'College', 'BSOA');

-- Insert initial data - College - BSAIS
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BSAIS-1A', 'BSAIS-1A', 'College', 'BSAIS'),
('BSAIS-2A', 'BSAIS-2A', 'College', 'BSAIS'),
('BSAIS-3A', 'BSAIS-3A', 'College', 'BSAIS'),
('BSAIS-4A', 'BSAIS-4A', 'College', 'BSAIS');

-- Insert initial data - College - BTVTEd
INSERT INTO course_sections (value, label, category, subcategory) VALUES
('BTVTEd-1A', 'BTVTEd-1A', 'College', 'BTVTEd'),
('BTVTEd-2A', 'BTVTEd-2A', 'College', 'BTVTEd'),
('BTVTEd-3A', 'BTVTEd-3A', 'College', 'BTVTEd'),
('BTVTEd-4A', 'BTVTEd-4A', 'College', 'BTVTEd');
