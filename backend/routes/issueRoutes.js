const express = require('express');
const router = express.Router();
const {
  getAllIssues,
  getActiveIssues,
  getOverdueIssues,
  issueBook
} = require('../controllers/issueController');

router.get('/', getAllIssues);
router.get('/active', getActiveIssues);
router.get('/overdue', getOverdueIssues);
router.post('/', issueBook);

module.exports = router;
