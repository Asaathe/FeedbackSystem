-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 06, 2026 at 05:37 PM
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
-- Table structure for table `academic_periods`
--

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

--
-- Dumping data for table `academic_periods`
--

INSERT INTO `academic_periods` (`id`, `department`, `period_type`, `academic_year`, `period_number`, `start_date`, `end_date`, `is_current`, `auto_transition`, `transition_time`, `status`, `previous_period_id`, `created_by`, `created_at`, `updated_at`) VALUES
(79, 'College', 'semester', '2025-2026', 1, '2026-05-05', '2026-06-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:14:20', '2026-04-04 20:21:21'),
(80, 'College', 'semester', '2025-2026', 2, '2026-07-05', '2026-08-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:14:31', '2026-04-04 20:51:54'),
(81, 'College', 'semester', '2025-2026', 3, '2026-09-05', '2026-10-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:14:47', '2026-04-04 21:26:52'),
(82, 'Senior High', 'quarter', '2025-2026', 1, '2026-05-05', '2026-06-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:15:05', '2026-04-04 20:21:38'),
(83, 'Senior High', 'quarter', '2025-2026', 2, '2026-09-05', '2026-12-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:15:25', '2026-04-04 20:51:59'),
(84, 'Senior High', 'quarter', '2025-2026', 3, '2027-03-05', '2027-08-05', 0, 0, '00:00:00', 'completed', NULL, 1, '2026-04-04 20:35:40', '2026-04-04 21:26:56'),
(89, 'College', 'semester', '2025-2026', 1, '2028-01-05', '2028-02-05', 1, 0, '00:00:00', 'active', NULL, 1, '2026-04-04 21:22:47', '2026-04-04 21:26:52'),
(90, 'Senior High', 'quarter', '2026-2027', 4, '2028-01-05', '2028-03-05', 1, 0, '00:00:00', 'active', NULL, 1, '2026-04-04 21:23:21', '2026-04-04 21:26:56');

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

--
-- Dumping data for table `alumni`
--

INSERT INTO `alumni` (`id`, `user_id`, `grad_year`, `degree`, `jobtitle`, `contact`, `image`, `company`) VALUES
(12, 104, '2026', NULL, NULL, NULL, NULL, NULL),
(14, 101, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, '09108978571', NULL, NULL),
(15, 160, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 161, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 94, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(18, 165, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(19, 163, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(20, 164, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(21, 114, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(22, 158, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(23, 100, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '/uploads/profiles/students/8050b8c6-4ec2-4d5e-bf0a-639e08eeb7f9.jpg', NULL),
(24, 97, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(25, 99, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '/uploads/profiles/students/edea98e5-8a0b-4474-af28-938e54ffa596.jpg', NULL),
(26, 111, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(27, 108, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(28, 115, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(29, 102, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(30, 113, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(31, 96, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '/uploads/profiles/students/68bc083b-187f-4970-be83-89111f8d590d.jpg', NULL),
(32, 107, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(33, 103, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(34, 106, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(35, 124, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(36, 116, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '/uploads/profiles/students/5e694d1d-2250-406c-9ef7-ee1ee9d43671.jpg', NULL),
(37, 121, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(38, 109, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(39, 117, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL),
(40, 95, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '/uploads/profiles/students/7248f3b2-5f87-4c6f-beb4-a11717d43f4a.jpg', NULL),
(41, 98, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `alumni_employment`
--

CREATE TABLE `alumni_employment` (
  `id` int(11) NOT NULL,
  `alumni_user_id` int(11) NOT NULL,
  `graduation_date` date DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `employment_status` enum('employed','unemployed','full-time','part-time','contract','self-employed') DEFAULT NULL,
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

--
-- Dumping data for table `alumni_employment`
--

INSERT INTO `alumni_employment` (`id`, `alumni_user_id`, `graduation_date`, `company_name`, `job_title`, `employment_status`, `industry_type`, `company_address`, `supervisor_name`, `supervisor_email`, `year_started`, `created_at`, `updated_at`, `employment_type`, `monthly_salary`, `is_relevant_to_degree`, `last_update_sent`, `last_update_received`, `update_status`, `next_email_date`, `update_email_count`, `response_deadline`) VALUES
(2, 94, NULL, 'IT Company', 'Junior Developer', '', 'Tech', 'xample', 'Demo Supervisor', 'rialox07@gmail.com', '2017', '2026-03-22 15:50:33', '2026-03-26 22:13:45', 'contract', '100000000', 'yes', '2026-03-22 23:51:02', '2026-03-25 10:13:21', 'scheduled', '2027-02-22', 1, '2026-04-21'),
(3, 101, NULL, 'Xample', 'Junior Developer', '', 'Tech', 'Sample Company', 'Sample', 'gmelicip22@gmail.com', '2026', '2026-03-24 02:46:02', '2026-03-25 14:12:14', 'full-time', '2,000,000', 'yes', '2026-03-25 22:12:14', '2026-03-25 09:38:49', 'sent', '2027-02-25', 2, '2026-04-24'),
(4, 100, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-25 10:52:44', '2026-03-25 14:10:29', NULL, NULL, NULL, '2026-03-25 22:10:29', NULL, 'sent', '2027-02-25', 1, '2026-04-24'),
(5, 97, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 03:18:54', '2026-03-26 04:38:20', NULL, NULL, NULL, '2026-03-26 12:38:20', '2025-03-26 11:21:50', 'scheduled', '2027-02-26', 1, '2026-04-25'),
(6, 99, NULL, 'sample', 'Junior Developer', '', 'Tech', NULL, 'Demo Supervisor', 'gmelicip22@gmail.com', '2026', '2026-03-26 06:46:40', '2026-03-26 06:48:53', 'part-time', '100000000', 'yes', '2026-03-26 14:48:08', '2026-03-26 06:48:53', 'scheduled', '2027-02-26', 1, '2026-04-25'),
(7, 111, NULL, 'C Company', 'Programmer', '', 'Technology', NULL, 'Demo Supervisor', 'gmelicio22@gmail.com', '2026', '2026-03-26 18:54:06', '2026-03-26 18:58:31', 'full-time', '40222', 'yes', NULL, '2026-03-26 18:58:31', 'scheduled', '2027-02-27', 0, NULL),
(8, 108, '2026-03-27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 20:50:13', '2026-03-26 20:57:17', NULL, NULL, NULL, '2026-03-27 04:57:17', '2025-03-27 04:56:48', 'scheduled', '2027-02-27', 1, '2026-04-26'),
(9, 115, '2026-03-27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 21:08:15', '2026-03-26 21:12:27', NULL, NULL, NULL, '2026-03-27 05:12:27', '2025-03-27 05:11:52', 'scheduled', '2027-02-27', 1, '2026-04-26'),
(10, 102, '2026-03-26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 21:20:29', '2026-03-27 14:34:58', NULL, NULL, NULL, '2026-03-27 05:22:08', '2025-03-27 22:34:58', 'scheduled', '2027-02-27', 1, '2026-04-26'),
(11, 113, NULL, 'Xample', 'Engineer', '', 'Networking', NULL, 'Demo Supervisor', 'gmelicio22@gmail.com', '2026', '2026-03-26 21:40:11', '2026-03-26 22:13:45', 'full-time', '40222', 'yes', '2026-03-27 05:41:40', '2026-03-26 22:02:22', 'scheduled', '2027-02-27', 1, '2026-04-26'),
(12, 96, '2026-03-26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-26 21:53:15', '2026-03-26 22:01:28', NULL, NULL, NULL, '2026-03-27 06:01:28', '2025-03-27 06:00:58', 'sent', '2027-02-27', 1, '2026-04-26'),
(13, 107, NULL, 'update ', 'Network Analyst', '', 'Networking', NULL, 'Demo Supervisor', 'sample@gmail.com', '2025', '2026-03-26 22:12:23', '2026-03-27 13:18:30', 'full-time', '100000000', 'yes', '2026-03-27 21:18:30', '2026-03-26 22:18:47', 'sent', '2027-02-27', 2, '2026-04-26'),
(14, 103, NULL, 'camples', 'Network Engineer', '', 'Networking', NULL, 'Demo Supervisor', 'gmelicio22@gmail.com', '2026', '2026-03-27 14:32:46', '2026-04-03 19:25:25', 'full-time', '30000', 'yes', '2026-04-04 03:24:59', '2026-04-03 19:25:14', 'scheduled', '2027-03-03', 4, '2026-05-04'),
(15, 106, NULL, 'X Company', 'CEO', '', 'Nuclear Technology', 'dadaa', 'Sample', 'rialox07@gmail.com', '2026', '2026-03-27 17:30:08', '2026-03-27 19:50:47', 'full-time', '210 000', 'yes', '2026-03-28 02:33:28', '2026-03-27 19:02:58', 'scheduled', '2027-02-27', 2, '2026-04-27'),
(16, 124, '2026-03-28', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-27 19:47:24', '2026-03-31 00:59:40', NULL, NULL, NULL, '2026-03-31 08:59:40', NULL, 'sent', '2027-03-03', 1, '2026-04-30'),
(18, 121, NULL, 'update ', 'dev', '', 'Technology', NULL, 'Sample', 'sample@gmail.com', '2026', '2026-03-28 04:41:06', '2026-03-28 04:52:55', 'full-time', '30000', 'yes', '2026-03-28 12:50:06', '2026-03-28 04:52:14', 'scheduled', '2027-02-28', 1, '2026-04-27'),
(19, 109, NULL, 'Sample Company', 'IT Spikerist', '', 'Technology', NULL, 'Demo Supervisor', 'demosupervisor@gmail.com', '2026', '2026-03-29 23:42:15', '2026-03-29 23:46:55', 'full-time', '50, 000', 'yes', '2026-03-30 07:44:54', '2026-03-29 23:46:22', 'scheduled', '2027-03-01', 1, '2026-04-29'),
(20, 117, NULL, 'Demo', 'Demo', '', 'Tech', NULL, 'Demo Supervisor', 'rialox07@gmail.com', '2026', '2026-03-31 00:55:06', '2026-03-31 00:59:04', 'full-time', NULL, 'yes', '2026-03-31 08:57:08', '2026-03-31 00:58:44', 'scheduled', '2027-03-03', 1, '2026-04-30'),
(21, 95, '2026-03-31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-31 01:00:35', '2026-04-03 19:29:33', NULL, NULL, NULL, '2026-04-04 03:28:53', '2026-04-03 19:29:16', 'scheduled', '2027-03-03', 2, '2026-05-04'),
(22, 98, NULL, 'SSS', 'IT Support', '', 'Technology', NULL, 'Demo Supervisor', 'gmelicio22@gmail.com', '2026', '2026-03-31 01:50:59', '2026-04-03 19:23:18', 'full-time', '30, 000', 'yes', '2026-03-31 10:00:10', '2026-04-03 19:20:46', 'scheduled', '2027-03-03', 2, '2026-04-30');

-- --------------------------------------------------------

--
-- Table structure for table `alumni_employment_history`
--

CREATE TABLE `alumni_employment_history` (
  `id` int(11) NOT NULL,
  `alumni_user_id` int(11) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `employment_type` enum('full-time','part-time','contract','internship','temporary') DEFAULT NULL,
  `industry_type` varchar(100) DEFAULT NULL,
  `company_address` varchar(500) DEFAULT NULL,
  `monthly_salary` varchar(100) DEFAULT NULL,
  `is_relevant_to_degree` enum('yes','no','partially') DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 0 COMMENT '1 = current job, 0 = past job',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alumni_employment_history`
--

INSERT INTO `alumni_employment_history` (`id`, `alumni_user_id`, `company_name`, `job_title`, `employment_type`, `industry_type`, `company_address`, `monthly_salary`, `is_relevant_to_degree`, `start_date`, `end_date`, `is_current`, `created_at`, `updated_at`) VALUES
(1, 103, 'Xample', 'Network Engineer', 'full-time', 'Networking', NULL, '30000', 'yes', '0000-00-00', '2026-04-03', 0, '2026-04-03 19:22:05', '2026-04-03 19:24:18'),
(2, 103, 'cample', 'Network Engineer', 'full-time', 'Networking', NULL, '30000', 'yes', '0000-00-00', '2026-04-03', 0, '2026-04-03 19:24:18', '2026-04-03 19:25:14'),
(3, 103, 'camples', 'Network Engineer', 'full-time', 'Networking', NULL, '30000', 'yes', '0000-00-00', NULL, 1, '2026-04-03 19:25:14', '2026-04-03 19:25:14');

-- --------------------------------------------------------

--
-- Stand-in structure for view `alumni_employment_tracker_view`
-- (See below for the actual view)
--
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

-- --------------------------------------------------------

--
-- Table structure for table `course_management`
--

CREATE TABLE `course_management` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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

--
-- Dumping data for table `course_management`
--

INSERT INTO `course_management` (`id`, `department`, `program_name`, `program_code`, `year_level`, `section`, `status`, `created_at`, `updated_at`) VALUES
(0, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 12, 'LOVE', 'active', '2026-03-18 01:19:10', '2026-03-18 01:19:10'),
(1, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'B', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(2, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'C', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(3, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'A', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(4, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'LOVE', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(5, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'HOPE', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(6, 'Senior High', 'Accountancy, Business, and Management', 'ABM', 11, 'FAITH', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(7, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'A', 'active', '2026-03-13 21:32:46', '2026-03-20 15:29:01'),
(8, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'B', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(9, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'C', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(10, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 1, 'D', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(11, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 4, 'E', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(12, 'College', 'Bachelor of Science in Information Technology', 'BSIT', 2, 'A', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46'),
(15, 'College', 'Bachelor of Science and Technology in Information Technology', 'BSIT', 3, 'B', 'active', '2026-03-13 21:32:46', '2026-03-13 21:32:46');

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
-- Table structure for table `employment_update_queue`
--

CREATE TABLE `employment_update_queue` (
  `id` int(11) NOT NULL,
  `alumni_user_id` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `email_sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employment_update_queue`
--

INSERT INTO `employment_update_queue` (`id`, `alumni_user_id`, `scheduled_date`, `status`, `email_sent_at`, `created_at`, `updated_at`) VALUES
(1, 97, '2027-02-26', 'sent', '2026-03-26 12:38:20', '2026-03-26 04:38:20', '2026-03-26 04:38:20'),
(2, 108, '2027-02-27', 'sent', '2026-03-27 04:57:17', '2026-03-26 20:57:17', '2026-03-26 20:57:17'),
(3, 115, '2027-02-27', 'sent', '2026-03-27 05:12:27', '2026-03-26 21:12:27', '2026-03-26 21:12:27'),
(4, 102, '2027-02-27', 'sent', '2026-03-27 05:22:08', '2026-03-26 21:22:08', '2026-03-26 21:22:08'),
(5, 113, '2027-02-27', 'sent', '2026-03-27 05:41:40', '2026-03-26 21:41:40', '2026-03-26 21:41:40'),
(6, 96, '2027-02-27', 'sent', '2026-03-27 06:01:28', '2026-03-26 22:01:28', '2026-03-26 22:01:28'),
(7, 107, '2027-02-27', 'sent', '2026-03-27 06:13:48', '2026-03-26 22:13:48', '2026-03-26 22:13:48'),
(8, 103, '2027-02-28', 'sent', '2026-03-28 00:37:40', '2026-03-27 16:37:40', '2026-03-27 16:37:40'),
(9, 103, '2027-02-28', 'sent', '2026-03-28 00:58:23', '2026-03-27 16:58:23', '2026-03-27 16:58:23'),
(10, 106, '2027-02-28', 'sent', '2026-03-28 02:15:25', '2026-03-27 18:15:25', '2026-03-27 18:15:25'),
(11, 106, '2027-02-28', 'sent', '2026-03-28 02:33:28', '2026-03-27 18:33:28', '2026-03-27 18:33:28'),
(12, 116, '2027-02-28', 'sent', '2026-03-28 03:50:50', '2026-03-27 19:50:50', '2026-03-27 19:50:50'),
(13, 116, '2027-02-28', 'sent', '2026-03-28 03:57:08', '2026-03-27 19:57:08', '2026-03-27 19:57:08'),
(14, 121, '2027-02-28', 'sent', '2026-03-28 12:50:06', '2026-03-28 04:50:06', '2026-03-28 04:50:06'),
(15, 109, '2027-03-02', 'sent', '2026-03-30 07:44:55', '2026-03-29 23:44:55', '2026-03-29 23:44:55'),
(16, 117, '2027-03-03', 'sent', '2026-03-31 08:57:08', '2026-03-31 00:57:08', '2026-03-31 00:57:08');

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
-- Table structure for table `evaluation_periods`
--

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

--
-- Dumping data for table `evaluation_periods`
--

INSERT INTO `evaluation_periods` (`id`, `name`, `start_date`, `end_date`, `is_active`, `academic_year`, `semester`, `created_at`, `updated_at`) VALUES
(9, 'End of Semester Evaluation Period', '2026-04-05', '2026-04-12', 1, '2025-2026', '2nd Semester', '2026-03-30 22:29:58', '2026-04-04 19:54:18');

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `average_rating` decimal(3,2) DEFAULT NULL,
  `total_ratings` int(11) DEFAULT 0,
  `last_rating_update` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluation_subjects`
--

INSERT INTO `evaluation_subjects` (`id`, `subject_code`, `subject_name`, `department`, `units`, `description`, `status`, `created_at`, `updated_at`, `average_rating`, `total_ratings`, `last_rating_update`) VALUES
(39, 'IT402', 'Capstone Project 2', 'College', 3, NULL, 'active', '2026-03-14 05:49:56', '2026-03-14 05:49:56', NULL, 0, NULL),
(44, 'CS', 'INtro to CS', 'Senior High', 3, NULL, 'active', '2026-04-01 06:29:36', '2026-04-01 06:29:36', NULL, 0, NULL),
(45, 'IT121', 'Networking', 'College', 3, NULL, 'active', '2026-04-04 15:58:28', '2026-04-04 15:58:28', NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `feedback_invitations`
--

CREATE TABLE `feedback_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL COMMENT 'Secure random token for short links',
  `form_id` int(11) NOT NULL COMMENT 'Reference to forms.id',
  `supervisor_email` varchar(255) NOT NULL,
  `supervisor_name` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `alumnus_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether the invitation has been used',
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `form_id` (`form_id`),
  KEY `expires_at` (`expires_at`),
  KEY `used` (`used`),
  CONSTRAINT `feedback_invitations_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback_template_categories`
--

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

--
-- Dumping data for table `feedback_template_categories`
--

INSERT INTO `feedback_template_categories` (`id`, `category_name`, `description`, `display_order`, `feedback_type`, `is_active`, `created_at`, `updated_at`, `parent_category_id`) VALUES
(32, 'OUTCOMES-BASED INSTRUCTIONAL DELIVERY', '', 1, 'instructor', 1, '2026-03-15 06:08:02', '2026-03-30 22:50:16', NULL),
(33, 'Clearly communicates intended learning outcomes of the course and lessons', NULL, 1, 'instructor', 1, '2026-03-15 06:08:34', '2026-03-15 06:08:34', 32),
(34, 'Aligns learning activities, assessments, and instructional strategies with outcomes', NULL, 2, 'instructor', 1, '2026-03-15 06:08:48', '2026-03-15 06:08:48', 32),
(35, 'Facilitates active learning and real-world application of knowledge.', NULL, 3, 'instructor', 1, '2026-03-15 06:09:02', '2026-03-15 06:09:02', 32),
(36, 'Provides timely, constructive feedback to support learning', NULL, 4, 'instructor', 1, '2026-03-15 06:09:23', '2026-03-15 06:09:23', 32),
(37, ' TEACHING AND PROFESSIONAL COMPETENCE', NULL, 5, 'instructor', 1, '2026-03-15 06:09:49', '2026-03-15 06:09:49', NULL),
(38, 'Demonstrates subject matter expertise and integrates current trends.', NULL, 6, 'instructor', 1, '2026-03-15 06:10:22', '2026-03-15 06:10:22', 37),
(39, 'Promotes critical, analytical, and reflective thinking.', NULL, 7, 'instructor', 1, '2026-03-15 06:10:38', '2026-03-15 06:10:38', 37),
(40, 'Effectively manages the classroom and fosters an inclusive environment.', NULL, 8, 'instructor', 1, '2026-03-15 06:10:47', '2026-03-15 06:10:47', 37),
(41, 'Utilizes appropriate technology to enhance learning', NULL, 9, 'instructor', 1, '2026-03-15 06:10:59', '2026-03-15 06:10:59', 37),
(42, 'CLASSROOM MANAGEMENT AND DELIVERY', NULL, 10, 'instructor', 1, '2026-03-15 06:11:19', '2026-03-15 06:11:19', NULL),
(43, 'Organizes and delivers content clearly and logically.', NULL, 11, 'instructor', 1, '2026-03-15 06:11:29', '2026-03-15 06:11:29', 42),
(44, 'States objectives and outlines the course structure', NULL, 12, 'instructor', 1, '2026-03-15 06:11:39', '2026-03-15 06:11:39', 42),
(45, 'Encourages participation and responds to student understanding.', NULL, 13, 'instructor', 1, '2026-03-15 06:11:48', '2026-03-15 06:11:48', 42),
(46, 'Effectively uses instructional materials and motivates independent learning.', NULL, 14, 'instructor', 1, '2026-03-15 06:11:59', '2026-03-15 06:11:59', 42),
(47, 'Develops discipline through the learning process.', NULL, 15, 'instructor', 1, '2026-03-15 06:12:26', '2026-03-15 06:12:26', 42),
(52, 'STUDENT SUPPORT AND CONSULTATION', NULL, 16, 'instructor', 1, '2026-03-16 22:39:53', '2026-03-16 22:39:53', NULL),
(53, 'Is accessible for academic support and consultation', NULL, 17, 'instructor', 1, '2026-03-16 22:40:06', '2026-03-16 22:40:06', 52),
(54, 'Responds to student concerns with empathy and professionalism', NULL, 18, 'instructor', 1, '2026-03-16 22:40:18', '2026-03-16 22:40:18', 52),
(55, 'Promotes student well-being and a help-seeking mindset.', NULL, 19, 'instructor', 1, '2026-03-16 22:40:29', '2026-03-16 22:40:29', 52),
(56, ' ETHICAL, PROFESSIONAL, AND SCHOLARLY BEHAVIOR', NULL, 20, 'instructor', 1, '2026-03-16 22:40:41', '2026-03-16 22:40:41', NULL),
(57, 'Displays professionalism and ethical conduct in teaching.', NULL, 21, 'instructor', 1, '2026-03-16 22:40:53', '2026-03-16 22:40:53', 56),
(58, 'Treats students fairly and equitably.', NULL, 22, 'instructor', 1, '2026-03-16 22:41:01', '2026-03-16 22:41:01', 56),
(59, 'Demonstrates commitment to continuous learning.', NULL, 23, 'instructor', 1, '2026-03-16 22:41:09', '2026-03-16 22:41:09', 56),
(60, 'STUDENT ENGAGEMENT AND OUTCOMES ACHIEVEMENT', NULL, 24, 'instructor', 1, '2026-03-16 22:41:29', '2026-03-16 22:41:29', NULL),
(61, 'Motivates students to take ownership of learning', NULL, 25, 'instructor', 1, '2026-03-16 22:41:37', '2026-03-16 22:41:37', 60),
(62, 'Designs tasks that promote and assess learning outcomes.', NULL, 26, 'instructor', 1, '2026-03-16 22:41:46', '2026-03-16 22:41:46', 60),
(63, 'Monitors and evaluates student performance effectively.', NULL, 27, 'instructor', 1, '2026-03-16 22:41:54', '2026-03-16 22:41:54', 60),
(64, 'Course Content', NULL, 28, 'subject', 1, '2026-03-19 01:11:37', '2026-03-19 01:11:37', NULL),
(65, 'Learning Outcomes', NULL, 29, 'subject', 1, '2026-03-19 01:12:18', '2026-03-19 01:12:18', NULL),
(66, 'Learning Materials', NULL, 30, 'subject', 1, '2026-03-19 01:12:26', '2026-03-19 01:12:26', NULL),
(67, 'Assessments', NULL, 31, 'subject', 1, '2026-03-19 01:12:34', '2026-03-19 01:12:34', NULL),
(68, 'Workload & Difficulty', NULL, 32, 'subject', 1, '2026-03-19 01:12:41', '2026-03-19 01:12:41', NULL),
(69, 'Practical Application', NULL, 33, 'subject', 1, '2026-03-19 01:12:49', '2026-03-19 01:12:49', NULL),
(70, 'Course Structure & Delivery', NULL, 34, 'subject', 1, '2026-03-19 01:12:58', '2026-03-19 01:12:58', NULL),
(71, 'Overall Evaluation', NULL, 35, 'subject', 1, '2026-03-19 01:13:51', '2026-03-19 01:13:51', NULL),
(72, 'The course objectives are clear.', NULL, 36, 'subject', 1, '2026-03-19 01:14:08', '2026-03-19 01:14:08', 64),
(73, 'The topics covered are relevant to my program.', NULL, 37, 'subject', 1, '2026-03-19 01:14:16', '2026-03-19 01:14:16', 64),
(74, 'The lessons are well-organized.', NULL, 38, 'subject', 1, '2026-03-19 01:14:23', '2026-03-19 01:14:23', 64),
(75, 'The subject provides sufficient depth of knowledge.', NULL, 39, 'subject', 1, '2026-03-19 01:14:30', '2026-03-19 01:14:30', 64),
(76, 'The content follows the syllabus properly.', NULL, 40, 'subject', 1, '2026-03-19 01:14:37', '2026-03-19 01:14:37', 64),
(77, 'The expected learning outcomes are clearly defined.', NULL, 41, 'subject', 1, '2026-03-19 01:14:46', '2026-03-19 01:14:46', 65),
(78, 'I was able to achieve the learning objectives.', NULL, 42, 'subject', 1, '2026-03-19 01:14:52', '2026-03-19 01:14:52', 65),
(79, 'This subject improved my knowledge and skills.', NULL, 43, 'subject', 1, '2026-03-19 01:14:59', '2026-03-19 01:14:59', 65),
(80, 'The subject contributed to my academic development.', NULL, 44, 'subject', 1, '2026-03-19 01:15:07', '2026-03-19 01:15:07', 65),
(81, 'The course materials are readily available.', NULL, 45, 'subject', 1, '2026-03-19 01:15:15', '2026-03-19 01:15:15', 66),
(82, 'The modules/handouts are of good quality.', NULL, 46, 'subject', 1, '2026-03-19 01:15:23', '2026-03-19 01:15:23', 66),
(83, 'The materials help me understand the lessons better.', NULL, 47, 'subject', 1, '2026-03-19 01:15:31', '2026-03-19 01:15:31', 66),
(84, 'The resources are easy to access.', NULL, 48, 'subject', 1, '2026-03-19 01:15:38', '2026-03-19 01:15:38', 66),
(85, 'The assessment requirements are clearly explained.', NULL, 49, 'subject', 1, '2026-03-19 01:15:46', '2026-03-19 01:15:46', 67),
(86, 'The exams and activities reflect the lessons taught.', NULL, 50, 'subject', 1, '2026-03-19 01:15:53', '2026-03-19 01:15:53', 67),
(87, 'The difficulty of assessments is appropriate.', NULL, 51, 'subject', 1, '2026-03-19 01:16:00', '2026-03-19 01:16:00', 67),
(88, 'There is a good variety of assessment methods.', NULL, 52, 'subject', 1, '2026-03-19 01:16:08', '2026-03-19 01:16:08', 67),
(89, 'The workload is appropriate for the subject.', NULL, 53, 'subject', 1, '2026-03-19 01:16:15', '2026-03-19 01:16:15', 68),
(90, 'The subject difficulty is manageable.', NULL, 54, 'subject', 1, '2026-03-19 01:16:22', '2026-03-19 01:16:22', 68),
(91, 'The requirements can be completed within the given time.', NULL, 55, 'subject', 1, '2026-03-19 01:16:30', '2026-03-19 01:16:30', 68),
(92, 'The pacing of the subject is appropriate.', NULL, 56, 'subject', 1, '2026-03-19 01:16:37', '2026-03-19 01:16:37', 68),
(93, 'The subject is relevant to real-world situations.', NULL, 57, 'subject', 1, '2026-03-19 01:16:45', '2026-03-19 01:16:45', 69),
(94, 'The knowledge gained can be applied in my future career.', NULL, 58, 'subject', 1, '2026-03-19 01:16:53', '2026-03-19 01:16:53', 69),
(95, 'The subject helps develop practical skills.', NULL, 59, 'subject', 1, '2026-03-19 01:17:00', '2026-03-19 01:17:00', 69),
(96, 'The lessons are useful beyond the classroom.', NULL, 60, 'subject', 1, '2026-03-19 01:17:07', '2026-03-19 01:17:07', 69),
(97, 'The topics are presented in a logical sequence.', NULL, 61, 'subject', 1, '2026-03-19 01:17:58', '2026-03-19 01:17:58', 70),
(98, 'The course schedule is well-organized.', NULL, 62, 'subject', 1, '2026-03-19 01:18:04', '2026-03-19 01:18:04', 70),
(99, 'The instructions for activities are clear.', NULL, 63, 'subject', 1, '2026-03-19 01:18:13', '2026-03-19 01:18:13', 70),
(100, 'The subject requirements are consistent.', NULL, 64, 'subject', 1, '2026-03-19 01:18:21', '2026-03-19 01:18:21', 70),
(101, 'I am satisfied with this subject.', NULL, 65, 'subject', 1, '2026-03-19 01:18:29', '2026-03-19 01:18:29', 71),
(102, 'This subject is interesting and engaging.', NULL, 66, 'subject', 1, '2026-03-19 01:18:37', '2026-03-19 01:18:37', 71),
(103, 'I would recommend this subject to other students.', NULL, 67, 'subject', 1, '2026-03-19 01:18:45', '2026-03-19 01:18:45', 71),
(104, 'Overall, this subject met my expectations.', NULL, 68, 'subject', 1, '2026-03-19 01:18:55', '2026-03-19 01:18:55', 71);

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
(602, 'demo', '', '', 'general', 'Event', NULL, 'Students - BSIT - 4B', 'active', 'https://res.cloudinary.com/dgkugadfe/image/upload/v1775326338/feedbacts/forms/9cb799f8-5490-4e8a-852f-6b5d91b6560a.jpg', 0, '2026-04-04', '2026-04-05', 1, '2026-04-04 18:13:11', '2026-04-04 20:18:18', 0, 0, NULL),
(604, 'demo', '', NULL, 'general', 'Course Evaluation', NULL, 'Students - BSIT - 4B', 'active', NULL, 0, '2026-04-05', '2026-04-17', 1, '2026-04-05 06:49:19', '2026-04-05 06:49:19', 0, 0, NULL),
(605, 'demo', '', NULL, 'general', 'Course Evaluation', NULL, 'Students - BSIT - 4B', 'active', NULL, 0, '2026-04-06', '2026-04-14', 1, '2026-04-05 07:27:27', '2026-04-05 07:27:27', 0, 0, NULL),
(606, 'demo', '', '', 'general', 'Course Evaluation', NULL, 'Students - BSIT - 4B', 'active', NULL, 0, '2026-04-04', '2026-04-05', 1, '2026-04-05 07:45:38', '2026-04-05 07:46:45', 0, 0, NULL),
(607, 'demo', '', NULL, 'general', 'Course Evaluation', NULL, 'Students - BSIT - 4B', 'active', NULL, 0, '2026-04-05', '2026-04-07', 1, '2026-04-05 08:39:46', '2026-04-05 08:39:46', 0, 0, NULL),
(610, 'demo', '', NULL, 'general', 'Course Evaluation', NULL, 'Employers - Xample', 'active', NULL, 0, '2026-04-07', '2026-04-07', 1, '2026-04-05 16:49:08', '2026-04-05 16:49:08', 0, 0, NULL);

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
(3470, 602, 175, '2026-04-04 20:18:18', 'pending'),
(3479, 604, 175, '2026-04-05 06:49:19', 'pending'),
(3480, 605, 105, '2026-04-05 07:27:27', 'pending'),
(3481, 605, 110, '2026-04-05 07:27:27', 'pending'),
(3482, 605, 120, '2026-04-05 07:27:27', 'pending'),
(3483, 605, 175, '2026-04-05 07:27:27', 'pending'),
(3487, 606, 120, '2026-04-05 07:46:45', 'pending'),
(3488, 607, 105, '2026-04-05 08:39:46', 'pending'),
(3489, 607, 110, '2026-04-05 08:39:46', 'pending'),
(3490, 607, 118, '2026-04-05 08:39:46', 'pending'),
(3491, 607, 119, '2026-04-05 08:39:46', 'pending'),
(3492, 607, 120, '2026-04-05 08:39:46', 'pending'),
(3493, 607, 122, '2026-04-05 08:39:46', 'pending'),
(3494, 607, 123, '2026-04-05 08:39:46', 'pending'),
(3495, 607, 175, '2026-04-05 08:39:46', 'pending');

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
(34, 'Course Evaluation', NULL, '2026-02-24 07:59:01', '2026-02-24 07:59:01'),
(36, 'School Activity', NULL, '2026-03-16 01:55:03', '2026-03-16 01:55:03'),
(37, 'Peer to Peer Evaluation', NULL, '2026-03-22 09:45:04', '2026-03-22 09:45:04');

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
(207, 602, 1, '2026-04-04', '03:13:00', '2026-04-05', '02:13:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-04-04 18:13:11'),
(209, 604, 1, '2026-04-05', '14:49:00', '2026-04-17', '14:49:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-04-05 06:49:19'),
(210, 605, 1, '2026-04-06', '15:27:00', '2026-04-14', '15:27:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-04-05 07:27:27'),
(211, 606, 1, '2026-04-04', '15:45:00', '2026-04-05', '16:45:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-04-05 07:45:38'),
(212, 607, 1, '2026-04-05', '16:39:00', '2026-04-07', '18:39:00', '{\"target_audience\":\"Students - BSIT - 4B\",\"department\":\"College\",\"course_year_section\":\"BSIT - 4B\",\"company\":null}', 'active', '2026-04-05 08:39:46'),
(214, 610, 1, '2026-04-07', '00:49:00', '2026-04-07', '01:49:00', '{\"target_audience\":\"Employers - Xample\",\"department\":null,\"course_year_section\":\"Xample\",\"company\":null}', 'active', '2026-04-05 16:49:08');

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

--
-- Dumping data for table `graduation_records`
--

INSERT INTO `graduation_records` (`id`, `student_id`, `user_id`, `program_id`, `graduation_year`, `degree`, `honors`, `ceremony_date`, `created_at`) VALUES
(2, 71, 104, 1, '2026', NULL, NULL, NULL, '2026-03-05 09:39:06'),
(3, 68, 101, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-14 07:48:43'),
(4, 61, 94, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-17 04:30:24'),
(5, 110, 165, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-18 01:19:24'),
(6, 108, 163, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-20 15:26:06'),
(7, 109, 164, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-20 15:35:08'),
(8, 81, 114, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-20 15:43:16'),
(9, 107, 158, 15, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-20 16:04:55'),
(10, 67, 100, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-25 10:52:44'),
(11, 64, 97, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 03:18:54'),
(12, 66, 99, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 06:46:40'),
(13, 78, 111, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 18:54:06'),
(14, 75, 108, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 20:50:13'),
(15, 82, 115, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 21:08:15'),
(16, 69, 102, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 21:20:29'),
(17, 80, 113, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 21:40:11'),
(18, 63, 96, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 21:53:15'),
(19, 74, 107, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-26 22:12:23'),
(20, 70, 103, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-27 14:32:46'),
(21, 73, 106, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-27 17:30:08'),
(22, 91, 124, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-27 19:47:24'),
(23, 83, 116, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-27 19:48:50'),
(24, 88, 121, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-28 04:41:06'),
(25, 76, 109, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-29 23:42:15'),
(26, 84, 117, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-31 00:55:06'),
(27, 62, 95, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-31 01:00:35'),
(28, 65, 98, 1, '2026', 'Bachelor of Science and Technology in Information Technology', NULL, NULL, '2026-03-31 01:50:59');

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
(24, 150, '90872', 'Both', 'IT Instructor', '', '/uploads/profiles/instructors/46a1d269-edfe-4b91-ab9a-de394f161782.jpg'),
(26, 152, '79164', 'College', 'College dean/DBM Head', '', '/uploads/profiles/instructors/0bca9ca3-d970-41f3-9ad7-063a564750f9.png'),
(33, 171, '12323', 'College', 'IT Instructor', '', NULL),
(34, 172, '09755', 'College', 'MATH Teacher', '', NULL),
(35, 173, '41797', 'College', 'IT Instructor', '', NULL);

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
(19, 152, 39, '2026-03-14 05:50:14', '2026-03-14 05:50:14'),
(20, 150, 39, '2026-03-14 23:13:17', '2026-03-14 23:13:17');

-- --------------------------------------------------------

--
-- Table structure for table `instructor_feedback`
--

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
  `archived_at` timestamp NULL DEFAULT NULL,
  `academic_period_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `instructor_feedback`
--

INSERT INTO `instructor_feedback` (`id`, `student_id`, `instructor_id`, `subject_id`, `section_id`, `academic_year`, `semester`, `responses`, `overall_rating`, `submitted_at`, `category_averages`, `archived`, `archived_at`, `academic_period_id`) VALUES
(50, 123, 152, 45, 71, '2025-2026', '1st', '{\"33\":4,\"34\":4,\"35\":4,\"36\":4,\"38\":1,\"39\":1,\"40\":1,\"41\":1,\"43\":1,\"44\":1,\"45\":1,\"46\":1,\"47\":1,\"53\":1,\"54\":1,\"55\":1,\"57\":1,\"58\":1,\"59\":1,\"61\":1,\"62\":1,\"63\":1}', 1.55, '2026-04-05 06:10:17', '{\"32\":{\"name\":\"OUTCOMES-BASED INSTRUCTIONAL DELIVERY\",\"average\":4,\"count\":4,\"questions\":{\"33\":4,\"34\":4,\"35\":4,\"36\":4}},\"37\":{\"name\":\" TEACHING AND PROFESSIONAL COMPETENCE\",\"average\":1,\"count\":4,\"questions\":{\"38\":1,\"39\":1,\"40\":1,\"41\":1}},\"42\":{\"name\":\"CLASSROOM MANAGEMENT AND DELIVERY\",\"average\":1,\"count\":5,\"questions\":{\"43\":1,\"44\":1,\"45\":1,\"46\":1,\"47\":1}},\"52\":{\"name\":\"STUDENT SUPPORT AND CONSULTATION\",\"average\":1,\"count\":3,\"questions\":{\"53\":1,\"54\":1,\"55\":1}},\"56\":{\"name\":\" ETHICAL, PROFESSIONAL, AND SCHOLARLY BEHAVIOR\",\"average\":1,\"count\":3,\"questions\":{\"57\":1,\"58\":1,\"59\":1}},\"60\":{\"name\":\"STUDENT ENGAGEMENT AND OUTCOMES ACHIEVEMENT\",\"average\":1,\"count\":3,\"questions\":{\"61\":1,\"62\":1,\"63\":1}},\"overall\":{\"average\":1.55,\"count\":22}}', 0, NULL, 89),
(51, 122, 152, 45, 71, '2025-2026', '1st', '{\"33\":1,\"34\":1,\"35\":1,\"36\":1,\"38\":1,\"39\":1,\"40\":1,\"41\":1,\"43\":1,\"44\":1,\"45\":1,\"46\":1,\"47\":1,\"53\":1,\"54\":1,\"55\":1,\"57\":1,\"58\":1,\"59\":1,\"61\":1,\"62\":1,\"63\":1}', 1.00, '2026-04-05 06:11:57', '{\"32\":{\"name\":\"OUTCOMES-BASED INSTRUCTIONAL DELIVERY\",\"average\":1,\"count\":4,\"questions\":{\"33\":1,\"34\":1,\"35\":1,\"36\":1}},\"37\":{\"name\":\" TEACHING AND PROFESSIONAL COMPETENCE\",\"average\":1,\"count\":4,\"questions\":{\"38\":1,\"39\":1,\"40\":1,\"41\":1}},\"42\":{\"name\":\"CLASSROOM MANAGEMENT AND DELIVERY\",\"average\":1,\"count\":5,\"questions\":{\"43\":1,\"44\":1,\"45\":1,\"46\":1,\"47\":1}},\"52\":{\"name\":\"STUDENT SUPPORT AND CONSULTATION\",\"average\":1,\"count\":3,\"questions\":{\"53\":1,\"54\":1,\"55\":1}},\"56\":{\"name\":\" ETHICAL, PROFESSIONAL, AND SCHOLARLY BEHAVIOR\",\"average\":1,\"count\":3,\"questions\":{\"57\":1,\"58\":1,\"59\":1}},\"60\":{\"name\":\"STUDENT ENGAGEMENT AND OUTCOMES ACHIEVEMENT\",\"average\":1,\"count\":3,\"questions\":{\"61\":1,\"62\":1,\"63\":1}},\"overall\":{\"average\":1,\"count\":22}}', 0, NULL, 89);

-- --------------------------------------------------------

--
-- Table structure for table `notificationemails`
--

CREATE TABLE `notificationemails` (
  `id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email_sent` tinyint(1) NOT NULL DEFAULT 0,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `email_error` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

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

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `is_read`, `related_form_id`, `related_employment_id`, `metadata`, `created_at`, `updated_at`) VALUES
(6, 163, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-20.', 0, 609, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-20\",\"priority\":\"high\"}', '2026-03-19 08:31:29', '2026-03-19 08:31:29'),
(8, 163, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-20.', 0, 609, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-20\",\"priority\":\"high\"}', '2026-03-19 09:23:18', '2026-03-19 09:23:18'),
(10, 163, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-20.', 0, 609, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-20\",\"priority\":\"high\"}', '2026-03-19 09:25:15', '2026-03-19 09:25:15'),
(61, 120, 'form_assigned', 'New Event Form Assigned', 'You have been assigned the form \"Sportfest\". Please complete it by 2026-03-21.', 0, 649, NULL, '{\"form_title\":\"Sportfest\",\"form_category\":\"Event\",\"due_date\":\"2026-03-21\",\"priority\":\"high\"}', '2026-03-20 06:05:01', '2026-03-20 06:05:01'),
(63, 120, 'form_assigned', 'New Event Form Assigned', 'You have been assigned the form \"Sportfest\". Please complete it by 2026-03-20.', 0, 649, NULL, '{\"form_title\":\"Sportfest\",\"form_category\":\"Event\",\"due_date\":\"2026-03-20\",\"priority\":\"high\"}', '2026-03-20 06:06:44', '2026-03-20 06:06:44'),
(65, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sportfest\". Please complete it by 2026-03-21.', 0, 650, NULL, '{\"form_title\":\"Sportfest\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-21\",\"priority\":\"high\"}', '2026-03-20 06:08:18', '2026-03-20 06:08:18'),
(82, 98, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:01:42', '2026-03-21 00:01:42'),
(84, 100, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:01:48', '2026-03-21 00:01:48'),
(87, 105, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:01', '2026-03-21 00:02:01'),
(92, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:17', '2026-03-21 00:02:17'),
(94, 113, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:24', '2026-03-21 00:02:24'),
(97, 117, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:35', '2026-03-21 00:02:35'),
(99, 119, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:42', '2026-03-21 00:02:42'),
(100, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:45', '2026-03-21 00:02:45'),
(102, 122, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:52', '2026-03-21 00:02:52'),
(104, 124, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:02:59', '2026-03-21 00:02:59'),
(105, 166, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-03-22.', 0, 654, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 00:03:03', '2026-03-21 00:03:03'),
(109, 98, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:15:27', '2026-03-21 02:15:27'),
(111, 100, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:15:34', '2026-03-21 02:15:34'),
(114, 105, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:15:44', '2026-03-21 02:15:44'),
(119, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:00', '2026-03-21 02:16:00'),
(121, 113, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:07', '2026-03-21 02:16:07'),
(124, 117, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:17', '2026-03-21 02:16:17'),
(126, 119, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:24', '2026-03-21 02:16:24'),
(127, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:27', '2026-03-21 02:16:27'),
(129, 122, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:34', '2026-03-21 02:16:34'),
(131, 124, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:40', '2026-03-21 02:16:40'),
(132, 166, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample Form\". Please complete it by 2026-03-22.', 0, 655, NULL, '{\"form_title\":\"Sample Form\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-22\",\"priority\":\"high\"}', '2026-03-21 02:16:43', '2026-03-21 02:16:43'),
(144, 171, 'form_assigned', 'New Peer to Peer Evaluation Form Assigned', 'You have been assigned the form \"Peer to Peer Evaluation\". Please complete it by 2026-03-23.', 0, 667, NULL, '{\"form_title\":\"Peer to Peer Evaluation\",\"form_category\":\"Peer to Peer Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 09:45:49', '2026-03-22 09:45:49'),
(145, 172, 'form_assigned', 'New Peer to Peer Evaluation Form Assigned', 'You have been assigned the form \"Peer to Peer Evaluation\". Please complete it by 2026-03-23.', 0, 667, NULL, '{\"form_title\":\"Peer to Peer Evaluation\",\"form_category\":\"Peer to Peer Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 09:45:54', '2026-03-22 09:45:54'),
(146, 173, 'form_assigned', 'New Peer to Peer Evaluation Form Assigned', 'You have been assigned the form \"Peer to Peer Evaluation\". Please complete it by 2026-03-23.', 0, 667, NULL, '{\"form_title\":\"Peer to Peer Evaluation\",\"form_category\":\"Peer to Peer Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 09:45:58', '2026-03-22 09:45:58'),
(148, 171, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-23.', 0, 668, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 10:09:10', '2026-03-22 10:09:10'),
(149, 172, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-23.', 0, 668, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 10:09:14', '2026-03-22 10:09:14'),
(150, 173, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sample\". Please complete it by 2026-03-23.', 0, 668, NULL, '{\"form_title\":\"Sample\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-23\",\"priority\":\"high\"}', '2026-03-22 10:09:17', '2026-03-22 10:09:17'),
(152, 97, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, NULL, NULL, '2026-03-26 03:22:32', '2026-03-26 03:22:32'),
(155, 111, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, NULL, NULL, '2026-03-26 18:56:54', '2026-03-26 18:56:54'),
(156, 108, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 8, NULL, '2026-03-26 20:57:17', '2026-03-26 20:57:17'),
(157, 115, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 9, NULL, '2026-03-26 21:12:27', '2026-03-26 21:12:27'),
(158, 102, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 10, NULL, '2026-03-26 21:22:08', '2026-03-26 21:22:08'),
(159, 113, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 11, NULL, '2026-03-26 21:41:40', '2026-03-26 21:41:40'),
(160, 96, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 12, NULL, '2026-03-26 22:01:28', '2026-03-26 22:01:28'),
(168, 121, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 1, NULL, 18, NULL, '2026-03-28 04:50:06', '2026-03-28 04:51:24'),
(169, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:40:09', '2026-03-29 16:40:09'),
(170, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:40:09', '2026-03-29 16:40:09'),
(171, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:40:09', '2026-03-29 16:40:09'),
(172, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:40:09', '2026-03-29 16:40:09'),
(173, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:44:42', '2026-03-29 16:44:42'),
(174, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:44:42', '2026-03-29 16:44:42'),
(175, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:44:42', '2026-03-29 16:44:42'),
(176, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:44:42', '2026-03-29 16:44:42'),
(177, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:51:38', '2026-03-29 16:51:38'),
(178, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:51:38', '2026-03-29 16:51:38'),
(179, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:51:38', '2026-03-29 16:51:38'),
(180, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:51:38', '2026-03-29 16:51:38'),
(181, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:52:59', '2026-03-29 16:52:59'),
(182, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:52:59', '2026-03-29 16:52:59'),
(183, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:52:59', '2026-03-29 16:52:59'),
(184, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:52:59', '2026-03-29 16:52:59'),
(185, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:55:15', '2026-03-29 16:55:15'),
(186, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:55:15', '2026-03-29 16:55:15'),
(187, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:55:15', '2026-03-29 16:55:15'),
(188, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:55:15', '2026-03-29 16:55:15'),
(189, 101, 'form_assigned', 'New Feedback Form Assigned', 'You have been assigned a new student feedback form. Please complete it before the deadline.', 0, NULL, NULL, NULL, '2026-03-28 16:57:47', '2026-03-29 16:57:47'),
(190, 101, 'form_deadline_approaching', 'Feedback Form Deadline Approaching', 'Your feedback form is due in 3 days. Please complete it soon.', 0, NULL, NULL, NULL, '2026-03-29 14:57:47', '2026-03-29 16:57:47'),
(191, 104, 'form_assigned', 'Instructor Evaluation Assigned', 'You have been assigned a subject evaluation form for your classes.', 0, NULL, NULL, NULL, '2026-03-26 16:57:47', '2026-03-29 16:57:47'),
(192, 104, 'employment_update_required', 'Annual Employment Update Required', 'Please update your employment information for the annual alumni survey.', 1, NULL, NULL, NULL, '2026-03-22 16:57:47', '2026-03-29 16:57:47'),
(193, 109, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 1, NULL, 19, NULL, '2026-03-29 23:44:55', '2026-03-29 23:46:30'),
(195, 171, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sampel\". Please complete it by 2026-03-31.', 0, 589, NULL, '{\"form_title\":\"Sampel\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-31\",\"priority\":\"high\"}', '2026-03-29 23:50:47', '2026-03-29 23:50:47'),
(196, 172, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sampel\". Please complete it by 2026-03-31.', 0, 589, NULL, '{\"form_title\":\"Sampel\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-31\",\"priority\":\"high\"}', '2026-03-29 23:50:50', '2026-03-29 23:50:50'),
(197, 173, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Sampel\". Please complete it by 2026-03-31.', 0, 589, NULL, '{\"form_title\":\"Sampel\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-31\",\"priority\":\"high\"}', '2026-03-29 23:50:53', '2026-03-29 23:50:53'),
(198, 101, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"adadada\". Please complete it by 2026-03-31.', 0, 590, NULL, '{\"form_title\":\"adadada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-03-31\",\"priority\":\"high\"}', '2026-03-29 23:51:40', '2026-03-29 23:51:40'),
(200, 171, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"Demo\". Please complete it by 2026-04-01.', 0, 593, NULL, '{\"form_title\":\"Demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-01\",\"priority\":\"high\"}', '2026-03-30 22:24:06', '2026-03-30 22:24:06'),
(201, 101, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"ALumni\". Please complete it by 2026-04-01.', 0, 594, NULL, '{\"form_title\":\"ALumni\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-01\",\"priority\":\"high\"}', '2026-03-30 22:25:02', '2026-03-30 22:25:02'),
(202, 117, 'employment_update_required', 'Annual Employment Update Required', 'It\'s been over 11 months since your last employment update. Please review and update your employment information.', 0, NULL, 20, NULL, '2026-03-31 00:57:08', '2026-03-31 00:57:08'),
(204, 175, 'form_assigned', 'New Event Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-06.', 0, 602, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Event\",\"due_date\":\"2026-04-06\",\"priority\":\"high\"}', '2026-04-04 18:13:11', '2026-04-04 18:13:11'),
(205, 175, 'form_assigned', 'New Event Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-05.', 0, 602, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Event\",\"due_date\":\"2026-04-05\",\"priority\":\"high\"}', '2026-04-04 20:18:18', '2026-04-04 20:18:18'),
(206, 105, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:15', '2026-04-04 20:19:15'),
(207, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:19', '2026-04-04 20:19:19'),
(208, 118, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:22', '2026-04-04 20:19:22'),
(209, 119, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:26', '2026-04-04 20:19:26'),
(210, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:29', '2026-04-04 20:19:29'),
(211, 122, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:33', '2026-04-04 20:19:33'),
(212, 123, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:36', '2026-04-04 20:19:36'),
(213, 166, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:39', '2026-04-04 20:19:39'),
(214, 174, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:42', '2026-04-04 20:19:42'),
(215, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"dada\". Please complete it by 2026-04-12.', 0, 603, NULL, '{\"form_title\":\"dada\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-12\",\"priority\":\"high\"}', '2026-04-04 20:19:46', '2026-04-04 20:19:46'),
(216, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-17.', 0, 604, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-17\",\"priority\":\"high\"}', '2026-04-05 06:49:19', '2026-04-05 06:49:19'),
(217, 105, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-14.', 0, 605, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-14\",\"priority\":\"high\"}', '2026-04-05 07:27:27', '2026-04-05 07:27:27'),
(218, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-14.', 0, 605, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-14\",\"priority\":\"high\"}', '2026-04-05 07:27:29', '2026-04-05 07:27:29'),
(219, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-14.', 0, 605, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-14\",\"priority\":\"high\"}', '2026-04-05 07:27:32', '2026-04-05 07:27:32'),
(220, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-14.', 0, 605, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-14\",\"priority\":\"high\"}', '2026-04-05 07:27:34', '2026-04-05 07:27:34'),
(221, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-06.', 0, 606, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-06\",\"priority\":\"high\"}', '2026-04-05 07:45:38', '2026-04-05 07:45:38'),
(222, 119, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-06.', 0, 606, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-06\",\"priority\":\"high\"}', '2026-04-05 07:45:44', '2026-04-05 07:45:44'),
(223, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-06.', 0, 606, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-06\",\"priority\":\"high\"}', '2026-04-05 07:45:46', '2026-04-05 07:45:46'),
(224, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-05.', 0, 606, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-05\",\"priority\":\"high\"}', '2026-04-05 07:46:45', '2026-04-05 07:46:45'),
(225, 105, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:46', '2026-04-05 08:39:46'),
(226, 110, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:48', '2026-04-05 08:39:48'),
(227, 118, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:49', '2026-04-05 08:39:49'),
(228, 119, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:50', '2026-04-05 08:39:50'),
(229, 120, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:51', '2026-04-05 08:39:51'),
(230, 122, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:51', '2026-04-05 08:39:51'),
(231, 123, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:52', '2026-04-05 08:39:52'),
(232, 166, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:52', '2026-04-05 08:39:52'),
(233, 174, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:52', '2026-04-05 08:39:52'),
(234, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-07.', 0, 607, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-07\",\"priority\":\"high\"}', '2026-04-05 08:39:53', '2026-04-05 08:39:53'),
(235, 175, 'form_assigned', 'New Course Evaluation Form Assigned', 'You have been assigned the form \"demo\". Please complete it by 2026-04-06.', 0, 608, NULL, '{\"form_title\":\"demo\",\"form_category\":\"Course Evaluation\",\"due_date\":\"2026-04-06\",\"priority\":\"high\"}', '2026-04-05 08:42:34', '2026-04-05 08:42:34');

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
(1996, 602, NULL, 'demo', 'text', NULL, 0, NULL, NULL, 0),
(1998, 604, NULL, 'demo', 'text', NULL, 0, NULL, NULL, 0),
(1999, 605, NULL, 'demo', 'text', NULL, 0, NULL, NULL, 0),
(2000, 606, NULL, 'demo123!', 'text', NULL, 0, NULL, NULL, 0),
(2001, 607, NULL, 'demo', 'text', NULL, 0, NULL, NULL, 0),
(2004, 610, NULL, 'demo', 'text', NULL, 0, NULL, NULL, 0);

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
-- Table structure for table `semester_reset_log`
--

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

--
-- Dumping data for table `semester_reset_log`
--

INSERT INTO `semester_reset_log` (`id`, `department`, `from_period_id`, `to_period_id`, `from_academic_year`, `from_period_number`, `to_academic_year`, `to_period_number`, `reset_type`, `triggered_by`, `trigger_user_id`, `notes`, `created_at`) VALUES
(26, 'Senior High', NULL, 46, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-01 19:27:51'),
(27, 'Senior High', 46, 43, '2025-2026', 2, '2024-2025', 4, 'both', 'manual', 1, NULL, '2026-04-01 19:27:54'),
(28, 'College', NULL, 47, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-01 19:29:10'),
(29, 'College', NULL, 48, NULL, NULL, '2024-2025', 1, 'both', 'manual', 1, NULL, '2026-04-02 02:40:48'),
(30, 'Senior High', NULL, 51, NULL, NULL, '2024-2025', 1, 'both', 'manual', 1, NULL, '2026-04-03 13:55:48'),
(31, 'College', NULL, 52, NULL, NULL, '2024-2025', 1, 'both', 'manual', 1, NULL, '2026-04-03 15:52:20'),
(32, 'College', NULL, 53, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-03 15:57:05'),
(33, 'College', NULL, 55, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-03 16:24:15'),
(34, 'College', NULL, 54, NULL, NULL, '2024-2025', 2, 'both', 'manual', 1, NULL, '2026-04-03 16:35:40'),
(35, 'College', NULL, 56, NULL, NULL, '2024-2025', 1, 'both', 'manual', 1, NULL, '2026-04-03 16:42:58'),
(36, 'College', NULL, 57, NULL, NULL, '2024-2025', 1, 'both', 'manual', 1, NULL, '2026-04-03 17:17:48'),
(37, 'Senior High', NULL, 59, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-03 17:18:37'),
(38, 'College', NULL, 58, NULL, NULL, '2024-2025', 2, 'both', 'manual', 1, NULL, '2026-04-03 17:28:28'),
(39, 'College', 58, 61, '2024-2025', 2, '2025-2026', 3, 'both', 'manual', 1, NULL, '2026-04-03 17:30:07'),
(40, 'College', 61, 62, '2025-2026', 3, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 16:59:43'),
(41, 'Senior High', NULL, 60, NULL, NULL, '2024-2025', 2, 'both', 'manual', 1, NULL, '2026-04-04 17:00:08'),
(42, 'College', NULL, 68, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-04 19:28:13'),
(43, 'Senior High', NULL, 69, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 19:28:20'),
(44, 'College', NULL, 70, NULL, NULL, '2025-2026', 3, 'both', 'manual', 1, NULL, '2026-04-04 19:40:58'),
(45, 'Senior High', NULL, 71, NULL, NULL, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-04 19:41:11'),
(46, 'College', 70, 72, '2025-2026', 3, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 19:43:40'),
(47, 'College', NULL, 74, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 19:52:41'),
(48, 'Senior High', NULL, 77, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 19:52:57'),
(49, 'Senior High', NULL, 82, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 20:15:28'),
(50, 'College', NULL, 79, NULL, NULL, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 20:15:33'),
(51, 'College', 79, 80, '2025-2026', 1, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-04 20:21:21'),
(52, 'Senior High', 82, 83, '2025-2026', 1, '2025-2026', 2, 'both', 'manual', 1, NULL, '2026-04-04 20:21:38'),
(53, 'College', 80, 81, '2025-2026', 2, '2025-2026', 3, 'both', 'manual', 1, NULL, '2026-04-04 20:51:54'),
(54, 'Senior High', 83, 84, '2025-2026', 2, '2025-2026', 3, 'both', 'manual', 1, NULL, '2026-04-04 20:51:59'),
(55, 'College', 81, 89, '2025-2026', 3, '2025-2026', 1, 'both', 'manual', 1, NULL, '2026-04-04 21:26:52'),
(56, 'Senior High', 84, 90, '2025-2026', 3, '2026-2027', 4, 'both', 'manual', 1, NULL, '2026-04-04 21:26:56');

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
  `image` varchar(500) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL COMMENT 'References course_management.id',
  `academic_year` year(4) DEFAULT NULL,
  `promotion_date` date DEFAULT NULL,
  `previous_program_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `user_id`, `studentID`, `contact_number`, `image`, `program_id`, `academic_year`, `promotion_date`, `previous_program_id`) VALUES
(61, 94, '12342', NULL, '', 1, NULL, NULL, NULL),
(62, 95, '78153', NULL, 'https://res.cloudinary.com/dgkugadfe/image/upload/v1775247305/feedbacts/profiles/alumni/6429fd44-2715-4918-b7e0-62ffbe36f6c0.jpg', 1, NULL, '2026-03-31', NULL),
(63, 96, '31758', NULL, '/uploads/profiles/students/68bc083b-187f-4970-be83-89111f8d590d.jpg', NULL, NULL, '2026-03-27', NULL),
(64, 97, '27891', NULL, NULL, NULL, NULL, '2026-03-26', NULL),
(65, 98, '61863', NULL, NULL, NULL, NULL, '2026-03-31', 2),
(66, 99, '19497', NULL, '/uploads/profiles/students/edea98e5-8a0b-4474-af28-938e54ffa596.jpg', NULL, NULL, '2026-03-26', NULL),
(67, 100, '64916', NULL, '/uploads/profiles/students/8050b8c6-4ec2-4d5e-bf0a-639e08eeb7f9.jpg', NULL, NULL, '2026-03-25', NULL),
(68, 101, '11135', '09108978571', NULL, 1, NULL, NULL, NULL),
(69, 102, '46194', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(70, 103, '41864', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(71, 104, '12644', NULL, NULL, 1, NULL, NULL, NULL),
(72, 105, '47070', NULL, NULL, 1, NULL, NULL, NULL),
(73, 106, '46164', NULL, NULL, NULL, NULL, '2026-03-28', NULL),
(74, 107, '44618', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(75, 108, '46916', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(76, 109, '46196', NULL, NULL, NULL, NULL, '2026-03-30', NULL),
(77, 110, '13718', NULL, NULL, 1, NULL, NULL, NULL),
(78, 111, '42515', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(80, 113, '46196', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(81, 114, '70711', NULL, NULL, 1, NULL, NULL, NULL),
(82, 115, '01741', NULL, NULL, NULL, NULL, '2026-03-27', NULL),
(83, 116, '70174', NULL, '/uploads/profiles/students/5e694d1d-2250-406c-9ef7-ee1ee9d43671.jpg', NULL, NULL, '2026-03-28', NULL),
(84, 117, '71641', NULL, NULL, NULL, NULL, '2026-03-31', NULL),
(85, 118, '10410', NULL, NULL, 1, NULL, NULL, NULL),
(86, 119, '18417', NULL, NULL, 1, NULL, NULL, NULL),
(87, 120, '16491', NULL, '/uploads/profiles/students/522eedb2-41b0-42e2-8b27-1c28434646d6.jpg', 1, NULL, NULL, NULL),
(88, 121, '71074', NULL, NULL, NULL, NULL, '2026-03-28', NULL),
(89, 122, '31415', NULL, NULL, 1, NULL, NULL, NULL),
(90, 123, '14107', NULL, NULL, 1, NULL, NULL, NULL),
(91, 124, '41704', NULL, NULL, NULL, NULL, '2026-03-28', NULL),
(107, 158, NULL, '', NULL, NULL, NULL, '2026-03-21', NULL),
(108, 163, NULL, '', NULL, 1, NULL, NULL, NULL),
(109, 164, NULL, '', NULL, 1, NULL, NULL, NULL),
(110, 165, NULL, '', NULL, 1, NULL, NULL, NULL),
(111, 166, NULL, '', NULL, 4, NULL, NULL, NULL),
(113, 174, NULL, '', NULL, 5, NULL, NULL, NULL),
(114, 175, NULL, '', 'https://res.cloudinary.com/dgkugadfe/image/upload/v1775246727/feedbacts/profiles/student/7cb359b9-52a4-40bf-b871-e4477988269b.jpg', 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_promotion_history`
--

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

--
-- Dumping data for table `student_promotion_history`
--

INSERT INTO `student_promotion_history` (`id`, `student_id`, `user_id`, `previous_program_id`, `new_program_id`, `promotion_type`, `promotion_date`, `promoted_by`, `notes`, `created_at`) VALUES
(9, 65, 98, 2, 1, 'academic_year', '2026-03-20', 1, '4th year ka na yah', '2026-03-20 15:37:39'),
(10, 107, 158, 15, NULL, 'graduation', '2026-03-21', 1, 'Graduated', '2026-03-20 16:04:55'),
(11, 67, 100, 1, NULL, 'graduation', '2026-03-25', 1, 'Graduated', '2026-03-25 10:52:44'),
(12, 64, 97, 1, NULL, 'graduation', '2026-03-26', 1, 'Graduated', '2026-03-26 03:18:54'),
(13, 66, 99, 1, NULL, 'graduation', '2026-03-26', 1, 'Graduated', '2026-03-26 06:46:40'),
(14, 78, 111, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 18:54:06'),
(15, 75, 108, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 20:50:13'),
(16, 82, 115, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 21:08:15'),
(17, 69, 102, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 21:20:29'),
(18, 80, 113, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 21:40:11'),
(19, 63, 96, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 21:53:15'),
(20, 74, 107, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-26 22:12:23'),
(21, 70, 103, 1, NULL, 'graduation', '2026-03-27', 1, 'Graduated', '2026-03-27 14:32:46'),
(22, 73, 106, 1, NULL, 'graduation', '2026-03-28', 1, 'Graduated', '2026-03-27 17:30:08'),
(23, 91, 124, 1, NULL, 'graduation', '2026-03-28', 1, 'Graduated', '2026-03-27 19:47:24'),
(24, 83, 116, 1, NULL, 'graduation', '2026-03-28', 1, 'Graduated', '2026-03-27 19:48:50'),
(25, 88, 121, 1, NULL, 'graduation', '2026-03-28', 1, 'Graduated', '2026-03-28 04:41:06'),
(26, 76, 109, 1, NULL, 'graduation', '2026-03-30', 1, 'Graduated', '2026-03-29 23:42:15'),
(27, 84, 117, 1, NULL, 'graduation', '2026-03-31', 1, 'Graduated', '2026-03-31 00:55:06'),
(28, 62, 95, 1, NULL, 'graduation', '2026-03-31', 1, 'Graduated', '2026-03-31 01:00:35'),
(29, 65, 98, 1, NULL, 'graduation', '2026-03-31', 1, 'Graduated', '2026-03-31 01:50:59');

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
-- Table structure for table `subject_feedback`
--

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
  `archived_at` timestamp NULL DEFAULT NULL,
  `academic_period_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject_feedback`
--

INSERT INTO `subject_feedback` (`id`, `student_id`, `subject_id`, `section_id`, `instructor_id`, `academic_year`, `semester`, `responses`, `overall_rating`, `submitted_at`, `category_averages`, `archived`, `archived_at`, `academic_period_id`) VALUES
(24, 123, 45, 69, 152, '2025-2026', '3th', '{\"72\":5,\"73\":5,\"74\":5,\"75\":5,\"76\":5,\"77\":5,\"78\":5,\"79\":5,\"80\":5,\"81\":5,\"82\":5,\"83\":5,\"84\":5,\"85\":5,\"86\":5,\"87\":5,\"88\":5,\"89\":5,\"90\":5,\"91\":5,\"92\":5,\"93\":5,\"94\":5,\"95\":5,\"96\":5,\"97\":5,\"98\":5,\"99\":5,\"100\":5,\"101\":5,\"102\":5,\"103\":5,\"104\":5}', 5.00, '2026-04-04 21:24:37', '{\"64\":{\"name\":\"Course Content\",\"average\":5,\"count\":5,\"questions\":{\"72\":5,\"73\":5,\"74\":5,\"75\":5,\"76\":5}},\"65\":{\"name\":\"Learning Outcomes\",\"average\":5,\"count\":4,\"questions\":{\"77\":5,\"78\":5,\"79\":5,\"80\":5}},\"66\":{\"name\":\"Learning Materials\",\"average\":5,\"count\":4,\"questions\":{\"81\":5,\"82\":5,\"83\":5,\"84\":5}},\"67\":{\"name\":\"Assessments\",\"average\":5,\"count\":4,\"questions\":{\"85\":5,\"86\":5,\"87\":5,\"88\":5}},\"68\":{\"name\":\"Workload & Difficulty\",\"average\":5,\"count\":4,\"questions\":{\"89\":5,\"90\":5,\"91\":5,\"92\":5}},\"69\":{\"name\":\"Practical Application\",\"average\":5,\"count\":4,\"questions\":{\"93\":5,\"94\":5,\"95\":5,\"96\":5}},\"70\":{\"name\":\"Course Structure & Delivery\",\"average\":5,\"count\":4,\"questions\":{\"97\":5,\"98\":5,\"99\":5,\"100\":5}},\"71\":{\"name\":\"Overall Evaluation\",\"average\":5,\"count\":4,\"questions\":{\"101\":5,\"102\":5,\"103\":5,\"104\":5}},\"overall\":{\"average\":5,\"count\":33}}', 1, '2026-04-04 21:26:52', 81),
(25, 123, 45, 71, 152, '2025-2026', '1st', '{\"72\":5,\"73\":5,\"74\":5,\"75\":5,\"76\":5,\"77\":5,\"78\":5,\"79\":5,\"80\":5,\"81\":5,\"82\":5,\"83\":5,\"84\":5,\"85\":5,\"86\":5,\"87\":5,\"88\":5,\"89\":5,\"90\":5,\"91\":5,\"92\":5,\"93\":5,\"94\":5,\"95\":5,\"96\":5,\"97\":5,\"98\":5,\"99\":5,\"100\":5,\"101\":5,\"102\":5,\"103\":5,\"104\":5}', 5.00, '2026-04-05 06:09:44', '{\"64\":{\"name\":\"Course Content\",\"average\":5,\"count\":5,\"questions\":{\"72\":5,\"73\":5,\"74\":5,\"75\":5,\"76\":5}},\"65\":{\"name\":\"Learning Outcomes\",\"average\":5,\"count\":4,\"questions\":{\"77\":5,\"78\":5,\"79\":5,\"80\":5}},\"66\":{\"name\":\"Learning Materials\",\"average\":5,\"count\":4,\"questions\":{\"81\":5,\"82\":5,\"83\":5,\"84\":5}},\"67\":{\"name\":\"Assessments\",\"average\":5,\"count\":4,\"questions\":{\"85\":5,\"86\":5,\"87\":5,\"88\":5}},\"68\":{\"name\":\"Workload & Difficulty\",\"average\":5,\"count\":4,\"questions\":{\"89\":5,\"90\":5,\"91\":5,\"92\":5}},\"69\":{\"name\":\"Practical Application\",\"average\":5,\"count\":4,\"questions\":{\"93\":5,\"94\":5,\"95\":5,\"96\":5}},\"70\":{\"name\":\"Course Structure & Delivery\",\"average\":5,\"count\":4,\"questions\":{\"97\":5,\"98\":5,\"99\":5,\"100\":5}},\"71\":{\"name\":\"Overall Evaluation\",\"average\":5,\"count\":4,\"questions\":{\"101\":5,\"102\":5,\"103\":5,\"104\":5}},\"overall\":{\"average\":5,\"count\":33}}', 0, NULL, 89),
(26, 122, 45, 71, 152, '2025-2026', '1st', '{\"72\":1,\"73\":1,\"74\":1,\"75\":1,\"76\":1,\"77\":1,\"78\":1,\"79\":1,\"80\":1,\"81\":1,\"82\":1,\"83\":1,\"84\":1,\"85\":1,\"86\":1,\"87\":1,\"88\":1,\"89\":1,\"90\":1,\"91\":1,\"92\":1,\"93\":1,\"94\":1,\"95\":1,\"96\":1,\"97\":1,\"98\":1,\"99\":1,\"100\":1,\"101\":1,\"102\":1,\"103\":1,\"104\":1}', 1.00, '2026-04-05 06:11:26', '{\"64\":{\"name\":\"Course Content\",\"average\":1,\"count\":5,\"questions\":{\"72\":1,\"73\":1,\"74\":1,\"75\":1,\"76\":1}},\"65\":{\"name\":\"Learning Outcomes\",\"average\":1,\"count\":4,\"questions\":{\"77\":1,\"78\":1,\"79\":1,\"80\":1}},\"66\":{\"name\":\"Learning Materials\",\"average\":1,\"count\":4,\"questions\":{\"81\":1,\"82\":1,\"83\":1,\"84\":1}},\"67\":{\"name\":\"Assessments\",\"average\":1,\"count\":4,\"questions\":{\"85\":1,\"86\":1,\"87\":1,\"88\":1}},\"68\":{\"name\":\"Workload & Difficulty\",\"average\":1,\"count\":4,\"questions\":{\"89\":1,\"90\":1,\"91\":1,\"92\":1}},\"69\":{\"name\":\"Practical Application\",\"average\":1,\"count\":4,\"questions\":{\"93\":1,\"94\":1,\"95\":1,\"96\":1}},\"70\":{\"name\":\"Course Structure & Delivery\",\"average\":1,\"count\":4,\"questions\":{\"97\":1,\"98\":1,\"99\":1,\"100\":1}},\"71\":{\"name\":\"Overall Evaluation\",\"average\":1,\"count\":4,\"questions\":{\"101\":1,\"102\":1,\"103\":1,\"104\":1}},\"overall\":{\"average\":1,\"count\":33}}', 0, NULL, 89);

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

-- --------------------------------------------------------

--
-- Table structure for table `subject_offerings`
--

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
  `total_feedbacks` int(11) DEFAULT 0,
  `academic_period_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subject_offerings`
--

INSERT INTO `subject_offerings` (`id`, `subject_id`, `program_id`, `year_level`, `section`, `academic_year`, `semester`, `instructor_id`, `status`, `created_at`, `updated_at`, `total_feedbacks`, `academic_period_id`) VALUES
(69, 45, 1, 4, 'B', '2025-2026', 'Summer', 152, 'archived', '2026-04-04 21:23:37', '2026-04-04 21:26:52', 0, 81),
(70, 44, 6, 11, 'FAITH', '2025-2026', '1st', 152, 'archived', '2026-04-04 21:23:47', '2026-04-04 21:26:56', 0, 84),
(71, 45, 1, 4, 'B', '2025-2026', '1st', 152, 'active', '2026-04-05 06:00:24', '2026-04-05 06:00:24', 0, 89);

-- --------------------------------------------------------

--
-- Table structure for table `subject_sections`
--

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
(94, 'badinas@gmail.com', '$2a$12$eq30nZhuQpiS5rpBknZzHuZCtPBQb0LEuQaXDtKF0JfK6AifNxwd6', 'Jonard A. Badinas', 'alumni', '2026-01-29 18:54:40', 'active'),
(95, 'rialox07@gmail.com', '$2a$12$06YIDhf731u3fzfSMhr3SugU0gsFbCeYQJy7CsIejLLSAah22hum.', 'Angelito O.  Brosas Jr.', 'alumni', '2026-01-29 18:55:45', 'active'),
(96, 'dausin@gmail.com', '$2a$12$borBfdDtGHjiDzKDHC8o9OIm6Gr93tt6uSvQNw2sqpiiRoz6uNOpS', 'Emmanuel M. Dausin', 'alumni', '2026-01-29 18:56:26', 'active'),
(97, 'karunungan@gmail.com', '$2a$12$C5r79wYHtW/g.Gtk6PuZ5Ox2VsR2Hj0HyJEe2udSYO3VJv.TUBJpy', 'Micah C. Karunungan', 'alumni', '2026-01-29 18:57:16', 'active'),
(98, 'lacandula@gmail.com', '$2a$12$hKRCVQ1feRo8GWuNkghl1uwbXfRTeUzA2Y95kvH9avRLz36yAkvF2', 'Althea Mae A. Lacandula', 'alumni', '2026-01-29 18:58:22', 'active'),
(99, 'maneja@gmail.com', '$2a$12$ERXkw0pTPeCKljzQrUPPBeyEzTmrqEcq9pre2Y1doIsv3N5t8Frn6', 'John Henry A. Maneja', 'alumni', '2026-01-29 18:59:17', 'active'),
(100, 'marciano@gmail.com', '$2a$12$9IdtmG1QIXuaMVn70/4LDO9LoHITnUMYbPugoijN7aY1SAlmp1BMG', 'Ralph Georges L. Marciano', 'alumni', '2026-01-29 19:00:04', 'active'),
(101, 'melicio@gmail.com', '$2a$12$4fTghkQzSAMqro8QjnkrxupcGf7PVvOhe9zLOdLe6.ocoSiozLokO', 'Gerald O. Melicio', 'alumni', '2026-01-29 19:00:40', 'active'),
(102, 'merle@gmail.com', '$2a$12$YQdMiy4I1i0Aa1faoPIjXeyzObXGiLXuuJJjzBw6GDz3ZyVUbO3My', 'Ghiezel A. Merle', 'alumni', '2026-01-29 19:01:18', 'active'),
(103, 'molina@gmail.com', '$2a$12$fL7b6olYcZzJ1hmixGB1d.yJSkIBjmBmZs81mFTJsUY5qA51fKopq', 'Carl Justin Molina', 'alumni', '2026-01-29 19:01:55', 'active'),
(104, 'montes@gmail.com', '$2a$12$4hEMYETIzESPxrR5A5IFTeG5yHgRPEDzs/dpjDUGn2MIELF3NG6Ma', 'Ryan Timothy I. Montes', 'alumni', '2026-01-29 19:02:38', 'active'),
(105, 'montesena@gmail.com', '$2a$12$dhjn1/x7mZ/eJvl7Sf9xbeTb81exYT6e3txFJtEOxYJZ5rjPbKHEW', 'Babe Louise M. Monteseña', 'student', '2026-01-29 19:03:17', 'active'),
(106, 'palconan@gmail.com', '$2a$12$WPJSSO8Ol5VoGGV1jsZLDuTfos4q/gTLkYRhk8/67MaCTpazoOpl2', 'Ronald Joseph C. Palconan', 'alumni', '2026-01-29 19:03:56', 'active'),
(107, 'ramirez@gmail.com', '$2a$12$Z4bR1H32G/u2MTTk7CUBreiMsby0BuDkykja85M1m0I/Li1vJZl8m', 'Mark Aldrin C. Ramirez', 'alumni', '2026-01-29 19:04:37', 'active'),
(108, 'ramos@gmail.com', '$2a$12$B0/knZ3ktdKMQ/AXzkZet..1GVTyAjCmOjmR6U47DAuDIzEJLQf.u', 'Kent Jerone L. Ramos', 'alumni', '2026-01-29 19:05:07', 'active'),
(109, 'reparip@gmail.com', '$2a$12$LYMqX9nFNL0FikipFhX8P.i7VZepY5UbMuONBkGPqlMvmLOdAs2g6', 'John Paul G. Reparip', 'alumni', '2026-01-29 19:05:46', 'active'),
(110, 'reyes@gmail.com', '$2a$12$K8WVF1j0LUzPekyb1KsGfunzSiNLu2awvNgMgVoxPlXj/27tWkx1C', 'Rafhael Ronn C. Reyes', 'student', '2026-01-29 19:06:35', 'active'),
(111, 'romulo@gmail.com', '$2a$12$uFVLXxekPtPVDfTf1lp4N.Ice4ixyLvqSEceSkTJbdwYqU32CCAE6', 'Lyle D. Romulo', 'alumni', '2026-01-29 19:07:09', 'active'),
(113, 'sanchez@gmail.com', '$2a$12$Jk6Lbyl2nh7fR2m6zza7CuiOozL4aCMvAmhYhP6h7f0XKBkd/s/TO', 'Kean Raphael A. Sanchez', 'alumni', '2026-01-29 19:08:23', 'active'),
(114, 'romana@gmail.com', '$2a$12$ShkfNAVFq/QdDSIBh3ZaJOl6AO3Jly27RG.abMcpmsqRX7S4nitXW', 'John Luiz C. Sta. Romana', 'alumni', '2026-01-29 19:09:03', 'active'),
(115, 'tabane@gmail.com', '$2a$12$2nbKlrdD9mbDX5TChgaFWOHK4G/DN5Xz0U3hgZr81A/a90arjZ..e', 'Jerrlyn B. Tabane', 'alumni', '2026-01-29 19:09:46', 'active'),
(116, 'piel@gmail.com', '$2a$12$N6J0SvAEshwWreJD80BwVeaRtP56hVzDOqnvumfkPuJdWQx6FIsM.', 'Amanda Piel L. Tajan', 'alumni', '2026-01-29 19:10:26', 'active'),
(117, 'teng@gmail.com', '$2a$12$ZHFFmfDqmPQBYmrhvsS67Oks8vOfvSKWKMfC2J5yjEVXshspVZoX2', 'Kimberly R. Teng', 'alumni', '2026-01-29 19:11:05', 'active'),
(118, 'valencia@gmail.com', '$2a$12$14w2zDKbQwkrVkxTtJ6J0umgm9F8zLRgmscGJicEEe5f1TCiNpZ1e', 'Jaime S. Valencia Jr.', 'student', '2026-01-29 19:11:49', 'active'),
(119, 'vente@gmail.com', '$2a$12$bUow6xY43gn1vhqdFYBcIOXNORv/Ue4599jWtzwHLJuuDRA/vNR.6', 'Mark Venzer A. Vente', 'student', '2026-01-29 19:12:32', 'active'),
(120, 'rox9evt@gmail.com', '$2a$12$kbtiZFUUzK1Pstjud285v.8QInwsm5J9lQzpRr.Bu53kZbCGbd7Pe', 'John Angelo M. Ventura', 'student', '2026-01-29 19:13:06', 'active'),
(121, 'victoriano@gmail.com', '$2a$12$FQIy84UHt8rOSHlJz965qeCndPqimgmYQi/w2ZCh5S55Ah9f8ugUO', 'Per Jansen M. Victoriano', 'alumni', '2026-01-29 19:13:39', 'active'),
(122, 'villanuevag@gmail.com', '$2a$12$xFPN16FEH/kN4Py.ydBQXuj27KbiqEDS5FeX.pwoWd/NZoXqFh./K', 'Ashe Mae M. Villanueva', 'student', '2026-01-29 19:14:20', 'active'),
(123, 'villanuevab@gmail.com', '$2a$12$yfEnmOr00vzj6YOVfKP.Se3HwuhXLevLdUqtgjzHowqeUHWmPn0lq', 'Christian C. Villanueva', 'student', '2026-01-29 19:15:13', 'active'),
(124, 'jc@gmail.com', '$2a$12$NpMcEwRYq0ypHvU5wCjY/OaPYq8qK5v5P/O9jqEqPqvBQJ5Y5Y5Y5Y5', 'Jc D. Yasoña', 'alumni', '2026-01-29 19:15:51', 'active'),
(150, 'demo@gmail.com', '$2a$12$Uv48DBqvfZiPm09HddN2u.ap.d5YQwEpbZXKJH1cLX0CP5mlj307i', 'Mr. Ariel M. Tobias Jr.', 'instructor', '2026-03-01 15:36:46', 'active'),
(152, 'dean@gmail.com', '$2a$12$mwhoar738MtySfC2qH29GenOSLLV65/99idWBdDAgorJGNOiU9y/2', 'Dr. Adoree A. Ramos', 'instructor', '2026-03-01 15:43:13', 'active'),
(158, 'too@gmail.com', '$2a$12$ISB81L5utLNjZwZHQIGoSOJS1XyrUc0PZRHQ7D.3WfbFnqLJsNwOO', 'Gerald Too', 'alumni', '2026-03-10 21:39:40', 'active'),
(160, 'alumnitest@gmail.com', '$2a$12$qhjvdSzqxDPsm.GEbIwbVOTVpIXcLqjQiBsFD.TpmfCjH4667WopG', 'Test Alumni', 'alumni', '2026-03-17 01:06:10', 'active'),
(161, 'alu@gmail.com', '$2a$12$3ted0IMYU/xoIaQB2ZkKTu8q1qdC/LP62/jnJbPWo8ydJmgyTRH.S', 'Alum Ni', 'alumni', '2026-03-17 01:07:03', 'active'),
(163, 'geraldmelicio.it@gmail.com', '$2a$12$0hM/pVcUZ3CNA0FhNaf0f.7nlAkly.9MXRFjYT79gIU3sPqeQOyc.', 'Geral Melcio', 'alumni', '2026-03-17 04:45:13', 'active'),
(164, 'one@gmail.com', '$2a$12$UYGU9b2XmhdBT825YEfyFutehkqNz6.iKw580UsXwYXGYrsIEwyeG', 'Studentw One', 'alumni', '2026-03-17 05:32:33', 'active'),
(165, 'juan@gmail.com', '$2a$12$PecHtPnm2XA64IDB9FdDNODp3XfRK26INmPPRWb46.9aUSyk/lLjm', 'Juan Del', 'alumni', '2026-03-17 07:48:03', 'active'),
(166, 'etst@gmail.com', '$2a$12$ZWzprkpV.fMENwOQ55Y0QuGHLqevaZuVofiUI0ZA/1CBYW1xn0BhO', 'Test Tes Tes', 'student', '2026-03-17 09:00:19', 'active'),
(171, 'one1@gmail.com', '$2a$12$XapoFPEDn0SjZydbrLTQ..mQXOiD3roTLA2oBfa8W7Q6FnHQkpDjS', 'Instructor One', 'instructor', '2026-03-22 09:41:44', 'active'),
(172, 'two2@gmail.com', '$2a$12$mtAX3cZr245F2U0xOxGTYOEoSD50m5acGo2mLd6PsJprxUZP9RPTm', 'Instructor Twow', 'instructor', '2026-03-22 09:42:30', 'active'),
(173, 'three3@gmail.com', '$2a$12$IlXf4FuFWVbd3BTW5xkui.pw00f15OfhW4KyAOF8m1Vs7LzCtDHLW', 'Instructor Three', 'instructor', '2026-03-22 09:43:02', 'active'),
(174, 'xample@gmail.com', '$2a$12$Mi/A212VsZy./osy5AtMwOqdXIYtnbvKMqU5suIR1tWpmqAMO2Wsy', 'Senior High', 'student', '2026-03-25 04:52:32', 'active'),
(175, 'mageaccfrsl1@gmail.com', '$2a$12$F18UGXPTzariBe13RCCyku0BfOTTHw0uOYaZD6ENMaqawpT.llCRu', 'Two Dela', 'student', '2026-04-03 20:05:02', 'active');

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_periods`
--
ALTER TABLE `academic_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_academic_year` (`academic_year`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- Indexes for table `alumni`
--
ALTER TABLE `alumni`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `alumni_employment`
--
ALTER TABLE `alumni_employment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `alumni_user_id` (`alumni_user_id`),
  ADD KEY `idx_employment_update_tracking` (`last_update_sent`,`last_update_received`),
  ADD KEY `idx_employment_tracker_status` (`update_status`,`next_email_date`),
  ADD KEY `idx_employment_graduation_date` (`graduation_date`);

--
-- Indexes for table `alumni_employment_history`
--
ALTER TABLE `alumni_employment_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_alumni_user_id` (`alumni_user_id`),
  ADD KEY `idx_is_current` (`is_current`);

--
-- Indexes for table `course_management`
--
ALTER TABLE `course_management`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employers`
--
ALTER TABLE `employers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `employment_update_queue`
--
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
-- Indexes for table `feedback_invitations`
--
ALTER TABLE `feedback_invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `form_id` (`form_id`),
  ADD KEY `expires_at` (`expires_at`),
  ADD KEY `used` (`used`);

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
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_instructor_feedback_academic_period` (`academic_period_id`);

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
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_subject_feedback_academic_period` (`academic_period_id`);

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
  ADD KEY `idx_academic` (`academic_year`,`semester`),
  ADD KEY `idx_subject_offerings_academic_period` (`academic_period_id`);

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

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_periods`
--
ALTER TABLE `academic_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `alumni`
--
ALTER TABLE `alumni`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `alumni_employment`
--
ALTER TABLE `alumni_employment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `alumni_employment_history`
--
ALTER TABLE `alumni_employment_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `employment_update_queue`
--
ALTER TABLE `employment_update_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `evaluation_forms`
--
ALTER TABLE `evaluation_forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluation_periods`
--
ALTER TABLE `evaluation_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `evaluation_subjects`
--
ALTER TABLE `evaluation_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `feedback_invitations`
--
ALTER TABLE `feedback_invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback_template_categories`
--
ALTER TABLE `feedback_template_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT for table `forms`
--
ALTER TABLE `forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=611;

--
-- AUTO_INCREMENT for table `form_assignments`
--
ALTER TABLE `form_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3497;

--
-- AUTO_INCREMENT for table `form_categories`
--
ALTER TABLE `form_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `form_deployments`
--
ALTER TABLE `form_deployments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=215;

--
-- AUTO_INCREMENT for table `form_responses`
--
ALTER TABLE `form_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT for table `graduation_records`
--
ALTER TABLE `graduation_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `instructors`
--
ALTER TABLE `instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `instructor_courses`
--
ALTER TABLE `instructor_courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `instructor_feedback`
--
ALTER TABLE `instructor_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `notificationemails`
--
ALTER TABLE `notificationemails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=236;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2005;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2386;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `semester_reset_log`
--
ALTER TABLE `semester_reset_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `shared_responses`
--
ALTER TABLE `shared_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `student_promotion_history`
--
ALTER TABLE `student_promotion_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `subject_evaluation_responses`
--
ALTER TABLE `subject_evaluation_responses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_feedback`
--
ALTER TABLE `subject_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `subject_instructors`
--
ALTER TABLE `subject_instructors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `subject_sections`
--
ALTER TABLE `subject_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `subject_students`
--
ALTER TABLE `subject_students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alumni`
--
ALTER TABLE `alumni`
  ADD CONSTRAINT `alumni_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `alumni_employment`
--
ALTER TABLE `alumni_employment`
  ADD CONSTRAINT `alumni_employment_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `alumni_employment_history`
--
ALTER TABLE `alumni_employment_history`
  ADD CONSTRAINT `alumni_employment_history_ibfk_1` FOREIGN KEY (`alumni_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `feedback_invitations`
--
ALTER TABLE `feedback_invitations`
  ADD CONSTRAINT `feedback_invitations_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `forms` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_instructor_feedback_academic_period` FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`) ON DELETE SET NULL,
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
  ADD CONSTRAINT `fk_subject_feedback_academic_period` FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`) ON DELETE SET NULL,
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
-- Constraints for table `subject_offerings`
--
ALTER TABLE `subject_offerings`
  ADD CONSTRAINT `fk_subject_offerings_academic_period` FOREIGN KEY (`academic_period_id`) REFERENCES `academic_periods` (`id`) ON DELETE SET NULL;

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
