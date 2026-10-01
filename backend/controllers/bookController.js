const { pool } = require('../config/db');

// GET /api/books
async function getAllBooks(req, res) {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (book_name LIKE ? OR author LIKE ? OR category LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category.trim()) {
      query += ' AND category = ?';
      params.push(category.trim());
    }

    query += ' ORDER BY id DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching books: ' + error.message });
  }
}

// GET /api/books/:id
async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching book:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching book' });
  }
}

// POST /api/books
async function addBook(req, res) {
  try {
    const { book_name, author, category, quantity } = req.body;

    // Validation
    if (!book_name || !book_name.trim()) {
      return res.status(400).json({ success: false, message: 'Book name is required' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ success: false, message: 'Author is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number greater than 0' });
    }

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT id FROM books WHERE LOWER(book_name) = LOWER(?) AND LOWER(author) = LOWER(?)',
      [book_name.trim(), author.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A book with this name and author already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO books (book_name, author, category, total_quantity, available_quantity, issued_quantity)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [book_name.trim(), author.trim(), category.trim(), qty, qty]
    );

    const [newBook] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: newBook[0]
    });
  } catch (error) {
    console.error('Error adding book:', error);
    return res.status(500).json({ success: false, message: 'Server error while adding book: ' + error.message });
  }
}

// PUT /api/books/:id
async function updateBook(req, res) {
  try {
    const { id } = req.params;
    const { book_name, author, category, total_quantity } = req.body;

    // Validation
    if (!book_name || !book_name.trim()) {
      return res.status(400).json({ success: false, message: 'Book name is required' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ success: false, message: 'Author is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const [current] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const currentBook = current[0];
    let newTotal = currentBook.total_quantity;

    if (total_quantity !== undefined) {
      const parsedTotal = parseInt(total_quantity, 10);
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ success: false, message: 'Total quantity must be greater than 0' });
      }
      if (parsedTotal < currentBook.issued_quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot set total quantity below currently issued quantity (${currentBook.issued_quantity})`
        });
      }
      newTotal = parsedTotal;
    }

    const newAvailable = newTotal - currentBook.issued_quantity;

    await pool.query(
      `UPDATE books 
       SET book_name = ?, author = ?, category = ?, total_quantity = ?, available_quantity = ?
       WHERE id = ?`,
      [book_name.trim(), author.trim(), category.trim(), newTotal, newAvailable, id]
    );

    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating book: ' + error.message });
  }
}

// DELETE /api/books/:id
async function deleteBook(req, res) {
  try {
    const { id } = req.params;

    const [book] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (book.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book[0].issued_quantity > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. ${book[0].issued_quantity} copies are currently issued to students.`
      });
    }

    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting book: ' + error.message });
  }
}

// GET /api/books/categories/list
async function getCategories(req, res) {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM books ORDER BY category ASC');
    return res.status(200).json({ success: true, data: rows.map(r => r.category) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching categories' });
  }
}

// GET /api/books/dashboard/stats
async function getDashboardStats(req, res) {
  try {
    // 1. Total, Available, Issued books
    const [totals] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_quantity), 0) AS total_books,
        COALESCE(SUM(available_quantity), 0) AS available_books,
        COALESCE(SUM(issued_quantity), 0) AS issued_books,
        COUNT(DISTINCT category) AS total_categories
      FROM books
    `);

    // 2. Overdue books count
    const [overdue] = await pool.query(`
      SELECT COUNT(*) AS overdue_books
      FROM issues
      WHERE status = 'Issued' AND due_date < CURDATE()
    `);

    // 3. Books by Category
    const [byCategory] = await pool.query(`
      SELECT category, COUNT(*) as book_count, COALESCE(SUM(total_quantity), 0) as total_copies
      FROM books
      GROUP BY category
      ORDER BY total_copies DESC
    `);

    // 4. Monthly issue and return statistics (last 6 months)
    const [monthlyIssues] = await pool.query(`
      SELECT 
        DATE_FORMAT(issue_date, '%b %Y') AS month_label,
        DATE_FORMAT(issue_date, '%Y-%m') AS sort_month,
        COUNT(*) AS issue_count
      FROM issues
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY sort_month, month_label
      ORDER BY sort_month ASC
    `);

    const [monthlyReturns] = await pool.query(`
      SELECT 
        DATE_FORMAT(return_date, '%b %Y') AS month_label,
        DATE_FORMAT(return_date, '%Y-%m') AS sort_month,
        COUNT(*) AS return_count
      FROM issues
      WHERE status = 'Returned' AND return_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY sort_month, month_label
      ORDER BY sort_month ASC
    `);

    return res.status(200).json({
      success: true,
      data: {
        totalBooks: parseInt(totals[0].total_books, 10),
        availableBooks: parseInt(totals[0].available_books, 10),
        issuedBooks: parseInt(totals[0].issued_books, 10),
        categoriesCount: parseInt(totals[0].total_categories, 10),
        overdueBooks: parseInt(overdue[0].overdue_books, 10),
        booksByCategory: byCategory,
        monthlyIssues,
        monthlyReturns
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error while calculating statistics: ' + error.message });
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  getDashboardStats
};
