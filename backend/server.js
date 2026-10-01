const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Robust environment variable loading (checks current folder, parent, and root)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const { initializeDatabase, pool } = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');
const studentRoutes = require('./routes/studentRoutes');
const issueRoutes = require('./routes/issueRoutes');
const returnRoutes = require('./routes/returnRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { sendDueTomorrowEmail } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/books', bookRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/issues', returnRoutes); // Handles PUT /api/issues/:id/return
app.use('/api/returns', returnRoutes); // Handles PUT /api/returns/:id
app.use('/api/notifications', notificationRoutes);

// System Health & Diagnostics endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const [rows] = await pool.query('SELECT 1 as connected');
    if (rows && rows[0].connected === 1) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  return res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    emailConfigured: Boolean(
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      !process.env.EMAIL_USER.includes('your-email')
    )
  });
});

// Automated Daily Due-Date Reminder Cron Job (Runs every morning at 09:00 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily automatic due-date reminder check...');
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
        AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.issue_id = i.id 
            AND n.notification_type = 'Due Reminder'
            AND DATE(n.sent_at) = CURDATE()
        )
    `;
    const [eligibleIssues] = await pool.query(query);

    for (const item of eligibleIssues) {
      await sendDueTomorrowEmail({
        studentName: item.student_name,
        email: item.email,
        bookName: item.book_name,
        dueDate: item.due_date,
        studentId: item.student_id,
        issueId: item.issue_id
      });
      console.log(`✉️ Automated due reminder sent to ${item.email} for book "${item.book_name}"`);
    }
  } catch (cronErr) {
    console.error('Error during scheduled due reminder cron:', cronErr.message);
  }
});

// Central Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: err.message
  });
});

// Start Server and Initialize Database
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Library Management Backend running on port ${PORT}`);
    console.log(`📡 Base URL: http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
}

startServer();
