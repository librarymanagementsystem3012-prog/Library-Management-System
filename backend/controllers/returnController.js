const { pool } = require('../config/db');
const { sendReturnEmail } = require('../services/emailService');

// Calculate fine based on due date and return date
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

  return {
    isOverdue: false,
    overdueDays: 0,
    fine: 0
  };
}

// PUT /api/issues/:id/return - Process book return
async function returnBook(req, res) {
  let connection;
  try {
    const { id } = req.params;
    const { return_date } = req.body;

    const returnDateStr = return_date || new Date().toISOString().split('T')[0];

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch issue record with student and book info
    const [issues] = await connection.query(
      `SELECT 
        i.*,
        s.student_name,
        s.email,
        s.phone_number,
        b.book_name,
        b.author
       FROM issues i
       JOIN students s ON i.student_id = s.id
       JOIN books b ON i.book_id = b.id
       WHERE i.id = ? FOR UPDATE`,
      [id]
    );

    if (issues.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    const issue = issues[0];

    if (issue.status === 'Returned') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `This book has already been returned on ${issue.return_date}`
      });
    }

    // 2. Calculate fine (₹50 per overdue day)
    const { overdueDays, fine } = calculateFine(issue.due_date, returnDateStr);

    // 3. Update issue record
    await connection.query(
      `UPDATE issues 
       SET return_date = ?, status = 'Returned', fine = ?
       WHERE id = ?`,
      [returnDateStr, fine, id]
    );

    // 4. Update book inventory: increase available_quantity by 1, decrease issued_quantity by 1
    await connection.query(
      `UPDATE books 
       SET available_quantity = available_quantity + 1,
           issued_quantity = GREATEST(0, issued_quantity - 1)
       WHERE id = ?`,
      [issue.book_id]
    );

    await connection.commit();
    connection.release();
    connection = null;

    // 5. Send return confirmation email
    let emailStatusMessage = 'Return confirmed and email sent.';
    let emailSuccess = false;
    try {
      const mailResult = await sendReturnEmail({
        studentName: issue.student_name,
        email: issue.email,
        bookName: issue.book_name,
        returnDate: returnDateStr,
        dueDate: issue.due_date,
        fine: fine.toFixed(2),
        studentId: issue.student_id,
        issueId: issue.id
      });

      if (mailResult && mailResult.success) {
        emailSuccess = true;
        emailStatusMessage = mailResult.simulated
          ? 'Book returned successfully. (Email notification logged in simulation mode)'
          : 'Book returned successfully. Email notification sent.';
      } else {
        emailStatusMessage = 'Book returned successfully. Email notification failed.';
      }
    } catch (mailErr) {
      console.error('Email sending error during return:', mailErr.message);
      emailStatusMessage = 'Book returned successfully. Email notification failed.';
    }

    return res.status(200).json({
      success: true,
      message: emailStatusMessage,
      emailSent: emailSuccess,
      data: {
        issueId: issue.id,
        bookName: issue.book_name,
        studentName: issue.student_name,
        returnDate: returnDateStr,
        dueDate: issue.due_date,
        overdueDays,
        fine
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error returning book:', error);
    return res.status(500).json({ success: false, message: 'Server error while returning book: ' + error.message });
  }
}

module.exports = {
  returnBook,
  calculateFine
};
