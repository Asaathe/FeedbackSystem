-- FeedbACTS Production Schema
-- Generated: Mar 30, 2026
-- Database: feedback_system

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- academic_periods

CREATE TABLE `academic_periods` (
  `id` int(11) NOT NULL,
  `department` enum('College','Senior High') NOT NULL,
  `period_type` enum('semester','quarter') NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `period_number` int(11) NOT NULL COMMENT '1st, 2nd, 3rd, 4th',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `auto_transition` tinyint(1) DEFAULT 0,
  `transition_time` time DEFAULT '00:00:00',
  `status` enum('upcoming','active','completed','archived') DEFAULT 'upcoming',
  `previous_period_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- alumni

CREATE TABLE `alumni` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `grad_year` year(4) DEFAULT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `jobtitle` varchar(255) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- alumni_employment

CREATE TABLE `alumni_employment` (
  `id` int(11) NOT NULL,
  `alumni_user_id` int(11) NOT NULL,
  `graduation_date` date DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `employment_status` enum('full-time','part-time','contract') DEFAULT NULL,
  `industry_type` varchar(100) DEFAULT NULL,
  `company_address` varchar(500) DEFAULT NULL,
  `supervisor_name` varchar(255) DEFAULT NULL,
  `supervisor_email` varchar(255) DEFAULT NULL,
  `year_started` year(4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `employment_type` enum('full-time','part-time','contract','internship','temporary') DEFAULT NULL,
  `monthly_salary` varchar(100) DEFAULT NULL,
  `is_relevant_to_degree` enum('yes','no','partially') DEFAULT NULL,
  `last_update_sent` datetime DEFAULT NULL,
  `last_update_received` datetime DEFAULT NULL,
  `update_status` enum('pending','sent','updated','scheduled') DEFAULT 'pending',
  `next_email_date` date DEFAULT NULL,
  `update_email_count` int(11) DEFAULT 0,
  `response_deadline` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- alumni_employment_tracker_view (view stub)
CREATE TABLE `alumni_employment_tracker_view` (
`id` int(11)
,`alumni_user_id` int(11)
,`alumni_name` varchar(255)
,`alumni_email` varchar(255)
,`company_name` varchar(255)
,`job_title` varchar(255)
,`update_status` enum('pending','sent','updated','scheduled')
,`last_update_sent` datetime
,`last_update_received` datetime
,`next_email_date` date
,`update_email_count` int(11)
,`response_deadline` date
,`status_description` varchar(39)
,`days_since_last_update` int(7)
);

-- course_management

CREATE TABLE `course_management` (
  `id` int(11) NOT NULL,
  `department` enum('College','Senior High') NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `program_code` varchar(50) NOT NULL,
  `year_level` int(11) NOT NULL,
  `section` varchar(10) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `course_section` varchar(100) GENERATED ALWAYS AS (concat(`program_code`,' - ',`year_level`,`section`)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- employers

CREATE TABLE `employers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `companyname` varchar(255) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- employment_update_queue

CREATE TABLE `employment_update_queue` (
  `id` int(11) NOT NULL,
  `alumni_user_id` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `email_sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- evaluation_forms

CREATE TABLE `evaluation_forms` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- evaluation_periods

CREATE TABLE `evaluation_periods` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- evaluation_subjects

CREATE TABLE `evaluation_subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `units` int(11) DEFAULT 3,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `average_rating` decimal(3,2) DEFAULT NULL,
  `total_ratings` int(11) DEFAULT 0,
  `last_rating_update` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- feedback_template_categories

CREATE TABLE `feedback_template_categories` (
  `id` int(11) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `feedback_type` enum('subject','instructor','general') DEFAULT 'general',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `parent_category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- forms

CREATE TABLE `forms` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `ai_description` text DEFAULT NULL,
  `type` enum('evaluation','general') DEFAULT 'general',
  `category` varchar(100) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `target_audience` varchar(100) NOT NULL,
  `status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
  `image_url` varchar(500) DEFAULT NULL,
  `is_template` tinyint(1) NOT NULL DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `submission_count` int(11) DEFAULT 0,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `deadline` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- form_assignments

CREATE TABLE `form_assignments` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- form_categories

CREATE TABLE `form_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- form_deployments

CREATE TABLE `form_deployments` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `deployed_by` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_date` date NOT NULL,
  `end_time` time DEFAULT NULL,
  `target_filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_filters`)),
  `deployment_status` enum('scheduled','active','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- form_responses

CREATE TABLE `form_responses` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `response_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`response_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- form_summary (view stub)
CREATE TABLE `form_summary` (
`id` int(11)
,`title` varchar(255)
,`description` text
,`category` varchar(100)
,`target_audience` varchar(100)
,`status` enum('draft','active','inactive','archived')
,`image_url` varchar(500)
,`start_date` date
,`end_date` date
,`is_template` tinyint(1)
,`created_by` int(11)
,`created_at` timestamp
,`updated_at` timestamp
,`submission_count` int(11)
,`creator_name` varchar(255)
,`current_submissions` bigint(21)
,`total_assignments` bigint(21)
,`completed_assignments` bigint(21)
);

-- graduation_records

CREATE TABLE `graduation_records` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'Reference to students.id',
  `user_id` int(11) NOT NULL COMMENT 'Reference to users.id',
  `program_id` int(11) NOT NULL COMMENT 'Course at time of graduation',
  `graduation_year` year(4) NOT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `honors` varchar(100) DEFAULT NULL,
  `ceremony_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- instructors

CREATE TABLE `instructors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `instructor_id` varchar(50) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `school_role` varchar(255) DEFAULT NULL,
  `subject_taught` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- instructor_courses

CREATE TABLE `instructor_courses` (
  `id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- instructor_feedback

CREATE TABLE `instructor_feedback` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responses`)),
  `overall_rating` decimal(3,2) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category_averages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`category_averages`)),
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- notificationemails

CREATE TABLE `notificationemails` (
  `id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email_sent` tinyint(1) NOT NULL DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `email_error` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- notifications

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('form_assigned','employment_update_required','feedback_reminder','form_deadline_approaching','feedback_received','system_announcement') NOT NULL DEFAULT 'form_assigned',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `related_form_id` int(11) DEFAULT NULL,
  `related_employment_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- questions

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('text','textarea','multiple-choice','checkbox','dropdown','rating','linear-scale') NOT NULL,
  `description` text DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT 0,
  `min_value` int(11) DEFAULT NULL,
  `max_value` int(11) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- question_details (view stub)
CREATE TABLE `question_details` (
`id` int(11)
,`form_id` int(11)
,`question_text` text
,`question_type` enum('text','textarea','multiple-choice','checkbox','dropdown','rating','linear-scale')
,`description` text
,`required` tinyint(1)
,`min_value` int(11)
,`max_value` int(11)
,`order_index` int(11)
,`options_json` mediumtext
);

-- question_options

CREATE TABLE `question_options` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- sections

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'New Section',
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- semester_reset_log

CREATE TABLE `semester_reset_log` (
  `id` int(11) NOT NULL,
  `department` varchar(50) NOT NULL,
  `from_period_id` int(11) DEFAULT NULL,
  `to_period_id` int(11) DEFAULT NULL,
  `from_academic_year` varchar(20) DEFAULT NULL,
  `from_period_number` int(11) DEFAULT NULL,
  `to_academic_year` varchar(20) DEFAULT NULL,
  `to_period_number` int(11) DEFAULT NULL,
  `reset_type` enum('subjects','evaluations','both') NOT NULL,
  `triggered_by` enum('manual','auto') DEFAULT 'manual',
  `trigger_user_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- shared_responses

CREATE TABLE `shared_responses` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `shared_with_instructor_id` int(11) NOT NULL,
  `shared_by` int(11) NOT NULL,
  `shared_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- students

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `studentID` varchar(50) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL COMMENT 'References course_management.id',
  `academic_year` year(4) DEFAULT NULL,
  `promotion_date` date DEFAULT NULL,
  `previous_program_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- student_promotion_history

CREATE TABLE `student_promotion_history` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'Reference to students.id',
  `user_id` int(11) NOT NULL COMMENT 'Reference to users.id',
  `previous_program_id` int(11) DEFAULT NULL COMMENT 'Previous course_management.id',
  `new_program_id` int(11) DEFAULT NULL,
  `promotion_type` enum('academic_year','graduation') NOT NULL,
  `promotion_date` date NOT NULL,
  `promoted_by` int(11) NOT NULL COMMENT 'Admin user who performed promotion',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_evaluation_responses

CREATE TABLE `subject_evaluation_responses` (
  `id` int(11) NOT NULL,
  `evaluation_form_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responses`)),
  `overall_rating` decimal(3,2) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_feedback

CREATE TABLE `subject_feedback` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `instructor_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`responses`)),
  `overall_rating` decimal(3,2) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category_averages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`category_averages`)),
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_instructors

CREATE TABLE `subject_instructors` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_offerings

CREATE TABLE `subject_offerings` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `year_level` int(11) NOT NULL,
  `section` varchar(10) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_feedbacks` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_sections

CREATE TABLE `subject_sections` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `academic_year` year(4) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- subject_students

CREATE TABLE `subject_students` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `status` enum('enrolled','dropped','completed') DEFAULT 'enrolled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- system_settings

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `department` varchar(50) DEFAULT NULL COMMENT 'NULL = applies to all, College/Senior High = specific department',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- users

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('admin','student','alumni','employer','instructor') NOT NULL,
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','inactive','pending') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `alumni_employment_tracker_view`
--
DROP TABLE IF EXISTS `alumni_employment_tracker_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `alumni_employment_tracker_view`  AS SELECT `ae`.`id` AS `id`, `ae`.`alumni_user_id` AS `alumni_user_id`, `u`.`full_name` AS `alumni_name`, `u`.`email` AS `alumni_email`, `ae`.`company_name` AS `company_name`, `ae`.`job_title` AS `job_title`, `ae`.`update_status` AS `update_status`, `ae`.`last_update_sent` AS `last_update_sent`, `ae`.`last_update_received` AS `last_update_received`, `ae`.`next_email_date` AS `next_email_date`, `ae`.`update_email_count` AS `update_email_count`, `ae`.`response_deadline` AS `response_deadline`, CASE WHEN `ae`.`update_status` = 'pending' THEN 'No update request has been sent yet' WHEN `ae`.`update_status` = 'sent' THEN 'Update request email has been sent' WHEN `ae`.`update_status` = 'awaiting' THEN 'Waiting for alumni/employer response' WHEN `ae`.`update_status` = 'received' THEN 'Employment information has been updated' WHEN `ae`.`update_status` = 'scheduled' THEN concat('Next email scheduled for ',cast(`ae`.`next_email_date` as char charset utf8mb4)) ELSE 'Unknown status' END AS `status_description`, CASE WHEN `ae`.`last_update_received` is null THEN to_days(current_timestamp()) - to_days(`ae`.`created_at`) ELSE to_days(current_timestamp()) - to_days(`ae`.`last_update_received`) END AS `days_since_last_update` FROM (`alumni_employment` `ae` join `users` `u` on(`ae`.`alumni_user_id` = `u`.`id`)) WHERE `u`.`role` = 'alumni' ;

-- --------------------------------------------------------

--
-- Structure for view `form_summary`
--
DROP TABLE IF EXISTS `form_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `form_summary`  AS SELECT `f`.`id` AS `id`, `f`.`title` AS `title`, `f`.`description` AS `description`, `f`.`category` AS `category`, `f`.`target_audience` AS `target_audience`, `f`.`status` AS `status`, `f`.`image_url` AS `image_url`, `f`.`start_date` AS `start_date`, `f`.`end_date` AS `end_date`, `f`.`is_template` AS `is_template`, `f`.`created_by` AS `created_by`, `f`.`created_at` AS `created_at`, `f`.`updated_at` AS `updated_at`, `f`.`submission_count` AS `submission_count`, `u`.`full_name` AS `creator_name`, count(distinct `fr`.`id`) AS `current_submissions`, count(distinct `fa`.`id`) AS `total_assignments`, count(distinct case when `fa`.`status` = 'completed' then `fa`.`id` end) AS `completed_assignments` FROM (((`forms` `f` left join `users` `u` on(`f`.`created_by` = `u`.`id`)) left join `form_responses` `fr` on(`f`.`id` = `fr`.`form_id`)) left join `form_assignments` `fa` on(`f`.`id` = `fa`.`form_id`)) GROUP BY `f`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `question_details`
--
DROP TABLE IF EXISTS `question_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `question_details`  AS SELECT `q`.`id` AS `id`, `q`.`form_id` AS `form_id`, `q`.`question_text` AS `question_text`, `q`.`question_type` AS `question_type`, `q`.`description` AS `description`, `q`.`required` AS `required`, `q`.`min_value` AS `min_value`, `q`.`max_value` AS `max_value`, `q`.`order_index` AS `order_index`, group_concat(json_object('id',`qo`.`id`,'option_text',`qo`.`option_text`,'order_index',`qo`.`order_index`) order by `qo`.`order_index` ASC separator ',') AS `options_json` FROM (`questions` `q` left join `question_options` `qo` on(`q`.`id` = `qo`.`question_id`)) GROUP BY `q`.`id` ORDER BY `q`.`form_id` ASC, `q`.`order_index` ASC ;

-- INDEXES

-- academic_periods
ALTER TABLE `academic_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dept_period` (`department`,`period_type`,`academic_year`,`period_number`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_academic_year` (`academic_year`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

-- alumni
ALTER TABLE `alumni`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

-- alumni_employment
ALTER TABLE `alumni_employment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `alumni_user_id` (`alumni_user_id`),
  ADD KEY `idx_employment_update_tracking` (`last_update_sent`,`last_update_received`),
  ADD KEY `idx_employment_tracker_status` (`update_status`,`next_email_date`),
  ADD KEY `idx_employment_graduation_date` (`graduation_date`);

-- course_management
ALTER TABLE `course_management`
  ADD PRIMARY KEY (`id`);

-- employers
ALTER TABLE `employers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

-- employment_update_queue
ALTER TABLE `employment_update_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alumni_user_id` (`alumni_user_id`),
  ADD KEY `idx_scheduled_date` (`scheduled_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `form_id` (`form_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `evaluation_periods`
--
ALTER TABLE `evaluation_periods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_period` (`academic_year`,`semester`);

--
-- Indexes for table `evaluation_subjects`
--
ALTER TABLE `evaluation_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_code` (`subject_code`);

--
-- Indexes for table `feedback_template_categories`
--
ALTER TABLE `feedback_template_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_name` (`category_name`);

--
-- Indexes for table `forms`
--
ALTER TABLE `forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_target_audience` (`target_audience`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_is_template` (`is_template`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_dates` (`start_date`,`end_date`),
  ADD KEY `idx_subject_id` (`subject_id`);

--
-- Indexes for table `form_assignments`
--
ALTER TABLE `form_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_assignment` (`form_id`,`user_id`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_form_assignments_user_status` (`user_id`,`status`);

--
-- Indexes for table `form_categories`
--
ALTER TABLE `form_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `form_deployments`
--
ALTER TABLE `form_deployments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `deployed_by` (`deployed_by`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_deployment_status` (`deployment_status`),
  ADD KEY `idx_dates` (`start_date`,`end_date`),
  ADD KEY `idx_form_deployments_status_dates` (`deployment_status`,`start_date`,`end_date`),
  ADD KEY `idx_time_range` (`start_time`,`end_time`);

--
-- Indexes for table `form_responses`
--
ALTER TABLE `form_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_response` (`form_id`,`user_id`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_submitted_at` (`submitted_at`),
  ADD KEY `idx_form_responses_user_form` (`user_id`,`form_id`);

--
-- Indexes for table `graduation_records`
--
ALTER TABLE `graduation_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_graduation_year` (`graduation_year`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `instructors`
--
ALTER TABLE `instructors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_instructor_subject` (`instructor_id`,`subject_id`),
  ADD KEY `idx_instructor_id` (`instructor_id`),
  ADD KEY `idx_subject_id` (`subject_id`);

--
-- Indexes for table `instructor_feedback`
--
ALTER TABLE `instructor_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_instructor_feedback` (`student_id`,`instructor_id`,`academic_year`,`semester`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `idx_instructor_feedback_student` (`student_id`,`submitted_at`),
  ADD KEY `idx_instructor_feedback_instructor` (`instructor_id`),
  ADD KEY `idx_section_id` (`section_id`);

--
-- Indexes for table `notificationemails`
--
ALTER TABLE `notificationemails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_id` (`notification_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_user_unread` (`user_id`,`is_read`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_order` (`order_index`),
  ADD KEY `idx_questions_form_type` (`form_id`,`question_type`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_questions_form_section_order` (`form_id`,`section_id`,`order_index`);

--
-- Indexes for table `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_question_id` (`question_id`),
  ADD KEY `idx_order` (`order_index`),
  ADD KEY `idx_question_options_question_order` (`question_id`,`order_index`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indexes for table `semester_reset_log`
--
ALTER TABLE `semester_reset_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_triggered_by` (`triggered_by`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `shared_responses`
--
ALTER TABLE `shared_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_share` (`form_id`,`shared_with_instructor_id`),
  ADD KEY `idx_form_id` (`form_id`),
  ADD KEY `idx_instructor_id` (`shared_with_instructor_id`),
  ADD KEY `idx_shared_by` (`shared_by`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `student_promotion_history`
--
ALTER TABLE `student_promotion_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_promotion_date` (`promotion_date`),
  ADD KEY `previous_program_id` (`previous_program_id`),
  ADD KEY `new_program_id` (`new_program_id`),
  ADD KEY `promoted_by` (`promoted_by`);

--
-- Indexes for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_form` (`student_id`,`evaluation_form_id`,`academic_year`,`semester`),
  ADD KEY `evaluation_form_id` (`evaluation_form_id`),
  ADD KEY `instructor_id` (`instructor_id`),
  ADD KEY `idx_evaluation_response_student` (`student_id`,`submitted_at`),
  ADD KEY `idx_evaluation_response_subject` (`subject_id`,`instructor_id`);

--
-- Indexes for table `subject_feedback`
--
ALTER TABLE `subject_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_subject_feedback` (`student_id`,`subject_id`,`academic_year`,`semester`),
  ADD KEY `instructor_id` (`instructor_id`),
  ADD KEY `idx_subject_feedback_student` (`student_id`,`submitted_at`),
  ADD KEY `idx_subject_feedback_subject` (`subject_id`,`instructor_id`),
  ADD KEY `idx_section_id` (`section_id`);

--
-- Indexes for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_instructor` (`subject_id`,`instructor_id`,`academic_year`,`semester`),
  ADD KEY `idx_subject_instructor` (`instructor_id`,`academic_year`);

--
-- Indexes for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_offering` (`subject_id`,`program_id`,`year_level`,`section`,`academic_year`,`semester`,`instructor_id`),
  ADD KEY `idx_subject` (`subject_id`),
  ADD KEY `idx_program` (`program_id`),
  ADD KEY `idx_instructor` (`instructor_id`),
  ADD KEY `idx_academic` (`academic_year`,`semester`);

--
-- Indexes for table `subject_sections`
--
ALTER TABLE `subject_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_program` (`subject_id`,`program_id`,`academic_year`,`semester`);

--
-- Indexes for table `subject_students`
--
ALTER TABLE `subject_students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_subject` (`subject_id`,`student_id`,`academic_year`,`semester`),
  ADD KEY `idx_subject_student` (`student_id`,`academic_year`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_department` (`setting_key`,`department`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

-- AUTO_INCREMENT

-- academic_periods
ALTER TABLE `academic_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alumni`
--
ALTER TABLE `alumni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alumni_employment`
--
ALTER TABLE `alumni_employment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employment_update_queue`
--
ALTER TABLE `employment_update_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_periods`
--
ALTER TABLE `evaluation_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_subjects`
--
ALTER TABLE `evaluation_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback_template_categories`
--
ALTER TABLE `feedback_template_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `forms`
--
ALTER TABLE `forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_assignments`
--
ALTER TABLE `form_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_categories`
--
ALTER TABLE `form_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_deployments`
--
ALTER TABLE `form_deployments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_responses`
--
ALTER TABLE `form_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `graduation_records`
--
ALTER TABLE `graduation_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `instructors`
--
ALTER TABLE `instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `instructor_feedback`
--
ALTER TABLE `instructor_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notificationemails`
--
ALTER TABLE `notificationemails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `semester_reset_log`
--
ALTER TABLE `semester_reset_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shared_responses`
--
ALTER TABLE `shared_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_promotion_history`
--
ALTER TABLE `student_promotion_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_feedback`
--
ALTER TABLE `subject_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_sections`
--
ALTER TABLE `subject_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_students`
--
ALTER TABLE `subject_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- CONSTRAINTS

-- alumni
ALTER TABLE `alumni`
  ADD CONSTRAINT `alumni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `alumni_employment`
--
ALTER TABLE `alumni_employment`
  ADD CONSTRAINT `alumni_employment_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employers`
--
ALTER TABLE `employers`
  ADD CONSTRAINT `employers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employment_update_queue`
--
ALTER TABLE `employment_update_queue`
  ADD CONSTRAINT `employment_update_queue_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  ADD CONSTRAINT `evaluation_forms_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_forms_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluation_forms_ibfk_3` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `forms`
--
ALTER TABLE `forms`
  ADD CONSTRAINT `fk_forms_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_assignments`
--
ALTER TABLE `form_assignments`
  ADD CONSTRAINT `form_assignments_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `form_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_deployments`
--
ALTER TABLE `form_deployments`
  ADD CONSTRAINT `form_deployments_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `form_deployments_ibfk_2` FOREIGN KEY (`deployed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_responses`
--
ALTER TABLE `form_responses`
  ADD CONSTRAINT `form_responses_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `form_responses_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `instructors`
--
ALTER TABLE `instructors`
  ADD CONSTRAINT `instructors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `instructor_feedback`
--
ALTER TABLE `instructor_feedback`
  ADD CONSTRAINT `instructor_feedback_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `instructor_feedback_ibfk_2` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `instructor_feedback_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notificationemails`
--
ALTER TABLE `notificationemails`
  ADD CONSTRAINT `notificationemails_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificationemails_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `fk_questions_section` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `question_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `fk_sections_form` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shared_responses`
--
ALTER TABLE `shared_responses`
  ADD CONSTRAINT `shared_responses_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shared_responses_ibfk_2` FOREIGN KEY (`shared_with_instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shared_responses_ibfk_3` FOREIGN KEY (`shared_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_1` FOREIGN KEY (`evaluation_form_id`) REFERENCES `evaluation_forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_3` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_4` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subject_feedback`
--
ALTER TABLE `subject_feedback`
  ADD CONSTRAINT `subject_feedback_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_feedback_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_feedback_ibfk_3` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  ADD CONSTRAINT `subject_instructors_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_instructors_ibfk_2` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subject_students`
--
ALTER TABLE `subject_students`
  ADD CONSTRAINT `subject_students_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;
