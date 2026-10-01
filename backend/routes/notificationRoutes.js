const express = require('express');
const router = express.Router();
const {
  sendCustomEmail,
  getNotifications,
  getDueReminders,
  triggerDueReminders,
  triggerOverdueReminders,
  handleTestEmail
} = require('../controllers/notificationController');

// Email sending endpoint
router.post('/send-email', sendCustomEmail);

// Test email endpoint
router.post('/test-email', handleTestEmail);

// Notification history endpoint
router.get('/', getNotifications);

// Due-date reminders endpoints
router.get('/due-reminders', getDueReminders);
router.post('/trigger-due-reminders', triggerDueReminders);
router.post('/trigger-overdue-reminders', triggerOverdueReminders);

module.exports = router;
