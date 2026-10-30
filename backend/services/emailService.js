const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { pool } = require('../config/db');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

// Create reusable pooled transporter object
let cachedTransporter = null;
let cachedConfigKey = null;

function getTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp-relay.brevo.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.EMAIL_USER || '').trim();
  let pass = (process.env.EMAIL_PASSWORD || '').trim();

  if (!user || !pass || user.includes('your-email') || user.includes('example.com') || pass.includes('your-brevo') || pass.includes('your-gmail')) {
    return null;
  }

  const currentConfigKey = `${host}:${port}:${user}:${pass}`;
  if (cachedTransporter && cachedConfigKey === currentConfigKey) {
    return cachedTransporter;
  }

  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: isSecure,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  cachedConfigKey = currentConfigKey;
  return cachedTransporter;
}

// Log notification to database
async function logNotification({ studentId = null, issueId = null, email, type, subject, message, status }) {
  try {
    await pool.query(
      `INSERT INTO notifications (student_id, issue_id, email, notification_type, subject, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [studentId, issueId, email, type, subject, message, status]
    );
  } catch (err) {
    console.error('Failed to log notification to database:', err.message);
  }
}

// Helper to generate a clean, responsive HTML email wrapper
function generateEmailHtml({ title, preheader, contentHtml, badgeText = 'Library Notice', badgeColor = '#4361ee' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #2b2d42; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e9ecef; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #ffffff; margin-top: 10px; background: ${badgeColor}; }
    .body { padding: 28px 24px; line-height: 1.6; font-size: 15px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 18px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #64748b; font-weight: 500; }
    .card-value { color: #0f172a; font-weight: 600; text-align: right; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .warning { color: #e11d48; font-weight: 700; }
    .success { color: #16a34a; font-weight: 700; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <h1>📚 Library Management System</h1>
      <p>Automated Campus Library Notification System</p>
      <div class="badge">${badgeText}</div>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">This is an automated notification from the Library Management System.</p>
      <p style="margin: 0;">Please do not reply directly to this automated email. Contact library staff for inquiries.</p>
    </div>
  </div>
</body>
</html>`;
}

// Generic mail dispatcher with fallback and notification logging
async function sendMail({ to, subject, text, html = null, type = 'General', studentId = null, issueId = null }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email Simulation] SMTP not configured with real credentials in .env. Email to <${to}>: "${subject}"`);
    await logNotification({
      studentId,
      issueId,
      email: to,
      type,
      subject,
      message: text,
      status: 'Simulated'
    });
    return {
      success: true,
      simulated: true,
      message: 'Email logged in simulation mode. Configure SMTP credentials in .env for real dispatch.'
    };
  }

  try {
    const sender = process.env.EMAIL_FROM || `"Library Management System" <${process.env.EMAIL_USER.trim()}>`;
    const mailOptions = {
      from: sender,
      to: to.trim(),
      subject,
      text,
      html: html || generateEmailHtml({
        title: subject,
        preheader: subject,
        badgeText: type,
        contentHtml: `<div style="white-space: pre-wrap;">${text}</div>`
      })
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Real email successfully sent to ${to}: ${info.messageId}`);
    await logNotification({
      studentId,
      issueId,
      email: to,
      type,
      subject,
      message: text,
      status: 'Sent'
    });

    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email dispatch error to ${to}:`, error.message);
    await logNotification({
      studentId,
      issueId,
      email: to,
      type,
      subject,
      message: text,
      status: 'Failed'
    });
    return { success: false, simulated: false, error: error.message };
  }
}

// 1. Issue Book Confirmation Email
async function sendIssueEmail({ studentName, email, bookName, author, issueDate, dueDate, studentId, issueId }) {
  const subject = `Library Book Issued - ${bookName}`;
  const text = `Dear ${studentName},

The following book has been issued to you from the library:

Book: ${bookName}
Author: ${author}
Issue Date: ${issueDate}
Due Date: ${dueDate}

Please return the book on or before the due date to avoid late fees (₹50/day).

Thank you,
Library Management System`;

  const html = generateEmailHtml({
    title: subject,
    preheader: `Your borrowed book "${bookName}" is due on ${dueDate}`,
    badgeText: 'Book Issued',
    badgeColor: '#2563eb',
    contentHtml: `
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>The following library book has been successfully issued to your account:</p>
      
      <table style="width:100%; border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0;">
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Book Title</td><td style="padding:10px 14px; font-weight:700; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${bookName}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Author</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${author}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Issue Date</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${issueDate}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px;">Due Date</td><td style="padding:10px 14px; font-weight:700; color:#2563eb; font-size:14px;">${dueDate}</td></tr>
      </table>

      <p style="font-size:14px; color:#475569;">Please return the book on or before <strong>${dueDate}</strong> to maintain your borrowing privileges and avoid late fines (₹50/day).</p>
      <p>Happy Reading!<br><strong>Library Team</strong></p>
    `
  });

  return await sendMail({
    to: email,
    subject,
    text,
    html,
    type: 'Book Issued',
    studentId,
    issueId
  });
}

// 2. Return Book Confirmation Email
async function sendReturnEmail({ studentName, email, bookName, returnDate, dueDate, fine, studentId, issueId }) {
  const subject = `Library Book Returned - ${bookName}`;
  const text = `Dear ${studentName},

Your library book has been successfully returned.

Book: ${bookName}
Return Date: ${returnDate}
Due Date: ${dueDate}
Fine: ₹${fine}

Thank you,
Library Management System`;

  const fineVal = parseFloat(fine) || 0;
  const fineColor = fineVal > 0 ? '#e11d48' : '#16a34a';

  const html = generateEmailHtml({
    title: subject,
    preheader: `Return receipt for "${bookName}" - Fine: ₹${fine}`,
    badgeText: 'Book Returned',
    badgeColor: '#16a34a',
    contentHtml: `
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your library book has been successfully returned and checked back into the catalog:</p>
      
      <table style="width:100%; border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0;">
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Book Title</td><td style="padding:10px 14px; font-weight:700; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${bookName}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Return Date</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${returnDate}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Due Date</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${dueDate}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px;">Late Fine</td><td style="padding:10px 14px; font-weight:700; color:${fineColor}; font-size:14px;">₹${fine}</td></tr>
      </table>

      ${fineVal > 0 ? `<p style="color:#e11d48; font-size:14px;"><strong>Note:</strong> Please clear any pending overdue fine of ₹${fine} at the library reception.</p>` : `<p style="color:#16a34a; font-size:14px;">Thank you for returning the book on time with zero penalty!</p>`}
      <p>Thank you,<br><strong>Library Team</strong></p>
    `
  });

  return await sendMail({
    to: email,
    subject,
    text,
    html,
    type: 'Book Returned',
    studentId,
    issueId
  });
}

// 3. Due Tomorrow Reminder Email
async function sendDueTomorrowEmail({ studentName, email, bookName, dueDate, studentId, issueId }) {
  const subject = `Friendly Reminder: Library Book Due Tomorrow - ${bookName}`;
  const text = `Dear ${studentName},

This is a reminder that your library book:

Book: ${bookName}
Due Date: ${dueDate}

is due tomorrow. Please return or renew the book to avoid late fee penalties of ₹50 per day.

Thank you,
Library Management System`;

  const html = generateEmailHtml({
    title: subject,
    preheader: `Reminder: "${bookName}" is due tomorrow (${dueDate})`,
    badgeText: 'Due Tomorrow',
    badgeColor: '#f59e0b',
    contentHtml: `
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>This is a friendly reminder that your borrowed book is due for return <strong>tomorrow</strong>:</p>
      
      <table style="width:100%; border-collapse:collapse; background:#fffbeb; border:1px solid #fef3c7; border-radius:8px; margin:16px 0;">
        <tr><td style="padding:10px 14px; color:#92400e; font-size:14px; border-bottom:1px solid #fde68a;">Book Title</td><td style="padding:10px 14px; font-weight:700; color:#78350f; font-size:14px; border-bottom:1px solid #fde68a;">${bookName}</td></tr>
        <tr><td style="padding:10px 14px; color:#92400e; font-size:14px;">Due Date</td><td style="padding:10px 14px; font-weight:700; color:#d97706; font-size:14px;">${dueDate} (Tomorrow)</td></tr>
      </table>

      <p style="font-size:14px; color:#475569;">Please visit the library counter to return or renew your book to avoid overdue late fines of ₹50 per day.</p>
      <p>Best regards,<br><strong>Library Circulation Desk</strong></p>
    `
  });

  return await sendMail({
    to: email,
    subject,
    text,
    html,
    type: 'Due Reminder',
    studentId,
    issueId
  });
}

// 4. Overdue Reminder Email
async function sendOverdueEmail({ studentName, email, bookName, dueDate, daysOverdue, fine, studentId, issueId }) {
  const subject = `URGENT: Overdue Library Book Alert - ${bookName}`;
  const text = `Dear ${studentName},

This is an urgent notice that your borrowed book is OVERDUE:

Book: ${bookName}
Due Date: ${dueDate}
Days Overdue: ${daysOverdue} day(s)
Accumulated Fine: ₹${fine} (₹50/day)

Please return the book immediately to avoid further penalties.

Thank you,
Library Management System`;

  const html = generateEmailHtml({
    title: subject,
    preheader: `URGENT: "${bookName}" is ${daysOverdue} day(s) overdue. Fine: ₹${fine}`,
    badgeText: 'Overdue Alert',
    badgeColor: '#e11d48',
    contentHtml: `
      <p>Dear <strong>${studentName}</strong>,</p>
      <p style="color:#e11d48; font-weight:600;">⚠️ This is an urgent notice that your borrowed library book is overdue for return.</p>
      
      <table style="width:100%; border-collapse:collapse; background:#fff1f2; border:1px solid #ffe4e6; border-radius:8px; margin:16px 0;">
        <tr><td style="padding:10px 14px; color:#9f1239; font-size:14px; border-bottom:1px solid #fecdd3;">Book Title</td><td style="padding:10px 14px; font-weight:700; color:#881337; font-size:14px; border-bottom:1px solid #fecdd3;">${bookName}</td></tr>
        <tr><td style="padding:10px 14px; color:#9f1239; font-size:14px; border-bottom:1px solid #fecdd3;">Original Due Date</td><td style="padding:10px 14px; font-weight:600; color:#881337; font-size:14px; border-bottom:1px solid #fecdd3;">${dueDate}</td></tr>
        <tr><td style="padding:10px 14px; color:#9f1239; font-size:14px; border-bottom:1px solid #fecdd3;">Days Overdue</td><td style="padding:10px 14px; font-weight:700; color:#e11d48; font-size:14px; border-bottom:1px solid #fecdd3;">${daysOverdue} day(s)</td></tr>
        <tr><td style="padding:10px 14px; color:#9f1239; font-size:14px;">Current Fine</td><td style="padding:10px 14px; font-weight:700; color:#e11d48; font-size:15px;">₹${fine} (₹50 / day)</td></tr>
      </table>

      <p style="font-size:14px; color:#475569;">Please return the book to the library immediately to prevent fine accumulation and account suspension.</p>
      <p>Sincerely,<br><strong>Library Administration</strong></p>
    `
  });

  return await sendMail({
    to: email,
    subject,
    text,
    html,
    type: 'Overdue Reminder',
    studentId,
    issueId
  });
}

// 5. Test Email
async function sendTestEmail(toEmail) {
  const timestamp = new Date().toLocaleString();
  const subject = `Library Management System - SMTP Test Email`;
  const text = `Dear User,

This is a live test email from the Library Management System.
If you are reading this in your inbox, your Brevo / SMTP integration is active and working perfectly!

Configured Host: ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}
Configured Sender: ${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'N/A'}
Recipient: ${toEmail}
Timestamp: ${timestamp}

Thank you,
Library Management System`;

  const html = generateEmailHtml({
    title: subject,
    preheader: `SMTP Connection Verified - ${timestamp}`,
    badgeText: 'SMTP Test',
    badgeColor: '#10b981',
    contentHtml: `
      <p>Hello,</p>
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:16px; margin:16px 0;">
        <h3 style="margin:0 0 8px 0; color:#065f46; font-size:16px;">🎉 Brevo SMTP Verification Successful!</h3>
        <p style="margin:0; font-size:14px; color:#047857;">Your Library Management System is connected to Brevo SMTP via Nodemailer and can deliver real emails directly to students' inboxes.</p>
      </div>
      
      <table style="width:100%; border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin:16px 0;">
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">SMTP Host</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Sender Account</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'N/A'}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px; border-bottom:1px solid #edf2f7;">Recipient</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px; border-bottom:1px solid #edf2f7;">${toEmail}</td></tr>
        <tr><td style="padding:10px 14px; color:#64748b; font-size:14px;">Dispatch Timestamp</td><td style="padding:10px 14px; font-weight:600; color:#0f172a; font-size:14px;">${timestamp}</td></tr>
      </table>

      <p style="font-size:14px; color:#475569;">All automated notifications (book issue receipts, return confirmations, due date alerts, overdue penalty notices) will now reach real recipient email addresses.</p>
    `
  });

  return await sendMail({
    to: toEmail,
    subject,
    text,
    html,
    type: 'Test Email'
  });
}

module.exports = {
  getTransporter,
  createTransporter: getTransporter,
  sendMail,
  sendIssueEmail,
  sendReturnEmail,
  sendDueTomorrowEmail,
  sendOverdueEmail,
  sendTestEmail
};
