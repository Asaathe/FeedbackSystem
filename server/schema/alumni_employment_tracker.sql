-- Alumni Employment Update Tracker Schema
-- Adds tracking status and scheduling fields for the Shopee-like progress tracker

-- Add tracking status enum to track the current stage of employment update request
ALTER TABLE alumni_employment 
ADD COLUMN update_status ENUM(
  'pending',        -- Email Pending: No update request ever sent
  'sent',           -- Email Sent: System sent update request
  'awaiting',       -- Awaiting Response: Waiting for alumni/employer reply
  'received',       -- Feedback Received: Employment info updated
  'scheduled'       -- Next Email Scheduled: Next email after 11 months
) DEFAULT 'pending' AFTER last_update_received;

-- Add next scheduled email date for the 11-month follow-up
ALTER TABLE alumni_employment
ADD COLUMN next_email_date DATE DEFAULT NULL AFTER update_status;

-- Add email count to track how many update requests have been sent
ALTER TABLE alumni_employment
ADD COLUMN update_email_count INT DEFAULT 0 AFTER next_email_date;

-- Add response deadline (optional - for tracking if alumni haven't responded within expected time)
ALTER TABLE alumni_employment
ADD COLUMN response_deadline DATE DEFAULT NULL AFTER update_email_count;

-- Add index for faster queries on tracking status
CREATE INDEX idx_employment_tracker_status ON alumni_employment(update_status, next_email_date);

-- Create a table to queue scheduled email jobs (for the 11-month scheduling system)
CREATE TABLE IF NOT EXISTS `employment_update_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumni_user_id` int(11) NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `status` ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  `email_sent_at` DATETIME DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_alumni_user_id` (`alumni_user_id`),
  KEY `idx_scheduled_date` (`scheduled_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `employment_update_queue_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create a view to easily see all alumni with their current tracking status
CREATE OR REPLACE VIEW `alumni_employment_tracker_view` AS
SELECT 
  ae.id,
  ae.alumni_user_id,
  u.full_name AS alumni_name,
  u.email AS alumni_email,
  ae.company_name,
  ae.job_title,
  ae.update_status,
  ae.last_update_sent,
  ae.last_update_received,
  ae.next_email_date,
  ae.update_email_count,
  ae.response_deadline,
  CASE 
    WHEN ae.update_status = 'pending' THEN 'No update request has been sent yet'
    WHEN ae.update_status = 'sent' THEN 'Update request email has been sent'
    WHEN ae.update_status = 'awaiting' THEN 'Waiting for alumni/employer response'
    WHEN ae.update_status = 'received' THEN 'Employment information has been updated'
    WHEN ae.update_status = 'scheduled' THEN CONCAT('Next email scheduled for ', CAST(ae.next_email_date AS CHAR))
    ELSE 'Unknown status'
  END AS status_description,
  CASE
    WHEN ae.last_update_received IS NULL THEN DATEDIFF(NOW(), ae.created_at)
    ELSE DATEDIFF(NOW(), ae.last_update_received)
  END AS days_since_last_update
FROM alumni_employment ae
JOIN users u ON ae.alumni_user_id = u.id
WHERE u.role = 'alumni';
