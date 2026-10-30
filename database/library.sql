-- ==========================================================
-- Library Management System Database Schema & Initial Data
-- B.Tech CSE College Project
-- Database: library_management
-- ==========================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `library_management` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `library_management`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Drop existing tables if re-importing
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `issues`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `books`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- Table 1: books
-- ==========================================================
CREATE TABLE `books` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `book_name` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `total_quantity` INT NOT NULL DEFAULT 1,
  `available_quantity` INT NOT NULL DEFAULT 1,
  `issued_quantity` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_book_name` (`book_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table 2: students
-- ==========================================================
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone_number` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_student_name` (`student_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table 3: issues
-- ==========================================================
CREATE TABLE `issues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `book_id` INT NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `return_date` DATE NULL DEFAULT NULL,
  `status` ENUM('Issued', 'Returned') NOT NULL DEFAULT 'Issued',
  `fine` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_due_date` (`due_date`),
  CONSTRAINT `fk_issues_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_issues_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table 4: notifications
-- ==========================================================
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NULL,
  `issue_id` INT NULL,
  `email` VARCHAR(255) NOT NULL,
  `notification_type` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('Sent', 'Failed', 'Pending') NOT NULL DEFAULT 'Sent',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_type` (`notification_type`),
  INDEX `idx_notif_status` (`status`),
  CONSTRAINT `fk_notifications_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_issue` FOREIGN KEY (`issue_id`) REFERENCES `issues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Initial Library Books Data
-- ==========================================================

-- Insert Books Catalog (Available quantity equals total quantity initially)
INSERT INTO `books` (`id`, `book_name`, `author`, `category`, `total_quantity`, `available_quantity`, `issued_quantity`) VALUES
(1, 'Java Programming', 'James Gosling & Herbert Schildt', 'Computer Science', 10, 10, 0),
(2, 'React JS - Modern Web Development', 'Dan Abramov & Sophie Alpert', 'Web Development', 8, 8, 0),
(3, 'Spring Boot in Action', 'Craig Walls', 'Backend Development', 6, 6, 0),
(4, 'Python Programming: A Modern Approach', 'Guido van Rossum & John Zelle', 'Data Science & AI', 12, 12, 0),
(5, 'Database Management Systems', 'Raghu Ramakrishnan & Johannes Gehrke', 'Database Systems', 15, 15, 0),
(6, 'Operating System Concepts', 'Abraham Silberschatz & Peter Baer Galvin', 'Computer Science', 7, 7, 0),
(7, 'Computer Networks', 'Andrew S. Tanenbaum', 'Networking', 9, 9, 0),
(8, 'Data Structures and Algorithms in C++', 'Adam Drozdek', 'Algorithms', 10, 10, 0);
