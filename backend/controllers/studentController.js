const { pool } = require('../config/db');

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{7,15}$/;

// GET /api/students
async function getAllStudents(req, res) {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (student_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching students: ' + error.message });
  }
}

// GET /api/students/:id
async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching student' });
  }
}

// POST /api/students
async function addStudent(req, res) {
  try {
    const { student_name, email, phone_number } = req.body;

    // Validation
    if (!student_name || !student_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address (e.g. swetha@example.com)' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!PHONE_REGEX.test(phone_number.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number (digits and optional +/hyphen)' });
    }

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM students WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A student with this email address already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO students (student_name, email, phone_number) VALUES (?, ?, ?)',
      [student_name.trim(), email.trim().toLowerCase(), phone_number.trim()]
    );

    const [newStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: newStudent[0]
    });
  } catch (error) {
    console.error('Error adding student:', error);
    return res.status(500).json({ success: false, message: 'Server error while registering student: ' + error.message });
  }
}

// PUT /api/students/:id
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { student_name, email, phone_number } = req.body;

    // Validation
    if (!student_name || !student_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const [current] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check duplicate email for another student
    const [existing] = await pool.query(
      'SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND id != ?',
      [email.trim(), id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered to another student' });
    }

    await pool.query(
      'UPDATE students SET student_name = ?, email = ?, phone_number = ? WHERE id = ?',
      [student_name.trim(), email.trim().toLowerCase(), phone_number.trim(), id]
    );

    const [updated] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Student details updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating student: ' + error.message });
  }
}

// DELETE /api/students/:id
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    const [student] = await pool.query('SELECT * FROM students WHERE id = ?', [id]);
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if student has active book issues
    const [activeIssues] = await pool.query(
      "SELECT id FROM issues WHERE student_id = ? AND status = 'Issued'",
      [id]
    );
    if (activeIssues.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student. They have ${activeIssues.length} currently issued book(s). Please return them first.`
      });
    }

    await pool.query('DELETE FROM students WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting student: ' + error.message });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent
};
