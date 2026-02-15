-- Add Sections Table for Form Builder
-- This enables grouping related questions into sections

CREATE TABLE IF NOT EXISTS `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `form_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'New Section',
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_form_id` (`form_id`),
  KEY `idx_order` (`order_index`),
  CONSTRAINT `fk_sections_form` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add section_id column to questions table for linking questions to sections
ALTER TABLE `questions` 
ADD COLUMN `section_id` int(11) DEFAULT NULL AFTER `form_id`,
ADD KEY `idx_section_id` (`section_id`),
ADD CONSTRAINT `fk_questions_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL;

-- Add index on questions for form_id + section_id + order_index combination for efficient queries
ALTER TABLE `questions`
ADD KEY `idx_questions_form_section_order` (`form_id`, `section_id`, `order_index`);
