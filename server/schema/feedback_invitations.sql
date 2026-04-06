-- Feedback Invitations Table for Secure Short Links
-- This table stores invitation tokens and supervisor data for secure feedback links

CREATE TABLE `feedback_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL COMMENT 'Secure random token for short links',
  `form_id` int(11) NOT NULL COMMENT 'Reference to forms.id',
  `supervisor_email` varchar(255) NOT NULL,
  `supervisor_name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `alumnus_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether the invitation has been used',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `form_id` (`form_id`),
  KEY `expires_at` (`expires_at`),
  KEY `used` (`used`),
  CONSTRAINT `feedback_invitations_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;