# 📚 Library Management System (LMS)

A full-stack modern **Library Management System** built with **React.js**, **Node.js / Express**, and **MySQL**, featuring automated **Gmail SMTP Email Notifications**.

---

## 🚀 Features

- **📊 Comprehensive Dashboard:** Real-time metrics for total books, available books, active issues, category distribution, and overdue records.
- **📖 Book Catalog Management:** Add, update, view, and search catalog inventory by title, author, category, or ISBN.
- **👥 Student Management:** Register, update, and manage student profiles for circulation.
- **📤 Book Issue System:** Check out books with automatic stock updates and instant email dispatch of issue receipts to students.
- **📥 Return & Fine Management:** Compute overdue fines (₹50/day), record returns, update catalog availability, and send return confirmation receipts.
- **✉️ Email Notification System (Nodemailer Gmail SMTP):**
  - Instant Issue & Return confirmation receipts.
  - Automated due-date reminders for books due tomorrow.
  - Urgent overdue penalty alert emails.
  - Direct "Send Email" tool to message students directly.
  - Comprehensive delivery audit log in MySQL.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Bootstrap 5, Bootstrap Icons, Chart.js, Axios
- **Backend:** Node.js, Express.js, MySQL2 (`mysql2/promise`), Nodemailer, Dotenv
- **Database:** MySQL relational database schema

---

## 💻 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```
