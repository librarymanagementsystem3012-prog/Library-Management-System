const { pool } = require('../config/db');
const { sendIssueEmail } = require('../services/emailService');

// Helper to compute fine dynamically
function calculateDynamicFine(dueDateStr) {
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isOverdue: true,
      overdueDays: diffDays,
      fine: diffDays * 50
    };
  }
  return {
    isOverdue: false,
    overdueDays: 0,
    fine: 0
  };
}

// GET /api/issues - All issues
async function getAllIssues(req, res) {
  try {
    const query = `
      SELECT 
        i.id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        i.fine,
        i.created_at,
        s.student_name,
        s.email,
        s.phone_number,
        b.book_name,
        b.author,
        b.category
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      ORDER BY i.id DESC
    `;
    const [rows] = await pool.query(query);

    // Compute dynamic fine for active issues
    const formatted = rows.map(item => {
      if (item.status === 'Issued') {
        const { overdueDays, fine } = calculateDynamicFine(item.due_date);
        return {
          ...item,
          current_overdue_days: overdueDays,
          current_fine: fine
        };
      }
      return {
        ...item,
        current_overdue_days: 0,
        current_fine: parseFloat(item.fine || 0)
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching all issues:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching issues: ' + error.message });
  }
}

// GET /api/issues/active - Only active issued books
async function getActiveIssues(req, res) {
  try {
    const query = `
      SELECT 
        i.id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        i.fine,
        s.student_name,
        s.email,
        s.phone_number,
        b.book_name,
        b.author,
        b.category
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      WHERE i.status = 'Issued'
      ORDER BY i.due_date ASC
    `;
    const [rows] = await pool.query(query);

    const formatted = rows.map(item => {
      const { overdueDays, fine } = calculateDynamicFine(item.due_date);
      return {
        ...item,
        current_overdue_days: overdueDays,
        current_fine: fine
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching active issues:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching active issues: ' + error.message });
  }
}

// GET /api/issues/overdue - Active overdue books
async function getOverdueIssues(req, res) {
  try {
    const query = `
      SELECT 
        i.id,
        i.student_id,
        i.book_id,
        i.issue_date,
        i.due_date,
        i.return_date,
        i.status,
        s.student_name,
        s.email,
        s.phone_number,
        b.book_name,
        b.author,
        b.category
      FROM issues i
      JOIN students s ON i.student_id = s.id
      JOIN books b ON i.book_id = b.id
      WHERE i.status = 'Issued' AND i.due_date < CURDATE()
      ORDER BY i.due_date ASC
    `;
    const [rows] = await pool.query(query);

    const formatted = rows.map(item => {
      const { overdueDays, fine } = calculateDynamicFine(item.due_date);
      return {
        ...item,
        current_overdue_days: overdueDays,
        current_fine: fine
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching overdue issues:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching overdue issues' });
  }
}

// POST /api/issues - Issue a book
async function issueBook(req, res) {
  let connection;
  try {
    const { student_id, book_id, issue_date, due_date } = req.body;

    // Validation
    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Please select a student' });
    }
    if (!book_id) {
      return res.status(400).json({ success: false, message: 'Please select a book' });
    }
    if (!due_date) {
      return res.status(400).json({ success: false, message: 'Due date is required' });
    }

    const issueDateStr = issue_date || new Date().toISOString().split('T')[0];

    if (new Date(due_date) < new Date(issueDateStr)) {
      return res.status(400).json({ success: false, message: 'Due date cannot be earlier than issue date' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check student existence
    const [students] = await connection.query('SELECT * FROM students WHERE id = ?', [student_id]);
    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Selected student was not found' });
    }
    const student = students[0];

    // Check book existence and quantity
    const [books] = await connection.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [book_id]);
    if (books.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Selected book was not found' });
    }
    const book = books[0];

    if (book.available_quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Book "${book.book_name}" is currently out of stock (available: 0)`
      });
    }

    // 1. Create issue record
    const [issueResult] = await connection.query(
      `INSERT INTO issues (student_id, book_id, issue_date, due_date, status, fine)
       VALUES (?, ?, ?, ?, 'Issued', 0.00)`,
      [student_id, book_id, issueDateStr, due_date]
    );
    const newIssueId = issueResult.insertId;

    // 2. Update book inventory: reduce available_quantity by 1, increase issued_quantity by 1
    await connection.query(
      `UPDATE books 
       SET available_quantity = available_quantity - 1,
           issued_quantity = issued_quantity + 1
       WHERE id = ?`,
      [book_id]
    );

    // Commit database transaction so data is safely stored in MySQL
    await connection.commit();
    connection.release();
    connection = null;

    // 3. Send email confirmation (failure does NOT rollback database)
    let emailStatusMessage = 'Email notification sent.';
    let emailSuccess = false;
    try {
      const mailResult = await sendIssueEmail({
        studentName: student.student_name,
        email: student.email,
        bookName: book.book_name,
        author: book.author,
        issueDate: issueDateStr,
        dueDate: due_date,
        studentId: student.id,
        issueId: newIssueId
      });

      if (mailResult && mailResult.success) {
        emailSuccess = true;
        emailStatusMessage = mailResult.simulated 
          ? 'Book issued successfully. (Email notification logged in simulation mode)'
          : 'Book issued successfully. Email notification sent.';
      } else {
        emailStatusMessage = 'Book issued successfully. Email notification failed.';
      }
    } catch (mailErr) {
      console.error('Email sending error during issue:', mailErr.message);
      emailStatusMessage = 'Book issued successfully. Email notification failed.';
    }

    return res.status(201).json({
      success: true,
      message: emailStatusMessage,
      emailSent: emailSuccess,
      data: {
        issueId: newIssueId,
        studentName: student.student_name,
        bookName: book.book_name,
        issueDate: issueDateStr,
        dueDate: due_date
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error issuing book:', error);
    return res.status(500).json({ success: false, message: 'Server error while issuing book: ' + error.message });
  }
}

module.exports = {
  getAllIssues,
  getActiveIssues,
  getOverdueIssues,
  issueBook,
  calculateDynamicFine
};
