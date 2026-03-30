-- Add fields for employment update tracking
-- This enables tracking when update requests are sent and received

ALTER TABLE `alumni_employment` 
ADD COLUMN `employment_type` ENUM('full-time', 'part-time', 'contract', 'internship', 'temporary') DEFAULT NULL,
ADD COLUMN `monthly_salary` VARCHAR(100) DEFAULT NULL,
ADD COLUMN `is_relevant_to_degree` ENUM('yes', 'no', 'partially') DEFAULT NULL,
ADD COLUMN `last_update_sent` DATETIME DEFAULT NULL,
ADD COLUMN `last_update_received` DATETIME DEFAULT NULL;

-- Create index for faster queries on update tracking
CREATE INDEX idx_employment_update_tracking ON alumni_employment(last_update_sent, last_update_received);
