-- Migration script to add ai_description column to Forms table
-- Run this to fix the issue where detail description is empty when editing published forms

ALTER TABLE `forms`
ADD COLUMN `ai_description` text DEFAULT NULL AFTER `description`;

-- Verify the column was added
SELECT `id`, `title`, `description`, `ai_description` FROM `forms` LIMIT 5;
