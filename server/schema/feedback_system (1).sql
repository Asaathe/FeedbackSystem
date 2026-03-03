-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 03, 2026 at 09:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `feedback_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `alumni`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `course_management`
--

CREATE TABLE `course_management` (
  `id` int(11) NOT NULL,
  `department` enum('College','Senior High') NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `program_code` varchar(50) NOT NULL,
  `year_level` int(11) NOT NULL COMMENT '1, 2, 3, 4 for College; 11, 12 for Senior High',
  `section` varchar(10) NOT NULL COMMENT 'A, B, C, etc.',
  `course_section` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci GENERATED ALWAYS AS (concat(`program_code`,' - ',`year_level`,`section`)) STORED,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `department_evaluation_summary`
-- (See below for the actual view)
--
CREATE TABLE `department_evaluation_summary` (
);

-- --------------------------------------------------------

--
-- Table structure for table `employers`
--

CREATE TABLE `employers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `companyname` varchar(255) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `contact` varchar(20) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forms`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `form_assignments`
--

CREATE TABLE `form_assignments` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','completed','expired') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_categories`
--

CREATE TABLE `form_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_deployments`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `form_responses`
--

CREATE TABLE `form_responses` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `response_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`response_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `form_summary`
-- (See below for the actual view)
--
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

-- --------------------------------------------------------

--
-- Table structure for table `graduation_records`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `instructors`
--

CREATE TABLE `instructors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `instructor_id` varchar(50) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `school_role` varchar(255) DEFAULT NULL,
  `subject_taught` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `instructor_evaluation_summary`
-- (See below for the actual view)
--
CREATE TABLE `instructor_evaluation_summary` (
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `promotion_history_view`
-- (See below for the actual view)
--
CREATE TABLE `promotion_history_view` (
`id` int(11)
,`student_id` int(11)
,`student_name` varchar(255)
,`student_email` varchar(255)
,`studentID` varchar(50)
,`promotion_type` enum('academic_year','graduation')
,`promotion_date` date
,`notes` text
,`created_at` timestamp
,`old_program_code` varchar(50)
,`old_year_level` int(11)
,`old_section` varchar(10)
,`new_program_code` varchar(50)
,`new_year_level` int(11)
,`new_section` varchar(10)
,`promoted_by_name` varchar(255)
);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

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

-- --------------------------------------------------------

--
-- Stand-in structure for view `question_details`
-- (See below for the actual view)
--
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

-- --------------------------------------------------------

--
-- Table structure for table `question_options`
--

CREATE TABLE `question_options` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'New Section',
  `description` text DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shared_responses`
--

CREATE TABLE `shared_responses` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `shared_with_instructor_id` int(11) NOT NULL,
  `shared_by` int(11) NOT NULL,
  `shared_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `studentID` varchar(50) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `subjects` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL COMMENT 'References course_management.id',
  `academic_year` year(4) DEFAULT NULL,
  `promotion_date` date DEFAULT NULL,
  `previous_program_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_promotion_history`
--

CREATE TABLE `student_promotion_history` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL COMMENT 'Reference to students.id',
  `user_id` int(11) NOT NULL COMMENT 'Reference to users.id',
  `previous_program_id` int(11) DEFAULT NULL COMMENT 'Previous course_management.id',
  `new_program_id` int(11) NOT NULL COMMENT 'New course_management.id',
  `promotion_type` enum('academic_year','graduation') NOT NULL,
  `promotion_date` date NOT NULL,
  `promoted_by` int(11) NOT NULL COMMENT 'Admin user who performed promotion',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `department` varchar(100) NOT NULL,
  `units` decimal(3,1) DEFAULT 3.0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `instructor_id` int(11) DEFAULT NULL COMMENT 'Legacy - main instructor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `department` varchar(50) DEFAULT NULL COMMENT 'NULL = applies to all, College/Senior High = specific department',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

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
-- Structure for view `department_evaluation_summary`
--
DROP TABLE IF EXISTS `department_evaluation_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `department_evaluation_summary`  AS SELECT `s`.`department` AS `department`, `si`.`semester` AS `semester`, `si`.`academic_year` AS `academic_year`, count(distinct `se`.`id`) AS `total_responses`, count(distinct `si`.`subject_id`) AS `total_subjects`, count(distinct `si`.`instructor_id`) AS `total_instructors`, round(avg(`se`.`subject_rating`),2) AS `avg_subject_rating`, round(avg(`se`.`instructor_rating`),2) AS `avg_instructor_rating`, round((avg(`se`.`subject_rating`) + avg(`se`.`instructor_rating`)) / 2,2) AS `overall_rating` FROM (((`subject_instructors` `si` join `subjects` `s` on(`si`.`subject_id` = `s`.`id`)) left join `student_subjects` `ss` on(`si`.`id` = `ss`.`subject_instructor_id`)) left join `subject_evaluations` `se` on(`ss`.`id` = `se`.`student_subject_id`)) GROUP BY `s`.`department`, `si`.`semester`, `si`.`academic_year` ORDER BY `si`.`academic_year` DESC, `si`.`semester` ASC, `s`.`department` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `form_summary`
--
DROP TABLE IF EXISTS `form_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `form_summary`  AS SELECT `f`.`id` AS `id`, `f`.`title` AS `title`, `f`.`description` AS `description`, `f`.`category` AS `category`, `f`.`target_audience` AS `target_audience`, `f`.`status` AS `status`, `f`.`image_url` AS `image_url`, `f`.`start_date` AS `start_date`, `f`.`end_date` AS `end_date`, `f`.`is_template` AS `is_template`, `f`.`created_by` AS `created_by`, `f`.`created_at` AS `created_at`, `f`.`updated_at` AS `updated_at`, `f`.`submission_count` AS `submission_count`, `u`.`full_name` AS `creator_name`, count(distinct `fr`.`id`) AS `current_submissions`, count(distinct `fa`.`id`) AS `total_assignments`, count(distinct case when `fa`.`status` = 'completed' then `fa`.`id` end) AS `completed_assignments` FROM (((`forms` `f` left join `users` `u` on(`f`.`created_by` = `u`.`id`)) left join `form_responses` `fr` on(`f`.`id` = `fr`.`form_id`)) left join `form_assignments` `fa` on(`f`.`id` = `fa`.`form_id`)) GROUP BY `f`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `instructor_evaluation_summary`
--
DROP TABLE IF EXISTS `instructor_evaluation_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `instructor_evaluation_summary`  AS SELECT `si`.`instructor_id` AS `instructor_id`, `u`.`full_name` AS `instructor_name`, `i`.`department` AS `instructor_department`, `si`.`semester` AS `semester`, `si`.`academic_year` AS `academic_year`, count(distinct `se`.`id`) AS `total_responses`, count(distinct `si`.`subject_id`) AS `subjects_handled`, round(avg(`se`.`subject_rating`),2) AS `avg_subject_rating`, round(avg(`se`.`instructor_rating`),2) AS `avg_instructor_rating`, round((avg(`se`.`subject_rating`) + avg(`se`.`instructor_rating`)) / 2,2) AS `overall_rating` FROM ((((`subject_instructors` `si` join `users` `u` on(`si`.`instructor_id` = `u`.`id`)) left join `instructors` `i` on(`u`.`id` = `i`.`user_id`)) left join `student_subjects` `ss` on(`si`.`id` = `ss`.`subject_instructor_id`)) left join `subject_evaluations` `se` on(`ss`.`id` = `se`.`student_subject_id`)) GROUP BY `si`.`instructor_id`, `u`.`id`, `si`.`semester`, `si`.`academic_year` ORDER BY `si`.`academic_year` DESC, `si`.`semester` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `promotion_history_view`
--
DROP TABLE IF EXISTS `promotion_history_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `promotion_history_view`  AS SELECT `sph`.`id` AS `id`, `sph`.`student_id` AS `student_id`, `u`.`full_name` AS `student_name`, `u`.`email` AS `student_email`, `s`.`studentID` AS `studentID`, `sph`.`promotion_type` AS `promotion_type`, `sph`.`promotion_date` AS `promotion_date`, `sph`.`notes` AS `notes`, `sph`.`created_at` AS `created_at`, `cm_old`.`program_code` AS `old_program_code`, `cm_old`.`year_level` AS `old_year_level`, `cm_old`.`section` AS `old_section`, `cm_new`.`program_code` AS `new_program_code`, `cm_new`.`year_level` AS `new_year_level`, `cm_new`.`section` AS `new_section`, `promoter`.`full_name` AS `promoted_by_name` FROM (((((`student_promotion_history` `sph` join `users` `u` on(`sph`.`user_id` = `u`.`id`)) join `students` `s` on(`sph`.`student_id` = `s`.`id`)) left join `course_management` `cm_old` on(`sph`.`previous_program_id` = `cm_old`.`id`)) left join `course_management` `cm_new` on(`sph`.`new_program_id` = `cm_new`.`id`)) join `users` `promoter` on(`sph`.`promoted_by` = `promoter`.`id`)) ORDER BY `sph`.`promotion_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `question_details`
--
DROP TABLE IF EXISTS `question_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `question_details`  AS SELECT `q`.`id` AS `id`, `q`.`form_id` AS `form_id`, `q`.`question_text` AS `question_text`, `q`.`question_type` AS `question_type`, `q`.`description` AS `description`, `q`.`required` AS `required`, `q`.`min_value` AS `min_value`, `q`.`max_value` AS `max_value`, `q`.`order_index` AS `order_index`, group_concat(json_object('id',`qo`.`id`,'option_text',`qo`.`option_text`,'order_index',`qo`.`order_index`) order by `qo`.`order_index` ASC separator ',') AS `options_json` FROM (`questions` `q` left join `question_options` `qo` on(`q`.`id` = `qo`.`question_id`)) GROUP BY `q`.`id` ORDER BY `q`.`form_id` ASC, `q`.`order_index` ASC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alumni`
--
ALTER TABLE `alumni`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `course_management`
--
ALTER TABLE `course_management`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_unique_program` (`department`,`program_code`,`year_level`,`section`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_program_code` (`program_code`),
  ADD KEY `idx_year_level` (`year_level`),
  ADD KEY `idx_section` (`section`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `employers`
--
ALTER TABLE `employers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

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
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subject_code` (`subject_code`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_status` (`status`);

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

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alumni`
--
ALTER TABLE `alumni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_management`
--
ALTER TABLE `course_management`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
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
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
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

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alumni`
--
ALTER TABLE `alumni`
  ADD CONSTRAINT `alumni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employers`
--
ALTER TABLE `employers`
  ADD CONSTRAINT `employers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `graduation_records`
--
ALTER TABLE `graduation_records`
  ADD CONSTRAINT `graduation_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `graduation_records_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `graduation_records_ibfk_3` FOREIGN KEY (`program_id`) REFERENCES `course_management` (`id`);

--
-- Constraints for table `instructors`
--
ALTER TABLE `instructors`
  ADD CONSTRAINT `instructors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `student_promotion_history`
--
ALTER TABLE `student_promotion_history`
  ADD CONSTRAINT `student_promotion_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_promotion_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_promotion_history_ibfk_3` FOREIGN KEY (`previous_program_id`) REFERENCES `course_management` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotion_history_ibfk_4` FOREIGN KEY (`new_program_id`) REFERENCES `course_management` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_promotion_history_ibfk_5` FOREIGN KEY (`promoted_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
