-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 04, 2026 at 11:39 AM
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

--
-- Dumping data for table `course_management`
--

INSERT INTO `course_management` (`id`, `department`, `program_name`, `program_code`, `year_level`, `section`, `status`, `created_at`, `updated_at`) VALUES
(1, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'B', 'active', '2026-02-05 08:32:17', '2026-02-05 09:38:23'),
(2, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'C', 'active', '2026-02-05 08:34:14', '2026-02-05 08:34:14'),
(3, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'A', 'active', '2026-02-05 14:45:34', '2026-02-15 12:16:28'),
(4, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'LOVE', 'active', '2026-02-05 15:13:03', '2026-02-05 15:13:03'),
(5, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'HOPE', 'active', '2026-02-05 15:28:36', '2026-02-05 15:28:36'),
(6, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'FAITH', 'active', '2026-02-05 15:29:17', '2026-02-05 15:29:17'),
(7, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'A', 'active', '2026-02-06 00:57:55', '2026-02-24 12:08:55'),
(8, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'B', 'active', '2026-02-06 08:35:32', '2026-02-15 12:16:30'),
(9, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'C', 'active', '2026-02-10 19:58:48', '2026-02-15 12:16:28'),
(10, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'D', 'active', '2026-02-19 04:36:41', '2026-02-19 04:36:41'),
(11, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'E', 'active', '2026-02-25 05:58:29', '2026-02-25 05:58:29'),
(12, 'College', 'Bachelor of Science in Information Technology', 'IT', 1, 'A', 'active', '2026-03-01 21:31:40', '2026-03-01 21:31:40');

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
-- Table structure for table `evaluation_forms`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_subjects`
--

CREATE TABLE `evaluation_subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(50) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `units` int(11) DEFAULT 3,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_subjects`
--

INSERT INTO `evaluation_subjects` (`id`, `subject_code`, `subject_name`, `department`, `units`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'GJGG', 'dadada', 'adada', 3, 'dada', 'active', '2026-03-04 08:52:11', '2026-03-04 08:52:11');

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

--
-- Dumping data for table `forms`
--

INSERT INTO `forms` (`id`, `title`, `description`, `ai_description`, `type`, `category`, `subject_id`, `target_audience`, `status`, `image_url`, `is_template`, `start_date`, `end_date`, `created_by`, `created_at`, `updated_at`, `submission_count`, `is_anonymous`, `deadline`) VALUES
(548, 'ddddddddd', 'dddddddddddddd', NULL, 'general', 'Course Evaluation', NULL, 'Students - BSIT - 4B', 'active', '/uploads/forms/955f1d6c-9205-431d-9ca8-2d19150ca14f.webp', 0, '2026-03-04', '2026-03-05', 1, '2026-03-04 08:45:11', '2026-03-04 08:45:11', 0, 0, NULL);

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

--
-- Dumping data for table `form_assignments`
--

INSERT INTO `form_assignments` (`id`, `form_id`, `user_id`, `assigned_at`, `status`) VALUES
(3297, 548, 93, '2026-03-04 08:45:11', 'completed');

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

--
-- Dumping data for table `form_categories`
--

INSERT INTO `form_categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(31, 'Event', NULL, '2026-02-24 03:43:35', '2026-02-24 03:43:35'),
(34, 'Course Evaluation', NULL, '2026-02-24 07:59:01', '2026-02-24 07:59:01');

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

--
-- Dumping data for table `form_deployments`
--

INSERT INTO `form_deployments` (`id`, `form_id`, `deployed_by`, `start_date`, `start_time`, `end_date`, `end_time`, `target_filters`, `deployment_status`, `created_at`) VALUES
(188, 548, 1, '2026-03-04', '16:45:00', '2026-03-05', '16:46:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-03-04 08:45:11');

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

--
-- Dumping data for table `form_responses`
--

INSERT INTO `form_responses` (`id`, `form_id`, `user_id`, `submitted_at`, `response_data`) VALUES
(131, 548, 93, '2026-03-04 08:45:46', '{\"1841\":5,\"1842\":\"Neutral\",\"1843\":6,\"1844\":[\"School Website/Portal\"],\"1845\":5,\"1846\":7,\"1847\":\"Good\",\"1848\":\"Spectator Events\",\"1849\":5,\"1850\":\"Likely\",\"1851\":\"eqeq\",\"1852\":\"eqeq\"}');

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

--
-- Dumping data for table `instructors`
--

INSERT INTO `instructors` (`id`, `user_id`, `instructor_id`, `department`, `school_role`, `subject_taught`, `image`) VALUES
(24, 150, '90872', 'Both', 'IT Instructor', '', '/uploads/profiles/instructors/86dadc5e-bece-4204-b775-5bab0df6c401.jpg'),
(26, 152, '79164', 'College', 'College dean/DBM Head', '', '/uploads/profiles/92bdc992-17f3-484a-bf69-97ee491e0362.png');

-- --------------------------------------------------------

--
-- Table structure for table `instructor_courses`
--

CREATE TABLE `instructor_courses` (
  `id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `instructor_courses`
--

INSERT INTO `instructor_courses` (`id`, `instructor_id`, `subject_id`, `created_at`, `updated_at`) VALUES
(4, 150, 27, '2026-03-04 07:39:14', '2026-03-04 07:39:14'),
(5, 150, 28, '2026-03-04 09:54:12', '2026-03-04 09:54:12');

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

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `form_id`, `section_id`, `question_text`, `question_type`, `description`, `required`, `min_value`, `max_value`, `order_index`) VALUES
(1841, 548, 46, 'Clarity of pre-event information (schedule, rules, etc.)', 'rating', 'Rate how clear and comprehensive the information provided before Sportfest was.', 1, NULL, NULL, 0),
(1842, 548, 46, 'How would you describe the registration process for Sportfest?', 'multiple-choice', NULL, 1, NULL, NULL, 0),
(1843, 548, 46, 'Rate the helpfulness and availability of event staff/volunteers during preparation.', 'linear-scale', '1 = Not helpful at all, 10 = Extremely helpful and available.', 1, NULL, NULL, 0),
(1844, 548, 46, 'Which channels did you use to receive Sportfest information?', 'checkbox', NULL, 1, NULL, NULL, 0),
(1845, 548, 47, 'Satisfaction with the variety and types of sports/activities offered.', 'rating', 'Rate your satisfaction with the range of activities available.', 1, NULL, NULL, 0),
(1846, 548, 47, 'Overall enjoyment of the Sportfest day.', 'linear-scale', '1 = Not enjoyable at all, 10 = Extremely enjoyable.', 1, NULL, NULL, 0),
(1847, 548, 47, 'How suitable was the event venue for the activities?', 'multiple-choice', NULL, 1, NULL, NULL, 0),
(1848, 548, 47, 'Which activity did you enjoy the most?', 'dropdown', NULL, 1, NULL, NULL, 0),
(1849, 548, 48, 'To what extent did Sportfest foster a sense of community and school spirit?', 'rating', 'Rate how well Sportfest helped build school unity.', 1, NULL, NULL, 0),
(1850, 548, 48, 'How likely are you to participate in future Sportfest events?', 'multiple-choice', NULL, 1, NULL, NULL, 0),
(1851, 548, 48, 'Please describe any specific areas where you think Sportfest could be improved next year.', 'textarea', NULL, 0, NULL, NULL, 0),
(1852, 548, 48, 'Do you have any other general comments or suggestions?', 'text', NULL, 0, NULL, NULL, 0);

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

--
-- Dumping data for table `question_options`
--

INSERT INTO `question_options` (`id`, `question_id`, `option_text`, `order_index`) VALUES
(2251, 1842, 'Very Easy', 0),
(2252, 1842, 'Easy', 0),
(2253, 1842, 'Neutral', 0),
(2254, 1842, 'Difficult', 0),
(2255, 1842, 'Very Difficult', 0),
(2256, 1844, 'Email', 0),
(2257, 1844, 'School Website/Portal', 0),
(2258, 1844, 'Social Media', 0),
(2259, 1844, 'School Announcements', 0),
(2260, 1844, 'Word of Mouth', 0),
(2261, 1847, 'Excellent', 0),
(2262, 1847, 'Good', 0),
(2263, 1847, 'Adequate', 0),
(2264, 1847, 'Needs Improvement', 0),
(2265, 1847, 'Poor', 0),
(2266, 1848, 'Team Relays', 0),
(2267, 1848, 'Individual Challenges', 0),
(2268, 1848, 'Creative Games', 0),
(2269, 1848, 'Spectator Events', 0),
(2270, 1848, 'Other', 0),
(2271, 1850, 'Very Likely', 0),
(2272, 1850, 'Likely', 0),
(2273, 1850, 'Neutral', 0),
(2274, 1850, 'Unlikely', 0),
(2275, 1850, 'Very Unlikely', 0);

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

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `form_id`, `title`, `description`, `order_index`, `created_at`, `updated_at`) VALUES
(46, 548, 'Prep & Org', 'Feedback on the planning and organization leading up to Sportfest.', 0, '2026-03-04 08:45:11', '2026-03-04 08:45:11'),
(47, 548, 'Event Experience', 'Feedback on your experience during the Sportfest day.', 0, '2026-03-04 08:45:11', '2026-03-04 08:45:11'),
(48, 548, 'Impact & Future', 'Feedback on the overall impact and suggestions for future Sportfest events.', 0, '2026-03-04 08:45:11', '2026-03-04 08:45:11');

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

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `user_id`, `studentID`, `contact_number`, `subjects`, `image`, `program_id`, `academic_year`, `promotion_date`, `previous_program_id`) VALUES
(60, 93, '12345', NULL, NULL, '/uploads/profiles/407b5128-f035-4795-8a8d-530a1fea24cf.jpg', 1, NULL, NULL, NULL),
(61, 94, '12342', NULL, NULL, '/uploads/profiles/fae00fb0-b475-4e5c-8c38-c845f6464883.jpg', 1, NULL, NULL, NULL),
(62, 95, '79719', NULL, NULL, '/uploads/profiles/bc2fe40d-d028-481a-a45e-40d482b69e52.jpg', 1, NULL, NULL, NULL),
(63, 96, '31758', NULL, NULL, '/uploads/profiles/83a09ed2-aaab-4a5c-ad74-128c90373e34.jpg', 1, NULL, NULL, NULL),
(64, 97, '27891', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(65, 98, '61863', NULL, NULL, NULL, 1, '2004', '2026-03-02', 2),
(66, 99, '19497', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(67, 100, '64916', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(68, 101, '11135', NULL, NULL, '/uploads/profiles/5e7a9a4e-f370-4be0-9efe-4116eb414a61.jpg', 1, NULL, NULL, NULL),
(69, 102, '46194', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(70, 103, '41864', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(71, 104, '12644', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(72, 105, '47070', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(73, 106, '46164', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(74, 107, '44618', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(75, 108, '46916', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(76, 109, '46196', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(77, 110, '13718', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(78, 111, '42515', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(80, 113, '46196', NULL, NULL, NULL, 1, NULL, NULL, NULL),
(81, 114, '70711', NULL, NULL, '/uploads/profiles/692bef3f-e206-42a5-a4e1-12e0f632371f.jpg', 1, NULL, NULL, NULL),
(82, 115, '01741', NULL, NULL, '/uploads/profiles/0ed1e27a-ccd3-417f-ab2e-04f62578fcb1.jpg', 1, NULL, NULL, NULL),
(83, 116, '70174', NULL, NULL, '/uploads/profiles/0c99c5a5-5f85-4129-8e6b-0f2c237f3389.jpg', 1, NULL, NULL, NULL),
(84, 117, '71641', NULL, NULL, '/uploads/profiles/373971de-7748-4836-892a-ba43551b2be6.jpg', 1, NULL, NULL, NULL),
(85, 118, '10410', NULL, NULL, '/uploads/profiles/ddc4f662-686b-46eb-8283-83c6ffebc59e.jpg', 1, NULL, NULL, NULL),
(86, 119, '18417', NULL, NULL, '/uploads/profiles/9287d37f-53dc-4987-8d6b-5d31ff7eada8.jpg', 1, NULL, NULL, NULL),
(87, 120, '16491', NULL, NULL, '/uploads/profiles/45606ac5-320c-4fd0-9c0b-688fe6ddce81.jpg', 1, NULL, NULL, NULL),
(88, 121, '71074', NULL, NULL, '/uploads/profiles/cb710fcf-f190-4ae7-8b05-f0b85b7de56b.jpg', 1, NULL, NULL, NULL),
(89, 122, '31415', NULL, NULL, '/uploads/profiles/2bbe767a-3312-42f9-be3f-11b614e2edfd.jpg', 1, NULL, NULL, NULL),
(90, 123, '14107', NULL, NULL, '/uploads/profiles/22656c9e-b8ef-4b71-a881-9fd3a61807fd.jpg', 1, NULL, NULL, NULL),
(91, 124, '41704', NULL, NULL, '/uploads/profiles/5bae7b9f-b66b-4a19-9f6c-0f09a3e8de36.jpg', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_enrollments`
--

CREATE TABLE `student_enrollments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `status` enum('enrolled','unenrolled') DEFAULT 'enrolled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `student_enrollments`
--

INSERT INTO `student_enrollments` (`id`, `student_id`, `subject_id`, `status`, `created_at`, `updated_at`) VALUES
(218, 124, 28, 'enrolled', '2026-03-04 09:45:54', '2026-03-04 09:45:54'),
(219, 123, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(220, 122, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(221, 121, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(222, 120, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(223, 119, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(224, 118, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(225, 117, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(226, 116, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(227, 115, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(228, 114, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(229, 113, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(230, 111, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(231, 110, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(232, 109, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(233, 108, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(234, 107, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(235, 106, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(236, 105, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(237, 104, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(238, 103, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(239, 102, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(240, 101, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(241, 100, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(242, 99, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(243, 98, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(244, 97, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(245, 96, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(246, 95, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(247, 94, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55'),
(248, 93, 28, 'enrolled', '2026-03-04 09:45:55', '2026-03-04 09:45:55');

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

--
-- Dumping data for table `student_promotion_history`
--

INSERT INTO `student_promotion_history` (`id`, `student_id`, `user_id`, `previous_program_id`, `new_program_id`, `promotion_type`, `promotion_date`, `promoted_by`, `notes`, `created_at`) VALUES
(1, 65, 98, 1, 1, 'academic_year', '2026-02-22', 1, 'Promoted to year 4', '2026-02-22 15:21:37'),
(2, 65, 98, 1, 2, 'academic_year', '2026-02-22', 1, 'Promoted to year 4', '2026-02-22 15:22:01'),
(3, 65, 98, 2, 1, 'academic_year', '2026-03-02', 1, '', '2026-03-01 22:50:37');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `subject_code` varchar(20) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `units` decimal(3,1) DEFAULT 3.0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `subject_code`, `subject_name`, `department`, `units`, `status`, `created_at`, `updated_at`) VALUES
(27, 'GJGG', 'ddd', 'Senior High', 3.0, 'inactive', '2026-03-04 07:39:06', '2026-03-04 08:35:38'),
(28, 'IT122', 'Networking', 'College', 3.0, 'active', '2026-03-04 09:03:18', '2026-03-04 09:03:18');

-- --------------------------------------------------------

--
-- Table structure for table `subject_evaluation_responses`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `subject_instructors`
--

CREATE TABLE `subject_instructors` (
  `id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject_instructors`
--

INSERT INTO `subject_instructors` (`id`, `subject_id`, `instructor_id`, `academic_year`, `semester`, `created_at`) VALUES
(1, 1, 150, '2025-2026', '1st', '2026-03-04 08:52:40'),
(2, 1, 152, '2025-2026', '1st', '2026-03-04 08:53:19');

-- --------------------------------------------------------

--
-- Table structure for table `subject_students`
--

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

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `department`, `description`, `created_at`, `updated_at`) VALUES
(1, 'current_semester', '2nd', 'College', 'Current semester for College department', '2026-03-02 09:05:44', '2026-03-02 20:25:46'),
(2, 'current_academic_year', '2025-2026', 'College', 'Academic year for College department', '2026-03-02 09:05:44', '2026-03-02 20:25:46'),
(3, 'current_semester', '2nd', 'Senior High', 'Current semester for Senior High department', '2026-03-02 09:05:44', '2026-03-02 20:25:54'),
(4, 'current_academic_year', '2025-2026', 'Senior High', 'Academic year for Senior High department', '2026-03-02 09:05:44', '2026-03-02 20:25:54'),
(5, 'school_name', 'ACTS College', NULL, 'School name displayed in the system', '2026-03-02 09:05:44', '2026-03-02 09:05:44'),
(6, 'school_year_start', 'August', NULL, 'Month when academic year starts', '2026-03-02 09:05:44', '2026-03-02 09:05:44');

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

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role`, `registration_date`, `status`) VALUES
(1, 'admin@acts.edu', '$2a$12$NpMcEwRYq0ypHjzmP0ORGOrfxrZgenZlaAxTK51jNVUEPDGsKH7RS', 'System Administrator', 'admin', '2026-01-04 15:38:48', 'active'),
(93, 'agnasan@gmail.com', '$2a$12$Q.Ru70Wxk9IoECrVVDVI7Ok4ZR5BTKIGPVZknMqaZb8FhXAH2SZtu', 'Angelo T. Agnasan', 'student', '2026-01-29 18:52:48', 'active'),
(94, 'badinas@gmail.com', '$2a$12$eq30nZhuQpiS5rpBknZzHuZCtPBQb0LEuQaXDtKF0JfK6AifNxwd6', 'Jonard A. Badinas', 'student', '2026-01-29 18:54:40', 'active'),
(95, 'brosas@gmail.com', '$2a$12$06YIDhf731u3fzfSMhr3SugU0gsFbCeYQJy7CsIejLLSAah22hum.', 'Angelito O.  Brosas Jr.', 'student', '2026-01-29 18:55:45', 'active'),
(96, 'dausin@gmail.com', '$2a$12$borBfdDtGHjiDzKDHC8o9OIm6Gr93tt6uSvQNw2sqpiiRoz6uNOpS', 'Emmanuel M. Dausin', 'student', '2026-01-29 18:56:26', 'active'),
(97, 'karunungan@gmail.com', '$2a$12$C5r79wYHtW/g.Gtk6PuZ5Ox2VsR2Hj0HyJEe2udSYO3VJv.TUBJpy', 'Micah C. Karunungan', 'student', '2026-01-29 18:57:16', 'active'),
(98, 'lacandula@gmail.com', '$2a$12$hKRCVQ1feRo8GWuNkghl1uwbXfRTeUzA2Y95kvH9avRLz36yAkvF2', 'Althea Mae A. Lacandula', 'student', '2026-01-29 18:58:22', 'active'),
(99, 'maneja@gmail.com', '$2a$12$ERXkw0pTPeCKljzQrUPPBeyEzTmrqEcq9pre2Y1doIsv3N5t8Frn6', 'John Henry A. Maneja', 'student', '2026-01-29 18:59:17', 'active'),
(100, 'marciano@gmail.com', '$2a$12$9IdtmG1QIXuaMVn70/4LDO9LoHITnUMYbPugoijN7aY1SAlmp1BMG', 'Ralph Georges L. Marciano', 'student', '2026-01-29 19:00:04', 'active'),
(101, 'melicio@gmail.com', '$2a$12$4fTghkQzSAMqro8QjnkrxupcGf7PVvOhe9zLOdLe6.ocoSiozLokO', 'Gerald O. Melicio', 'student', '2026-01-29 19:00:40', 'active'),
(102, 'merle@gmail.com', '$2a$12$YQdMiy4I1i0Aa1faoPIjXeyzObXGiLXuuJJjzBw6GDz3ZyVUbO3My', 'Ghiezel A. Merle', 'student', '2026-01-29 19:01:18', 'active'),
(103, 'molina@gmail.com', '$2a$12$fL7b6olYcZzJ1hmixGB1d.yJSkIBjmBmZs81mFTJsUY5qA51fKopq', 'Carl Justin Molina', 'student', '2026-01-29 19:01:55', 'active'),
(104, 'montes@gmail.com', '$2a$12$4hEMYETIzESPxrR5A5IFTeG5yHgRPEDzs/dpjDUGn2MIELF3NG6Ma', 'Ryan Timothy I. Montes', 'student', '2026-01-29 19:02:38', 'active'),
(105, 'montesena@gmail.com', '$2a$12$dhjn1/x7mZ/eJvl7Sf9xbeTb81exYT6e3txFJtEOxYJZ5rjPbKHEW', 'Babe Louise M. Monteseña', 'student', '2026-01-29 19:03:17', 'active'),
(106, 'palconan@gmail.com', '$2a$12$WPJSSO8Ol5VoGGV1jsZLDuTfos4q/gTLkYRhk8/67MaCTpazoOpl2', 'Ronald Joseph C. Palconan', 'student', '2026-01-29 19:03:56', 'active'),
(107, 'ramirez@gmail.com', '$2a$12$Z4bR1H32G/u2MTTk7CUBreiMsby0BuDkykja85M1m0I/Li1vJZl8m', 'Mark Aldrin C. Ramirez', 'student', '2026-01-29 19:04:37', 'active'),
(108, 'ramos@gmail.com', '$2a$12$B0/knZ3ktdKMQ/AXzkZet..1GVTyAjCmOjmR6U47DAuDIzEJLQf.u', 'Kent Jerone L. Ramos', 'student', '2026-01-29 19:05:07', 'active'),
(109, 'reparip@gmail.com', '$2a$12$LYMqX9nFNL0FikipFhX8P.i7VZepY5UbMuONBkGPqlMvmLOdAs2g6', 'John Paul G. Reparip', 'student', '2026-01-29 19:05:46', 'active'),
(110, 'reyes@gmail.com', '$2a$12$K8WVF1j0LUzPekyb1KsGfunzSiNLu2awvNgMgVoxPlXj/27tWkx1C', 'Rafhael Ronn C. Reyes', 'student', '2026-01-29 19:06:35', 'active'),
(111, 'romulo@gmail.com', '$2a$12$uFVLXxekPtPVDfTf1lp4N.Ice4ixyLvqSEceSkTJbdwYqU32CCAE6', 'Lyle D. Romulo', 'student', '2026-01-29 19:07:09', 'active'),
(113, 'sanchez@gmail.com', '$2a$12$Jk6Lbyl2nh7fR2m6zza7CuiOozL4aCMvAmhYhP6h7f0XKBkd/s/TO', 'Kean Raphael A. Sanchez', 'student', '2026-01-29 19:08:23', 'active'),
(114, 'romana@gmail.com', '$2a$12$ShkfNAVFq/QdDSIBh3ZaJOl6AO3Jly27RG.abMcpmsqRX7S4nitXW', 'John Luiz C. Sta. Romana', 'student', '2026-01-29 19:09:03', 'active'),
(115, 'tabane@gmail.com', '$2a$12$2nbKlrdD9mbDX5TChgaFWOHK4G/DN5Xz0U3hgZr81A/a90arjZ..e', 'Jerrlyn B. Tabane', 'student', '2026-01-29 19:09:46', 'active'),
(116, 'piel@gmail.com', '$2a$12$N6J0SvAEshwWreJD80BwVeaRtP56hVzDOqnvumfkPuJdWQx6FIsM.', 'Amanda Piel L. Tajan', 'student', '2026-01-29 19:10:26', 'active'),
(117, 'teng@gmail.com', '$2a$12$ZHFFmfDqmPQBYmrhvsS67Oks8vOfvSKWKMfC2J5yjEVXshspVZoX2', 'Kimberly R. Teng', 'student', '2026-01-29 19:11:05', 'active'),
(118, 'valencia@gmail.com', '$2a$12$14w2zDKbQwkrVkxTtJ6J0umgm9F8zLRgmscGJicEEe5f1TCiNpZ1e', 'Jaime S. Valencia Jr.', 'student', '2026-01-29 19:11:49', 'active'),
(119, 'vente@gmail.com', '$2a$12$bUow6xY43gn1vhqdFYBcIOXNORv/Ue4599jWtzwHLJuuDRA/vNR.6', 'Mark Venzer A. Vente', 'student', '2026-01-29 19:12:32', 'active'),
(120, 'janjan@gmail.com', '$2a$12$kbtiZFUUzK1Pstjud285v.8QInwsm5J9lQzpRr.Bu53kZbCGbd7Pe', 'John Angelo M. Ventura', 'student', '2026-01-29 19:13:06', 'active'),
(121, 'victoriano@gmail.com', '$2a$12$FQIy84UHt8rOSHlJz965qeCndPqimgmYQi/w2ZCh5S55Ah9f8ugUO', 'Per Jansen M. Victoriano', 'student', '2026-01-29 19:13:39', 'active'),
(122, 'villanuevag@gmail.com', '$2a$12$xFPN16FEH/kN4Py.ydBQXuj27KbiqEDS5FeX.pwoWd/NZoXqFh./K', 'Ashe Mae M. Villanueva', 'student', '2026-01-29 19:14:20', 'active'),
(123, 'villanuevab@gmail.com', '$2a$12$yfEnmOr00vzj6YOVfKP.Se3HwuhXLevLdUqtgjzHowqeUHWmPn0lq', 'Christian C. Villanueva', 'student', '2026-01-29 19:15:13', 'active'),
(124, 'jc@gmail.com', '$2a$12$pD.ObTJ6/XwOrsBST4XPmeR8i0ejMJC7lA/gkcO2bL3t9Vh3YMery', 'Jc D. Yasoña', 'student', '2026-01-29 19:15:51', 'active'),
(150, 'demo@gmail.com', '$2a$12$Uv48DBqvfZiPm09HddN2u.ap.d5YQwEpbZXKJH1cLX0CP5mlj307i', 'Mr. Ariel M. Tobias, Jr.', 'instructor', '2026-03-01 15:36:46', 'active'),
(152, 'dean@gmail.com', '$2a$12$mwhoar738MtySfC2qH29GenOSLLV65/99idWBdDAgorJGNOiU9y/2', 'Dr. Adoree A. Ramos', 'instructor', '2026-03-01 15:43:13', 'active');

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
-- Indexes for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `form_id` (`form_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `evaluation_subjects`
--
ALTER TABLE `evaluation_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_code` (`subject_code`);

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
-- Indexes for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_subject` (`student_id`,`subject_id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_subject_id` (`subject_id`);

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
-- Indexes for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subject_instructor` (`subject_id`,`instructor_id`,`academic_year`,`semester`),
  ADD KEY `idx_subject_instructor` (`instructor_id`,`academic_year`);

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

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alumni`
--
ALTER TABLE `alumni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `course_management`
--
ALTER TABLE `course_management`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_subjects`
--
ALTER TABLE `evaluation_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `forms`
--
ALTER TABLE `forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=550;

--
-- AUTO_INCREMENT for table `form_assignments`
--
ALTER TABLE `form_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3332;

--
-- AUTO_INCREMENT for table `form_categories`
--
ALTER TABLE `form_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `form_deployments`
--
ALTER TABLE `form_deployments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=190;

--
-- AUTO_INCREMENT for table `form_responses`
--
ALTER TABLE `form_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `graduation_records`
--
ALTER TABLE `graduation_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `instructors`
--
ALTER TABLE `instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1855;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2276;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `shared_responses`
--
ALTER TABLE `shared_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `student_enrollments`
--
ALTER TABLE `student_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=249;

--
-- AUTO_INCREMENT for table `student_promotion_history`
--
ALTER TABLE `student_promotion_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subject_students`
--
ALTER TABLE `subject_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

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

--
-- Constraints for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_1` FOREIGN KEY (`evaluation_form_id`) REFERENCES `evaluation_forms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `evaluation_subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_3` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subject_evaluation_responses_ibfk_4` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
