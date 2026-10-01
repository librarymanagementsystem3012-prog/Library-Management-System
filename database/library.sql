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
-- Sample Data Insertion
-- ==========================================================

-- Insert Sample Books
INSERT INTO `books` (`id`, `book_name`, `author`, `category`, `total_quantity`, `available_quantity`, `issued_quantity`) VALUES
(1, 'Java Programming', 'James Gosling & Herbert Schildt', 'Computer Science', 10, 8, 2),
(2, 'React JS - Modern Web Development', 'Dan Abramov & Sophie Alpert', 'Web Development', 8, 7, 1),
(3, 'Spring Boot in Action', 'Craig Walls', 'Backend Development', 6, 6, 0),
(4, 'Python Programming: A Modern Approach', 'Guido van Rossum & John Zelle', 'Data Science & AI', 12, 11, 1),
(5, 'Database Management Systems', 'Raghu Ramakrishnan & Johannes Gehrke', 'Database Systems', 15, 14, 1),
(6, 'Operating System Concepts', 'Abraham Silberschatz & Peter Baer Galvin', 'Computer Science', 7, 7, 0),
(7, 'Computer Networks', 'Andrew S. Tanenbaum', 'Networking', 9, 9, 0),
(8, 'Data Structures and Algorithms in C++', 'Adam Drozdek', 'Algorithms', 10, 10, 0);

-- Insert Sample Students
INSERT INTO `students` (`id`, `student_name`, `email`, `phone_number`) VALUES
(1, 'Swetha Sharma', 'swetha@example.com', '9876543210'),
(2, 'Rahul Verma', 'rahul.verma@example.com', '9812345678'),
(3, 'Priya Patel', 'priya.patel@example.com', '9898765432'),
(4, 'Ananya Roy', 'ananya.roy@example.com', '9711223344'),
(5, 'Vikram Singh', 'vikram.singh@example.com', '9655443322');

-- Insert Sample Issues (including an overdue one for testing fine calculation)
INSERT INTO `issues` (`id`, `student_id`, `book_id`, `issue_date`, `due_date`, `return_date`, `status`, `fine`) VALUES
(1, 1, 1, '2026-09-10', '2026-09-24', NULL, 'Issued', 0.00), -- Overdue active issue
(2, 2, 2, '2026-09-20', '2026-09-29', NULL, 'Issued', 0.00), -- Approaching due date
(3, 3, 4, '2026-09-22', '2026-10-06', NULL, 'Issued', 0.00), -- Active issue
(4, 4, 5, '2026-09-23', '2026-10-07', NULL, 'Issued', 0.00), -- Active issue
(5, 5, 1, '2026-09-01', '2026-09-15', '2026-09-18', 'Returned', 150.00); -- Past returned with ₹150 fine (3 days overdue)

-- Insert Sample Notifications
INSERT INTO `notifications` (`id`, `student_id`, `issue_id`, `email`, `notification_type`, `subject`, `message`, `status`, `sent_at`) VALUES
(1, 1, 1, 'swetha@example.com', 'Book Issued', 'Library Book Issued - Java Programming', 'Dear Swetha Sharma,\n\nThe following book has been issued to you:\n\nBook: Java Programming\nAuthor: James Gosling & Herbert Schildt\nIssue Date: 2026-09-10\nDue Date: 2026-09-24\n\nPlease return the book on or before the due date.\n\nThank you,\nLibrary Management System', 'Sent', '2026-09-10 10:00:00'),
(2, 2, 2, 'rahul.verma@example.com', 'Book Issued', 'Library Book Issued - React JS - Modern Web Development', 'Dear Rahul Verma,\n\nThe following book has been issued to you:\n\nBook: React JS - Modern Web Development\nAuthor: Dan Abramov & Sophie Alpert\nIssue Date: 2026-09-20\nDue Date: 2026-09-29\n\nPlease return the book on or before the due date.\n\nThank you,\nLibrary Management System', 'Sent', '2026-09-20 11:30:00'),
(3, 5, 5, 'vikram.singh@example.com', 'Book Returned', 'Library Book Returned - Java Programming', 'Dear Vikram Singh,\n\nYour book has been successfully returned.\n\nBook: Java Programming\nReturn Date: 2026-09-18\nDue Date: 2026-09-15\nFine: ₹150.00\n\nThank you,\nLibrary Management System', 'Sent', '2026-09-18 15:45:00');
