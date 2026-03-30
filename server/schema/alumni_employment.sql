-- Alumni Employment Table
-- Stores employment information for alumni in a separate table for better organization

CREATE TABLE `alumni_employment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alumni_user_id` int(11) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `employment_status` ENUM('full-time', 'part-time', 'contract') DEFAULT NULL,
  `industry_type` varchar(100) DEFAULT NULL,
  `company_address` varchar(500) DEFAULT NULL,
  `supervisor_name` varchar(255) DEFAULT NULL,
  `supervisor_email` varchar(255) DEFAULT NULL,
  `year_started` year(4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `alumni_user_id` (`alumni_user_id`),
  CONSTRAINT `alumni_employment_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Note: This table has a one-to-one relationship with alumni users
-- The UNIQUE constraint ensures each alumni can only have one employment record
