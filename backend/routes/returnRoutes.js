const express = require('express');
const router = express.Router();
const { returnBook } = require('../controllers/returnController');

// Support both PUT /api/issues/:id/return and PUT /api/returns/:id
router.put('/:id/return', returnBook);
router.put('/:id', returnBook);

module.exports = router;
