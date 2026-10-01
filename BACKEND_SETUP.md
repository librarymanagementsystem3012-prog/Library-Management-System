# 🚀 Library Management System - Backend & WhatsApp Integration Guide

This project includes a complete Node.js + Express backend with automated WhatsApp messaging, due-date reminder cron jobs, and database persistence.

---

## 📁 Backend Architecture

```
backend/
├── package.json               # Backend dependencies (express, cors, twilio, node-cron, dotenv)
├── server.js                  # Main Express server entry point
├── .env                       # Environment configuration
├── .env.example               # Configuration template
├── data/
│   └── db.json                # JSON database storing books, issued records, and WhatsApp logs
├── services/
│   ├── db.js                  # Database read/write helpers
│   ├── whatsappService.js     # WhatsApp messaging engine (Twilio, Meta, Simulation & Click-to-chat)
│   └── cronService.js         # Daily scheduled automated WhatsApp due-date reminders
└── routes/
    ├── books.js               # Books CRUD API
    ├── issuedBooks.js         # Book issue & return with auto-WhatsApp triggers
    ├── notifications.js       # Due-date & overdue calculation API
    ├── whatsapp.js            # Single, batch, custom WhatsApp dispatchers & logs
    └── stats.js               # Library dashboard analytics
```


---

## ⚡ Quick Start

### 1. Install Backend Dependencies
Open a terminal in the project directory:
```bash
cd backend
npm install
```

### 2. Start the Backend Server
```bash
npm start
```
> The backend will start on **`http://localhost:5000`**.

### 3. Start Frontend (in a separate terminal)
```bash
npm run dev
```
> The frontend runs on **`http://localhost:5173`** and connects with `http://localhost:5000/api`.

---

## 📱 WhatsApp Integration Options

The backend supports **three modes**:

### Mode 1: Simulation & Click-to-Chat (Zero Setup / Default)
- **`WHATSAPP_PROVIDER=simulation`** in `backend/.env`
- Does **not require any API keys or paid accounts**.
- When an action triggers (Issue, Return, Reminder), the backend formats the professional WhatsApp message, logs it to `backend/data/db.json` and server console, and produces a direct **`https://wa.me/...`** link so the librarian can send or preview via **WhatsApp Web / WhatsApp Mobile** in 1 click!

---

### Mode 2: Twilio WhatsApp API (Automated Cloud Delivery)
To send messages automatically to students' WhatsApp:
1. Create a free account at [twilio.com](https://www.twilio.com).
2. Go to **Messaging > Try it out > Send a WhatsApp message** to activate your Twilio WhatsApp Sandbox.
3. Update `backend/.env`:
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   DEFAULT_COUNTRY_CODE=91
   ```
4. Restart backend server (`npm start`). Messages will be delivered directly to the student's WhatsApp!

---

### Mode 3: Meta WhatsApp Cloud API
For official WhatsApp Business:
1. Set up a Meta Developer app with the WhatsApp product enabled.
2. Update `backend/.env`:
   ```env
   WHATSAPP_PROVIDER=meta
   META_WHATSAPP_TOKEN=your_meta_system_access_token
   META_PHONE_NUMBER_ID=your_meta_phone_number_id
   DEFAULT_COUNTRY_CODE=91
   ```

---

## ⏰ Automated Daily Due-Date Reminders (Cron Job)

The backend has an automated cron scheduler configured in `backend/services/cronService.js`.
- By default, it runs every morning at **09:00 AM** (`CRON_SCHEDULE=0 9 * * *`).
- It checks all issued books:
  - **Due Today**: Sends a reminder that the book is due today.
  - **Due Tomorrow**: Sends a friendly advance notification.
  - **Overdue**: Sends an urgent alert with the ₹50 late fee notice.
- You can also manually trigger a scan or send reminders in bulk from the **Notifications** tab in the UI!

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books` | Get all books in catalog |
| `POST` | `/api/books` | Add a new book |
| `PUT` | `/api/books/:id` | Update book title, author, category, quantity |
| `DELETE` | `/api/books/:id` | Delete a book (if no copies issued) |
| `GET` | `/api/issued-books` | Get all currently issued books |
| `POST` | `/api/issued-books/issue` | Issue book & dispatch WhatsApp confirmation |
| `POST` | `/api/issued-books/return` | Return book, calculate fine, send return receipt |
| `GET` | `/api/notifications` | Get due-soon and overdue book alerts |
| `POST` | `/api/whatsapp/send-reminder` | Send WhatsApp reminder for specific book |
| `POST` | `/api/whatsapp/send-batch-reminders` | Send WhatsApp reminders to all due students |
| `POST` | `/api/whatsapp/custom` | Send custom WhatsApp announcement to student |
| `GET` | `/api/whatsapp/logs` | View dispatched WhatsApp messages history |
| `GET` | `/api/whatsapp/config-status` | Get current WhatsApp provider and status |
| `GET` | `/api/stats` | Dashboard statistics and fine totals |
| `GET` | `/api/health` | Backend health check |
