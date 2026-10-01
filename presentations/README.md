# 📚 Library Management System (B.Tech CSE College Project)

A complete, production-grade **Library Management System** built with **React.js, Node.js/Express, MySQL, and Nodemailer (Gmail SMTP)**. Engineered specifically as a major capstone/final-year B.Tech Computer Science & Engineering project featuring end-to-end CRUD operations, inventory management, circulation (book issue/return), automated overdue fine calculation (₹50/day), student email records, and automatic email notifications.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Project Folder Structure](#-project-folder-structure)
5. [Database Schema (MySQL)](#-database-schema-mysql)
6. [Prerequisites & System Setup](#-prerequisites--system-setup)
7. [MySQL Database Setup](#-mysql-database-setup)
8. [Backend Configuration & Setup](#-backend-configuration--setup)
9. [Gmail App Password Setup (Nodemailer)](#-gmail-app-password-setup-nodemailer)
10. [Frontend Configuration & Setup](#-frontend-configuration--setup)
11. [How to Run the Application](#-how-to-run-the-application)
12. [Complete REST API Reference](#-complete-rest-api-reference)
13. [Fine Calculation Algorithm](#-fine-calculation-algorithm)
14. [Automated Email Reminder System](#-automated-email-reminder-system)
15. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🌟 Project Overview

The **Library Management System** modernizes institutional college library workflows. It eliminates paper registers and manual spreadsheet calculations by storing all catalog titles, student records, circulation transactions, and communication logs in a structured relational MySQL database.

The system automatically alerts students via Gmail SMTP when books are issued, delivers return receipts with fine summaries upon check-in, and runs automated daily background jobs to notify students whose due dates are approaching tomorrow or are overdue.

---

## ✨ Key Features

- **🔐 Librarian Authentication**: Secure credential validation for library administrative staff with protected dashboard routing.
- **📊 Dynamic Analytics Dashboard**:
  - Live metric cards: Total Books, Available Books, Issued Books, Categories, and Overdue Books.
  - Interactive Chart.js visual charts: Availability Ratio Doughnut, Subject Category Volume Bar Chart, and Monthly Issue vs Return Trends.
- **📚 Book Inventory CRUD**:
  - Add new book titles with automated inventory initialization (`total_quantity`, `available_quantity`, `issued_quantity = 0`).
  - Search by title, author, or subject keyword with category filtering and pagination.
  - In-place modal editing of book information with safety guards preventing total stock reduction below active issued loans.
  - Safe deletion with foreign key integrity safeguards.
- **👨‍🎓 Verified Student Directory**:
  - Manage student records with unique ID, name, verified email address, and phone number.
  - Format validation ensuring email delivery integrity (`swetha@example.com`).
- **📤 Circulation - Book Issue**:
  - Real-time dropdown showing only titles with `available_quantity > 0`.
  - Automatic student lookup auto-populating email and phone records.
  - Atomic database transactions updating inventory counters.
  - Immediate automated dispatch of book checkout confirmation email via Gmail SMTP.
- **📥 Circulation - Book Return & Fine Calculation**:
  - Displays active checkouts with live calculated overdue days and late fees.
  - **Fine Rule**: ₹50 per overdue day when returned after due date; ₹0 if on time.
  - Immediate dispatch of return confirmation receipt email detailing return date, due date, and fine charged.
- **⏰ Automated Due-Date & Overdue Reminders**:
  - Daily cron schedule (`0 9 * * *`) scans active loans and sends reminders for books due tomorrow.
  - Duplicate prevention mechanism ensures students never receive redundant notifications on the same day.
  - Manual bulk dispatch triggers for due-tomorrow and overdue alerts.
- **📨 Email Audit Log & SMTP Tester**:
  - Complete history of all dispatched notifications with filtering by student, date, type, and status (`Sent`, `Failed`, `Pending`).
  - Built-in "Send Test Email" modal to verify Gmail SMTP credentials directly from the UI.

---

## 🛠️ Technology Stack

### Frontend
- **React.js 19**: Modern component-based user interface.
- **React Router DOM 7**: Client-side single-page routing and route protection.
- **Bootstrap 5.3 & Bootstrap Icons**: Modern, responsive UI components, modals, and grid system.
- **Axios**: Promise-based HTTP client for REST API communication.
- **Chart.js & React-Chartjs-2**: High-performance data visualization.
- **Vite 8**: Next-generation frontend build tooling and hot-module replacement.

### Backend
- **Node.js**: Asynchronous event-driven JavaScript runtime.
- **Express.js**: RESTful API framework and routing architecture.
- **MySQL & mysql2/promise**: Relational database connection pooling and prepared statements.
- **Nodemailer**: SMTP email transport for Gmail delivery.
- **node-cron**: Scheduled background jobs for daily due-date reminder checks.
- **dotenv**: Environment variable management.
- **cors**: Cross-Origin Resource Sharing middleware.

---

## 📁 Project Folder Structure

```text
Library-Management-System/
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx               # Top navigation bar with live DB health indicator
│       │   ├── Sidebar.jsx              # Collapsible navigation menu (LIBRARY MENU)
│       │   ├── Footer.jsx               # Project footer branding
│       │   ├── Dashboard.jsx            # Dynamic cards & 3 Chart.js graphs
│       │   ├── AddBook.jsx              # Book registration form with validation
│       │   ├── BookList.jsx             # Searchable catalog table with edit/delete
│       │   ├── SearchBook.jsx           # Live instant title & subject search
│       │   ├── StudentManager.jsx       # Student directory CRUD & email management
│       │   ├── IssueBook.jsx            # Book checkout & automated email trigger
│       │   ├── ReturnBook.jsx           # Book check-in, fine calculator (₹50/day)
│       │   ├── Statistics.jsx           # In-depth visual circulation analytics
│       │   └── Notifications.jsx        # Notification history & SMTP test tool
│       │
│       ├── pages/
│       │   └── Login.jsx                # Librarian admin authentication screen
│       │
│       ├── services/
│       │   └── api.js                   # Axios HTTP service mapping to backend
│       │
│       ├── App.jsx                      # Protected routes & layout wrapper
│       ├── main.jsx                     # React entry point
│       └── index.css                    # Professional custom styles & theme
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   │   └── db.js                        # MySQL connection pool & auto-migration
│   │
│   ├── controllers/
│   │   ├── bookController.js            # Books CRUD & analytics logic
│   │   ├── studentController.js         # Student registry & validation logic
│   │   ├── issueController.js           # Book checkout & stock adjustment
│   │   ├── returnController.js          # Book check-in & ₹50/day fine formula
│   │   └── notificationController.js    # Nodemailer email dispatcher & logs
│   │
│   ├── routes/
│   │   ├── bookRoutes.js                # /api/books
│   │   ├── studentRoutes.js             # /api/students
│   │   ├── issueRoutes.js               # /api/issues
│   │   ├── returnRoutes.js              # /api/issues/:id/return
│   │   └── notificationRoutes.js        # /api/notifications
│   │
│   ├── services/
│   │   └── emailService.js              # Nodemailer Gmail SMTP service
│   │
│   ├── .env                             # Environment configuration (PORT, DB, EMAIL)
│   ├── .env.example                     # Environment template
│   ├── package.json
│   └── server.js                        # Express server entry point
│
├── database/
│   └── library.sql                      # Complete SQL DDL schema & sample dataset
│
└── README.md                            # Comprehensive project guide
```

---

## 🗄️ Database Schema (MySQL)

The relational schema is configured in [`database/library.sql`](file:///c:/Users/PC/OneDrive/Desktop/LIBRARY-MANAGEMENT-SYSTEM/database/library.sql) with proper foreign keys and indexes:

### 1. `books` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique book ID |
| `book_name` | VARCHAR(255) | NOT NULL | Title of the publication |
| `author` | VARCHAR(255) | NOT NULL | Author(s) of the book |
| `category` | VARCHAR(100) | NOT NULL | Academic subject/domain |
| `total_quantity` | INT | NOT NULL, DEFAULT 1 | Total inventory count |
| `available_quantity`| INT | NOT NULL, DEFAULT 1 | Current copies available |
| `issued_quantity` | INT | NOT NULL, DEFAULT 0 | Current copies on loan |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last modification time |

### 2. `students` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique student roll ID |
| `student_name` | VARCHAR(255) | NOT NULL | Full name of student |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Notification destination email |
| `phone_number` | VARCHAR(20) | NOT NULL | Contact telephone number |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Update timestamp |

### 3. `issues` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique issue transaction ID |
| `student_id` | INT | FOREIGN KEY -> students(id) | Borrower student ID |
| `book_id` | INT | FOREIGN KEY -> books(id) | Borrowed book ID |
| `issue_date` | DATE | NOT NULL | Date book was checked out |
| `due_date` | DATE | NOT NULL | Deadline for book return |
| `return_date` | DATE | NULL | Date actually returned |
| `status` | ENUM('Issued', 'Returned') | DEFAULT 'Issued' | Circulation status |
| `fine` | DECIMAL(10,2) | DEFAULT 0.00 | Penalty assessed (₹50/day) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Transaction time |

### 4. `notifications` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Notification log ID |
| `student_id` | INT | NULL, FOREIGN KEY -> students | Recipient student reference |
| `issue_id` | INT | NULL, FOREIGN KEY -> issues | Associated issue transaction |
| `email` | VARCHAR(255) | NOT NULL | Target email address |
| `notification_type` | VARCHAR(100) | NOT NULL | Book Issued, Due Reminder, etc. |
| `subject` | VARCHAR(255) | NOT NULL | Subject header |
| `message` | TEXT | NOT NULL | Full text content |
| `status` | ENUM('Sent', 'Failed', 'Pending') | DEFAULT 'Sent' | Delivery outcome |
| `sent_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Dispatch timestamp |

---

## ⚙️ Prerequisites & System Setup

Ensure you have the following installed on your computer:
1. **Node.js** (v18.x or v20.x or higher)
2. **MySQL Server 8.0** (or MariaDB / XAMPP)
3. A web browser (Google Chrome, Firefox, or Edge)
4. A **Gmail account** (to generate a 16-character App Password for Nodemailer)

---

## 🗄️ MySQL Database Setup

### Option A: Using MySQL Command Line Client / Terminal
Open your MySQL terminal or Command Prompt and run:

```bash
mysql -u root -p
```
Enter your MySQL password, then execute:

```sql
source c:/Users/PC/OneDrive/Desktop/LIBRARY-MANAGEMENT-SYSTEM/database/library.sql;
```
Or simply create the database:
```sql
CREATE DATABASE IF NOT EXISTS library_management;
```

### Option B: Using MySQL Workbench
1. Open **MySQL Workbench**.
2. Connect to your Local MySQL instance.
3. Open `database/library.sql`.
4. Click the **Execute (Lightning Bolt)** icon to run the script.

> **💡 Automatic Auto-Migration:** The backend includes automatic table creation and sample seeding upon startup when connected to MySQL.

---

## 🔧 Backend Configuration & Setup

### 1. Environment Variables Configuration
Open [`backend/.env`](file:///c:/Users/PC/OneDrive/Desktop/LIBRARY-MANAGEMENT-SYSTEM/backend/.env) and update your MySQL password and Gmail credentials:

```env
PORT=5000

# MySQL Database Settings
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=library_management

# Gmail SMTP Settings for Nodemailer
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-char-gmail-app-password
```

---

## 📧 Gmail App Password Setup (Nodemailer)

To allow the backend to send automated emails securely using Gmail SMTP:

1. Log into your Google Account: [https://myaccount.google.com/](https://myaccount.google.com/)
2. Navigate to **Security** on the left menu.
3. Under *"How you sign in to Google"*, ensure **2-Step Verification** is turned **ON**.
4. In the search box at the top, type **"App passwords"** and click on it.
5. Create a new App Name (e.g., `Library System`).
6. Click **Create**. Google will display a **16-character password** (e.g., `abcd efgh ijkl mnop`).
7. Copy this 16-character password into `backend/.env` as `EMAIL_PASSWORD=abcdefghijklmnop` (without spaces).
8. Save `backend/.env`.

---

## 💻 Frontend Configuration & Setup

The frontend uses Axios configured to talk to `http://localhost:5000/api`.

Dependencies are pre-configured in `frontend/package.json`:
- `axios`
- `bootstrap`
- `bootstrap-icons`
- `chart.js`
- `react-chartjs-2`
- `react-router-dom`

---

## 🚀 How to Run the Application

### 1. Start the Backend Server (Terminal 1)
```bash
cd backend
npm install
npm start
```
> **Output expected:**
> ```text
> ✅ Successfully connected to MySQL database: library_management
> =================================================
> 🚀 Library Management Backend running on port 5000
> 📡 Base URL: http://localhost:5000/api
> 🩺 Health check: http://localhost:5000/api/health
> =================================================
> ```

### 2. Start the React Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```
*(Alternatively, you can also run `npm run dev` from the project root)*

> **Output expected:**
> ```text
>   VITE v8.3.1  ready in 320 ms
> 
>   ➜  Local:   http://localhost:5173/
>   ➜  Network: use --host to expose
> ```

Open **`http://localhost:5173`** in your browser.

### 3. Log In to Dashboard
- **Username:** `admin`
- **Password:** `admin123`

---

## 🔌 Complete REST API Reference

### Books API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books` | Get all books (supports `?search=` and `?category=`) |
| `GET` | `/api/books/categories/list` | Get list of distinct subject categories |
| `GET` | `/api/books/dashboard/stats` | Dynamic totals, overdue counts, category charts data |
| `GET` | `/api/books/:id` | Get single book by ID |
| `POST` | `/api/books` | Add new book title into catalog |
| `PUT` | `/api/books/:id` | Update book title, author, category, or total copies |
| `DELETE` | `/api/books/:id` | Delete book (blocked if active loans exist) |

### Students API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Get all students (supports `?search=`) |
| `GET` | `/api/students/:id` | Get student details by ID |
| `POST` | `/api/students` | Register new student with verified email |
| `PUT` | `/api/students/:id` | Update student profile |
| `DELETE` | `/api/students/:id` | Delete student (blocked if active loans exist) |

### Circulation (Issue & Return) API
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/issues` | Retrieve complete circulation history |
| `GET` | `/api/issues/active` | Get active unreturned loans with live fine calculation |
| `GET` | `/api/issues/overdue` | Get loans strictly past due date |
| `POST` | `/api/issues` | Issue book, decrease available stock, dispatch email |
| `PUT` | `/api/issues/:id/return` | Check in book, assess fine, dispatch return email |

### Notifications & Email API
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/notifications/send-email` | Dispatch customized library email notice |
| `POST` | `/api/notifications/test-email` | Test Nodemailer Gmail SMTP connectivity |
| `GET` | `/api/notifications` | Get audit logs with search, type, and status filters |
| `GET` | `/api/notifications/due-reminders` | Preview loans due within 3 days |
| `POST` | `/api/notifications/trigger-due-reminders` | Send automated email reminders for books due tomorrow |
| `POST` | `/api/notifications/trigger-overdue-reminders` | Send overdue penalty warnings |
| `GET` | `/api/health` | Diagnostic check of backend, MySQL, and SMTP |

---

## 💰 Fine Calculation Algorithm

The system enforces the specified late fee rule:
- **Daily Rate:** ₹50 per overdue day.
- **On or before Due Date:** Fine = ₹0.
- **After Due Date:** Fine = ₹50 × (Return Date − Due Date in Days).

### Calculation Logic:
```javascript
function calculateFine(dueDateStr, returnDateStr) {
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const returned = new Date(returnDateStr);
  returned.setHours(0, 0, 0, 0);

  const diffTime = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isOverdue: true,
      overdueDays: diffDays,
      fine: diffDays * 50
    };
  }
  return { isOverdue: false, overdueDays: 0, fine: 0 };
}
```

---

## 📬 Automated Email Reminder System

### 1. Checkout Confirmation Email
Triggered upon issuing a book:
```text
Subject: Library Book Issued - [Book Name]

Dear [Student Name],

The following book has been issued to you:

Book: [Book Name]
Author: [Author]
Issue Date: [Issue Date]
Due Date: [Due Date]

Please return the book on or before the due date.

Thank you,
Library Management System
```

### 2. Return Confirmation Email
Triggered upon checking in a book:
```text
Subject: Library Book Returned - [Book Name]

Dear [Student Name],

Your book has been successfully returned.

Book: [Book Name]
Return Date: [Return Date]
Due Date: [Due Date]
Fine: ₹[Fine]

Thank you,
Library Management System
```

### 3. Due Tomorrow Reminder Email
Triggered automatically by scheduled cron job or manual trigger:
```text
Subject: Library Book Due Tomorrow

Dear [Student Name],

This is a reminder that your library book:

Book: [Book Name]
Due Date: [Due Date]

is due tomorrow.

Please return the book on time.

Thank you,
Library Management System
```

---

## ❓ Troubleshooting & FAQs

### Q1: The Navbar displays "Check MySQL .env" or "Backend Offline"
- Ensure Node.js server is started on port 5000: `cd backend && npm start`.
- Verify your MySQL server is running (Windows Services -> `MySQL80`).
- Update `DB_PASSWORD` in `backend/.env` with your actual MySQL password.

### Q2: How do I test the email functionality if I don't have a Gmail App Password right now?
- The backend features a built-in simulation mode. If Gmail credentials are left blank in `.env`, transactions still complete successfully, and emails are logged in the `notifications` table for review on the Notifications page.
- Once you provide valid Gmail SMTP credentials in `backend/.env`, real emails are delivered immediately!

### Q3: What happens if an email fails to deliver?
- As per project specifications, the database transaction is safely preserved. The user receives: `"Book issued successfully. Email notification failed."` and the issue record is saved.

---

## 👨‍💻 Project Presentation Notes for B.Tech Viva
1. **Relational Integrity**: Foreign key constraints with `ON DELETE CASCADE` ensure no orphaned circulation records.
2. **Transaction Safety**: MySQL database transactions (`beginTransaction`, `commit`, `rollback`) prevent race conditions during book checkout and check-in.
3. **Responsive Architecture**: Built with flexible CSS and Bootstrap 5 to look crisp across mobile, tablet, and desktop screens.
4. **Security Best Practice**: Zero exposure of database passwords or email API keys in the client-side React bundle. All credentials remain secure inside `backend/.env`.
