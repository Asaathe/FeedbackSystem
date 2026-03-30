-- Notifications System for FeedbACTS
-- This schema creates the notifications table for storing user notifications

-- Create notifications table
CREATE TABLE IF NOT EXISTS Notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM(
    'form_assigned',
    'employment_update_required',
    'feedback_reminder',
    'form_deadline_approaching',
    'feedback_received',
    'system_announcement'
  ) NOT NULL DEFAULT 'form_assigned',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  related_form_id INT NULL,
  related_employment_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_user_unread (user_id, is_read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add sample notifications for testing
INSERT INTO Notifications (user_id, type, title, message, is_read, created_at) VALUES
(101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', FALSE, NOW() - INTERVAL 1 DAY),
(101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', FALSE, NOW() - INTERVAL 2 HOUR),
(104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', FALSE, NOW() - INTERVAL 3 DAY),
(104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', TRUE, NOW() - INTERVAL 1 WEEK);

-- Table for tracking email notifications sent
CREATE TABLE IF NOT EXISTS NotificationEmails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  user_id INT NOT NULL,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMP NULL,
  email_error TEXT NULL,
  
  INDEX idx_notification_id (notification_id),
  INDEX idx_user_id (user_id),
  
  FOREIGN KEY (notification_id) REFERENCES Notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
