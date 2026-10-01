const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  getDashboardStats
} = require('../controllers/bookController');

// Specific endpoints before parameterized :id
router.get('/categories/list', getCategories);
router.get('/dashboard/stats', getDashboardStats);

// Book CRUD endpoints
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', addBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
