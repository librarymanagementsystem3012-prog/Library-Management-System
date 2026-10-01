# 🚀 Library Management System - Backend & Automated SMS Integration Guide

This project includes a complete Node.js + Express backend with automated **SMS messaging**, scheduled daily due-date reminder cron jobs, and database persistence.

---

## 📁 Backend Architecture

```
backend/
├── package.json               # Backend dependencies (express, cors, twilio, node-cron, dotenv)
├── server.js                  # Main Express server entry point (port 5000)
├── .env                       # Environment configuration for SMS
├── .env.example               # Configuration template
├── data/
│   └── db.json                # JSON database storing books, issued records, and SMS logs
├── services/
│   ├── db.js                  # Database read/write helpers
│   ├── smsService.js          # SMS messaging engine (Fast2SMS, Twilio SMS, Native SMS)
│   └── cronService.js         # Daily scheduled automated 9:00 AM SMS due-date reminders
└── routes/
    ├── books.js               # Books CRUD API
    ├── issuedBooks.js         # Book checkout & return with auto-SMS triggers
    ├── notifications.js       # Due-date & overdue calculation API
    ├── sms.js                 # Single, batch, custom SMS dispatchers & logs
    └── stats.js               # Library dashboard analytics
```

---

## ⚡ Quick Start

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Start Backend Server
```bash
npm start
```
> Server runs on **`http://localhost:5000`**.

### 3. Start Frontend (in a separate terminal)
```bash
npm run dev
```
> React frontend runs on **`http://localhost:5173`**.

---

## 📩 SMS Delivery Options

The system supports **three flexible SMS modes**:

### Option 1: Fast2SMS (Instant Free SMS in India - Recommended!)
Fast2SMS sends direct real SMS messages to any 10-digit Indian mobile number immediately without sandbox opt-ins:
1. Create a free account at [fast2sms.com](https://www.fast2sms.com) (includes free SMS balance).
2. Go to **Dev API** and copy your **API Key**.
3. In the Library app, go to **"📩 SMS Setup"** tab, select **Fast2SMS**, paste the key, and click **Save**.
4. Test it with your phone number—real SMS arrives on your phone immediately!

---

### Option 2: Native Device Messages App (Zero API Keys Needed)
- When issuing a book or sending reminders, the app automatically triggers the device's native SMS application (`sms:+919876543210?body=...`) with the student's number and message pre-filled.
- Works right in the browser on Android, iPhone, Windows, and Mac!

---

### Option 3: Twilio SMS (Global Delivery)
For sending SMS internationally:
1. Provide `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` in `backend/.env`.
2. SMS will be delivered worldwide via Twilio.

---

## ⏰ Automated Daily SMS Reminders (Cron Job)

Configured in `backend/services/cronService.js`:
- Runs automatically every morning at **09:00 AM** (`0 9 * * *`).
- Scans active checkouts and sends SMS alerts:
  - **Due Today**: Alert to return before counter closes.
  - **Due Tomorrow**: Advance reminder.
  - **Overdue**: Urgent alert with ₹50 late fee notice.
- You can also manually send bulk SMS reminders from the **Notifications** screen.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books` | Get all books |
| `POST` | `/api/books` | Add new book |
| `POST` | `/api/issued-books/issue` | Issue book & trigger automated SMS confirmation |
| `POST` | `/api/issued-books/return` | Return book, calculate fine & send SMS receipt |
| `GET` | `/api/notifications` | Get overdue and due-soon lists |
| `POST` | `/api/sms/send-reminder` | Send SMS reminder for specific checkout |
| `POST` | `/api/sms/send-batch-reminders`| Batch send SMS to all due/overdue students |
| `POST` | `/api/sms/test` | Send test SMS |
| `POST` | `/api/sms/save-sms-config` | Update SMS provider settings in `.env` |
| `GET` | `/api/sms/logs` | View dispatched SMS logs |
