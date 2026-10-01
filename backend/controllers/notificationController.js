const { pool } = require('../config/db');
const {
  sendMail,
  sendDueTomorrowEmail,
  sendOverdueEmail,
  sendTestEmail
} = require('../services/emailService');
const { calculateDynamicFine } = require('./issueController');

// POST /api/notifications/send-email
async function sendCustomEmail(req, res) {
  try {
    const { email, studentName, bookName, dueDate, message, subject, studentId } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const recipientName = studentName || 'Student';
    const bookTitle = bookName || 'Library Book';
    const dueInfo = dueDate ? `\nDue Date: ${dueDate}` : '';

    const emailSubject = subject && subject.trim() ? subject.trim() : `Library Notice: ${bookTitle}`;
    const emailBody = message && message.trim() ? message.trim() : `Dear ${recipientName},

This is an official communication regarding your library borrowing:

Book: ${bookTitle}${dueInfo}

Please contact the library if you have any questions.

Thank you,
Library Management System`;

    const result = await sendMail({
      to: email.trim(),
      subject: emailSubject,
      text: emailBody,
      type: 'Direct Email',
      studentId: studentId || null
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.simulated
          ? 'Email simulated and recorded in notification log'
          : 'Email sent successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email: ' + (result.error || 'Unknown error')
      });
    }
  } catch (error) {
    console.error('Error in sendCustomEmail:', error);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}

// GET /api/notifications - Notification history with filters
async function getNotifications(req, res) {
  try {
    const { search, type, status, date } = req.query;

    let query = `
      SELECT 
        n.id,
        n.student_id,
        n.issue_id,
        n.email,
        n.notification_type,
        n.subject,
        n.message,
        n.status,
        n.sent_at,
        s.student_name,
        b.book_name
      FROM notifications n
      LEFT JOIN students s ON n.student_id = s.id
      LEFT JOIN issues i ON n.issue_id = i.id
      LEFT JOIN books b ON i.book_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ` AND (n.email LIKE ? OR s.student_name LIKE ? OR b.book_name LIKE ? OR n.subject LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (type && type.trim() && type !== 'All') {
      query += ` AND n.notification_type = ?`;
      params.push(type.trim());
    }

    if (status && status.trim() && status !== 'All') {
      query += ` AND n.status = ?`;
      params.push(status.trim());
    }

    if (date && date.trim()) {
      query += ` AND DATE(n.sent_at) = ?`;
      params.push(date.trim());
    }

    query += ` ORDER BY n.id DESC LIMIT 200`;

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching notifications: ' + error.message });
  }
}

// GET /api/notifications/due-reminders - List books approaching due date
async function getDueReminders(req, res) {
  try {
    // Identify active issues due today, tomorrow, or in 2 days
    const query = `
      SELECT 
        i.id AS issue_id,
        i.issue_date,
        i.due_date,
        s.id AS student_id,
        s.student_name,
        s.email,
        s.phone_number,
        b.id AS book_id,
        b.book_name,
        b.author,
        DATEDIFF(i.due_date, CURDATE()) AS days_left
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      WHERE i.status = 'Issued'
        AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      ORDER BY i.due_date ASC
    `;
    const [rows] = await pool.query(query);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching due reminders:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching due reminders' });
  }
}

// POST /api/notifications/trigger-due-reminders - Send reminders for books due tomorrow (preventing duplicates)
async function triggerDueReminders(req, res) {
  try {
    // Find issues due tomorrow (or today/soon) that have NOT already had a reminder sent today
    const query = `
      SELECT 
        i.id AS issue_id,
        i.due_date,
        s.id AS student_id,
        s.student_name,
        s.email,
        b.book_name
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      WHERE i.status = 'Issued'
        AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.issue_id = i.id 
            AND n.notification_type = 'Due Reminder'
            AND DATE(n.sent_at) = CURDATE()
        )
    `;
    const [eligibleIssues] = await pool.query(query);

    const sentResults = [];
    for (const item of eligibleIssues) {
      const result = await sendDueTomorrowEmail({
        studentName: item.student_name,
        email: item.email,
        bookName: item.book_name,
        dueDate: item.due_date,
        studentId: item.student_id,
        issueId: item.issue_id
      });
      sentResults.push({
        issueId: item.issue_id,
        student: item.student_name,
        email: item.email,
        book: item.book_name,
        success: result.success
      });
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${sentResults.length} due-date reminder(s)`,
      processedCount: sentResults.length,
      details: sentResults
    });
  } catch (error) {
    console.error('Error triggering due reminders:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending due reminders' });
  }
}

// POST /api/notifications/trigger-overdue-reminders - Send reminders for overdue books
async function triggerOverdueReminders(req, res) {
  try {
    const query = `
      SELECT 
        i.id AS issue_id,
        i.due_date,
        s.id AS student_id,
        s.student_name,
        s.email,
        b.book_name
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      WHERE i.status = 'Issued'
        AND i.due_date < CURDATE()
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.issue_id = i.id 
            AND n.notification_type = 'Overdue Reminder'
            AND DATE(n.sent_at) = CURDATE()
        )
    `;
    const [overdueIssues] = await pool.query(query);

    const sentResults = [];
    for (const item of overdueIssues) {
      const { overdueDays, fine } = calculateDynamicFine(item.due_date);
      const result = await sendOverdueEmail({
        studentName: item.student_name,
        email: item.email,
        bookName: item.book_name,
        dueDate: item.due_date,
        daysOverdue,
        fine,
        studentId: item.student_id,
        issueId: item.issue_id
      });
      sentResults.push({
        issueId: item.issue_id,
        student: item.student_name,
        email: item.email,
        book: item.book_name,
        fine,
        success: result.success
      });
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${sentResults.length} overdue reminder(s)`,
      processedCount: sentResults.length,
      details: sentResults
    });
  } catch (error) {
    console.error('Error triggering overdue reminders:', error);
    return res.status(500).json({ success: false, message: 'Server error while sending overdue reminders' });
  }
}

// POST /api/notifications/test-email
async function handleTestEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a test recipient email address' });
    }

    const result = await sendTestEmail(email.trim());

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.simulated
          ? 'Test email simulated successfully. (To send real Gmail, configure EMAIL_USER and EMAIL_PASSWORD in backend/.env)'
          : 'Test email sent successfully via Gmail SMTP!'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email: ' + (result.error || 'SMTP Error')
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}

module.exports = {
  sendCustomEmail,
  getNotifications,
  getDueReminders,
  triggerDueReminders,
  triggerOverdueReminders,
  handleTestEmail
};
