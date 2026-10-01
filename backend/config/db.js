const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

let rawPool = null;
let isConnected = false;

// Fallback in-memory dataset to ensure zero-crash robustness if MySQL password is not yet entered in .env
let fallbackStore = {
  books: [
    { id: 1, book_name: 'Java Programming', author: 'James Gosling & Herbert Schildt', category: 'Computer Science', total_quantity: 10, available_quantity: 8, issued_quantity: 2, created_at: '2026-09-01 10:00:00' },
    { id: 2, book_name: 'React JS - Modern Web Development', author: 'Dan Abramov & Sophie Alpert', category: 'Web Development', total_quantity: 8, available_quantity: 7, issued_quantity: 1, created_at: '2026-09-02 10:00:00' },
    { id: 3, book_name: 'Spring Boot in Action', author: 'Craig Walls', category: 'Backend Development', total_quantity: 6, available_quantity: 6, issued_quantity: 0, created_at: '2026-09-03 10:00:00' },
    { id: 4, book_name: 'Python Programming: A Modern Approach', author: 'Guido van Rossum & John Zelle', category: 'Data Science & AI', total_quantity: 12, available_quantity: 11, issued_quantity: 1, created_at: '2026-09-04 10:00:00' },
    { id: 5, book_name: 'Database Management Systems', author: 'Raghu Ramakrishnan & Johannes Gehrke', category: 'Database Systems', total_quantity: 15, available_quantity: 14, issued_quantity: 1, created_at: '2026-09-05 10:00:00' },
    { id: 6, book_name: 'Operating System Concepts', author: 'Abraham Silberschatz & Peter Baer Galvin', category: 'Computer Science', total_quantity: 7, available_quantity: 7, issued_quantity: 0, created_at: '2026-09-06 10:00:00' },
    { id: 7, book_name: 'Computer Networks', author: 'Andrew S. Tanenbaum', category: 'Networking', total_quantity: 9, available_quantity: 9, issued_quantity: 0, created_at: '2026-09-07 10:00:00' },
    { id: 8, book_name: 'Data Structures and Algorithms in C++', author: 'Adam Drozdek', category: 'Algorithms', total_quantity: 10, available_quantity: 10, issued_quantity: 0, created_at: '2026-09-08 10:00:00' }
  ],
  students: [
    { id: 1, student_name: 'Swetha Sharma', email: 'swetha@example.com', phone_number: '9876543210', created_at: '2026-09-01 10:00:00' },
    { id: 2, student_name: 'Rahul Verma', email: 'rahul.verma@example.com', phone_number: '9812345678', created_at: '2026-09-02 10:00:00' },
    { id: 3, student_name: 'Priya Patel', email: 'priya.patel@example.com', phone_number: '9898765432', created_at: '2026-09-03 10:00:00' },
    { id: 4, student_name: 'Ananya Roy', email: 'ananya.roy@example.com', phone_number: '9711223344', created_at: '2026-09-04 10:00:00' },
    { id: 5, student_name: 'Vikram Singh', email: 'vikram.singh@example.com', phone_number: '9655443322', created_at: '2026-09-05 10:00:00' }
  ],
  issues: [
    { id: 1, student_id: 1, book_id: 1, issue_date: '2026-09-10', due_date: '2026-09-24', return_date: null, status: 'Issued', fine: '0.00', created_at: '2026-09-10 10:00:00' },
    { id: 2, student_id: 2, book_id: 2, issue_date: '2026-09-20', due_date: '2026-09-29', return_date: null, status: 'Issued', fine: '0.00', created_at: '2026-09-20 11:30:00' },
    { id: 3, student_id: 3, book_id: 4, issue_date: '2026-09-22', due_date: '2026-10-06', return_date: null, status: 'Issued', fine: '0.00', created_at: '2026-09-22 14:15:00' },
    { id: 4, student_id: 4, book_id: 5, issue_date: '2026-09-23', due_date: '2026-10-07', return_date: null, status: 'Issued', fine: '0.00', created_at: '2026-09-23 09:40:00' },
    { id: 5, student_id: 5, book_id: 1, issue_date: '2026-09-01', due_date: '2026-09-15', return_date: '2026-09-18', status: 'Returned', fine: '150.00', created_at: '2026-09-01 10:00:00' }
  ],
  notifications: [
    { id: 1, student_id: 1, issue_id: 1, email: 'swetha@example.com', notification_type: 'Book Issued', subject: 'Library Book Issued - Java Programming', message: 'Dear Swetha Sharma,\n\nThe following book has been issued to you:\n\nBook: Java Programming\nAuthor: James Gosling & Herbert Schildt\nIssue Date: 2026-09-10\nDue Date: 2026-09-24\n\nPlease return the book on or before the due date.\n\nThank you,\nLibrary Management System', status: 'Sent', sent_at: '2026-09-10 10:00:00' },
    { id: 2, student_id: 2, issue_id: 2, email: 'rahul.verma@example.com', notification_type: 'Book Issued', subject: 'Library Book Issued - React JS - Modern Web Development', message: 'Dear Rahul Verma,\n\nThe following book has been issued to you:\n\nBook: React JS - Modern Web Development\nAuthor: Dan Abramov & Sophie Alpert\nIssue Date: 2026-09-20\nDue Date: 2026-09-29\n\nPlease return the book on or before the due date.\n\nThank you,\nLibrary Management System', status: 'Sent', sent_at: '2026-09-20 11:30:00' },
    { id: 3, student_id: 5, issue_id: 5, email: 'vikram.singh@example.com', notification_type: 'Book Returned', subject: 'Library Book Returned - Java Programming', message: 'Dear Vikram Singh,\n\nYour book has been successfully returned.\n\nBook: Java Programming\nReturn Date: 2026-09-18\nDue Date: 2026-09-15\nFine: ₹150.00\n\nThank you,\nLibrary Management System', status: 'Sent', sent_at: '2026-09-18 15:45:00' }
  ]
};

// Initialize MySQL Database connection
async function initializeDatabase() {
  try {
    const adminConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 3000
    });

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await adminConnection.end();

    rawPool = mysql.createPool(dbConfig);
    const conn = await rawPool.getConnection();
    isConnected = true;
    console.log(`✅ Successfully connected to MySQL database: ${dbConfig.database}`);

    // Create tables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_name VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        total_quantity INT NOT NULL DEFAULT 1,
        available_quantity INT NOT NULL DEFAULT 1,
        issued_quantity INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_book_name (book_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_student_name (student_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        book_id INT NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE NULL DEFAULT NULL,
        status ENUM('Issued', 'Returned') NOT NULL DEFAULT 'Issued',
        fine DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_due_date (due_date),
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NULL,
        issue_id INT NULL,
        email VARCHAR(255) NOT NULL,
        notification_type VARCHAR(100) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('Sent', 'Failed', 'Pending', 'Simulated') NOT NULL DEFAULT 'Sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_type (notification_type),
        INDEX idx_notif_status (status),
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE SET NULL,
        FOREIGN KEY (issue_id) REFERENCES issues (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check if sample data needed
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM books');
    if (rows[0].count === 0) {
      console.log('🌱 Seeding initial sample books and students into MySQL...');
      for (const b of fallbackStore.books) {
        await conn.query(
          'INSERT INTO books (id, book_name, author, category, total_quantity, available_quantity, issued_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [b.id, b.book_name, b.author, b.category, b.total_quantity, b.available_quantity, b.issued_quantity]
        );
      }
      for (const s of fallbackStore.students) {
        await conn.query(
          'INSERT INTO students (id, student_name, email, phone_number) VALUES (?, ?, ?, ?)',
          [s.id, s.student_name, s.email, s.phone_number]
        );
      }
      for (const i of fallbackStore.issues) {
        await conn.query(
          'INSERT INTO issues (id, student_id, book_id, issue_date, due_date, return_date, status, fine) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [i.id, i.student_id, i.book_id, i.issue_date, i.due_date, i.return_date, i.status, i.fine]
        );
      }
      for (const n of fallbackStore.notifications) {
        await conn.query(
          'INSERT INTO notifications (id, student_id, issue_id, email, notification_type, subject, message, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [n.id, n.student_id, n.issue_id, n.email, n.notification_type, n.subject, n.message, n.status, n.sent_at]
        );
      }
      console.log('✅ Initial database tables and sample data populated.');
    }

    conn.release();
    return true;
  } catch (err) {
    console.error(`❌ MySQL Connection Notice: ${err.message}`);
    console.log(`👉 To connect real MySQL: Enter DB_PASSWORD in backend/.env with your local MySQL root password.`);
    console.log(`💡 The backend will run in self-contained resilient mode until MySQL credentials are configured.`);
    isConnected = false;
    return false;
  }
}

// Resilient Pool Proxy: Delegates to real MySQL pool if available, else executes against structured in-memory store
const pool = {
  async query(sql, params = []) {
    if (isConnected && rawPool) {
      return await rawPool.query(sql, params);
    }
    return executeSimulatedQuery(sql, params);
  },

  async getConnection() {
    if (isConnected && rawPool) {
      return await rawPool.getConnection();
    }
    // Return mock connection interface
    return {
      query: (sql, params) => executeSimulatedQuery(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
  }
};

// In-Memory SQL Evaluator for Zero-Configuration demonstration
function executeSimulatedQuery(sql, params = []) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  const lower = cleanSql.toLowerCase();

  // 1. SELECT 1 as connected
  if (lower.startsWith('select 1')) {
    return [[{ connected: isConnected ? 1 : 0 }]];
  }

  // 2. BOOKS QUERIES
  if (lower.startsWith('select * from books') || lower.includes('from books where 1=1')) {
    let list = [...fallbackStore.books];
    if (cleanSql.includes('book_name LIKE') && params.length >= 3) {
      const term = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter(b => b.book_name.toLowerCase().includes(term) || b.author.toLowerCase().includes(term) || b.category.toLowerCase().includes(term));
    }
    if (cleanSql.includes('category = ?')) {
      const cat = params[params.length - 1];
      list = list.filter(b => b.category === cat);
    }
    if (cleanSql.includes('where id = ?')) {
      list = list.filter(b => b.id === Number(params[0]));
    }
    list.sort((a, b) => b.id - a.id);
    return [list];
  }

  if (lower.startsWith('select distinct category from books')) {
    const cats = Array.from(new Set(fallbackStore.books.map(b => b.category))).sort();
    return [cats.map(c => ({ category: c }))];
  }

  if (cleanSql.includes('SELECT COALESCE(SUM(total_quantity)')) {
    const total = fallbackStore.books.reduce((s, b) => s + b.total_quantity, 0);
    const available = fallbackStore.books.reduce((s, b) => s + b.available_quantity, 0);
    const issued = fallbackStore.books.reduce((s, b) => s + b.issued_quantity, 0);
    const cats = new Set(fallbackStore.books.map(b => b.category)).size;
    return [[{ total_books: total, available_books: available, issued_books: issued, total_categories: cats }]];
  }

  if (cleanSql.includes('SELECT COUNT(*) AS overdue_books')) {
    const today = new Date().toISOString().split('T')[0];
    const count = fallbackStore.issues.filter(i => i.status === 'Issued' && i.due_date < today).length;
    return [[{ overdue_books: count }]];
  }

  if (cleanSql.includes('SELECT category, COUNT(*) as book_count')) {
    const map = {};
    for (const b of fallbackStore.books) {
      if (!map[b.category]) map[b.category] = { category: b.category, book_count: 0, total_copies: 0 };
      map[b.category].book_count += 1;
      map[b.category].total_copies += b.total_quantity;
    }
    return [Object.values(map)];
  }

  if (cleanSql.includes('DATE_FORMAT(issue_date')) {
    return [[{ month_label: 'Sep 2026', sort_month: '2026-09', issue_count: fallbackStore.issues.length }]];
  }

  if (cleanSql.includes('DATE_FORMAT(return_date')) {
    const ret = fallbackStore.issues.filter(i => i.status === 'Returned').length;
    return [[{ month_label: 'Sep 2026', sort_month: '2026-09', return_count: ret }]];
  }

  if (lower.startsWith('select id from books where lower(book_name) = lower(?)')) {
    const found = fallbackStore.books.filter(b => b.book_name.toLowerCase() === params[0].toLowerCase() && b.author.toLowerCase() === params[1].toLowerCase());
    return [found];
  }

  if (lower.startsWith('insert into books')) {
    const newId = fallbackStore.books.length > 0 ? Math.max(...fallbackStore.books.map(b => b.id)) + 1 : 1;
    const book = {
      id: newId,
      book_name: params[0],
      author: params[1],
      category: params[2],
      total_quantity: params[3],
      available_quantity: params[4],
      issued_quantity: 0,
      created_at: new Date().toISOString()
    };
    fallbackStore.books.push(book);
    return [{ insertId: newId }];
  }

  if (lower.startsWith('update books set book_name = ?')) {
    const id = Number(params[5]);
    const b = fallbackStore.books.find(x => x.id === id);
    if (b) {
      b.book_name = params[0];
      b.author = params[1];
      b.category = params[2];
      b.total_quantity = params[3];
      b.available_quantity = params[4];
    }
    return [{ affectedRows: 1 }];
  }

  if (lower.startsWith('delete from books where id = ?')) {
    const id = Number(params[0]);
    fallbackStore.books = fallbackStore.books.filter(b => b.id !== id);
    return [{ affectedRows: 1 }];
  }

  // 3. STUDENTS QUERIES
  if (cleanSql.includes('FROM students WHERE 1=1') || lower.startsWith('select * from students')) {
    let list = [...fallbackStore.students];
    if (cleanSql.includes('student_name LIKE') && params[0]) {
      const term = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter(s => s.student_name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.phone_number.includes(term));
    }
    if (cleanSql.includes('where id = ?')) {
      list = list.filter(s => s.id === Number(params[0]));
    }
    list.sort((a, b) => b.id - a.id);
    return [list];
  }

  if (lower.startsWith('select id from students where lower(email)')) {
    const email = params[0].toLowerCase();
    const excludeId = params[1] ? Number(params[1]) : null;
    const found = fallbackStore.students.filter(s => s.email.toLowerCase() === email && s.id !== excludeId);
    return [found];
  }

  if (lower.startsWith('insert into students')) {
    const newId = fallbackStore.students.length > 0 ? Math.max(...fallbackStore.students.map(s => s.id)) + 1 : 1;
    const student = {
      id: newId,
      student_name: params[0],
      email: params[1],
      phone_number: params[2],
      created_at: new Date().toISOString()
    };
    fallbackStore.students.push(student);
    return [{ insertId: newId }];
  }

  if (lower.startsWith('update students set student_name = ?')) {
    const id = Number(params[3]);
    const s = fallbackStore.students.find(x => x.id === id);
    if (s) {
      s.student_name = params[0];
      s.email = params[1];
      s.phone_number = params[2];
    }
    return [{ affectedRows: 1 }];
  }

  if (lower.startsWith('delete from students where id = ?')) {
    const id = Number(params[0]);
    fallbackStore.students = fallbackStore.students.filter(s => s.id !== id);
    return [{ affectedRows: 1 }];
  }

  // 4. ISSUES QUERIES
  if (cleanSql.includes('FROM issues i') || lower.startsWith('select i.*')) {
    let list = fallbackStore.issues.map(iss => {
      const s = fallbackStore.students.find(x => x.id === iss.student_id) || {};
      const b = fallbackStore.books.find(x => x.id === iss.book_id) || {};
      return {
        ...iss,
        student_name: s.student_name || 'Student',
        email: s.email || 'student@example.com',
        phone_number: s.phone_number || '',
        book_name: b.book_name || 'Book',
        author: b.author || 'Author',
        category: b.category || 'General'
      };
    });

    if (cleanSql.includes("i.status = 'Issued'") && !cleanSql.includes('curdate()')) {
      list = list.filter(i => i.status === 'Issued');
    }
    if (cleanSql.includes("i.due_date < curdate()")) {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(i => i.status === 'Issued' && i.due_date < today);
    }
    if (cleanSql.includes('where i.id = ?')) {
      list = list.filter(i => i.id === Number(params[0]));
    }
    return [list];
  }

  if (lower.startsWith('insert into issues')) {
    const newId = fallbackStore.issues.length > 0 ? Math.max(...fallbackStore.issues.map(i => i.id)) + 1 : 1;
    const issue = {
      id: newId,
      student_id: Number(params[0]),
      book_id: Number(params[1]),
      issue_date: params[2],
      due_date: params[3],
      return_date: null,
      status: 'Issued',
      fine: '0.00',
      created_at: new Date().toISOString()
    };
    fallbackStore.issues.push(issue);
    return [{ insertId: newId }];
  }

  if (lower.startsWith('update books set available_quantity = available_quantity - 1')) {
    const bId = Number(params[0]);
    const b = fallbackStore.books.find(x => x.id === bId);
    if (b) {
      b.available_quantity = Math.max(0, b.available_quantity - 1);
      b.issued_quantity += 1;
    }
    return [{ affectedRows: 1 }];
  }

  if (lower.startsWith('update issues set return_date = ?')) {
    const retDate = params[0];
    const fine = params[1];
    const id = Number(params[2]);
    const iss = fallbackStore.issues.find(x => x.id === id);
    if (iss) {
      iss.return_date = retDate;
      iss.status = 'Returned';
      iss.fine = fine.toString();
    }
    return [{ affectedRows: 1 }];
  }

  if (lower.startsWith('update books set available_quantity = available_quantity + 1')) {
    const bId = Number(params[0]);
    const b = fallbackStore.books.find(x => x.id === bId);
    if (b) {
      b.available_quantity += 1;
      b.issued_quantity = Math.max(0, b.issued_quantity - 1);
    }
    return [{ affectedRows: 1 }];
  }

  // 5. NOTIFICATIONS QUERIES
  if (cleanSql.includes('FROM notifications n')) {
    let list = fallbackStore.notifications.map(n => {
      const s = fallbackStore.students.find(x => x.id === n.student_id);
      const iss = fallbackStore.issues.find(x => x.id === n.issue_id);
      const b = iss ? fallbackStore.books.find(x => x.id === iss.book_id) : null;
      return {
        ...n,
        student_name: s ? s.student_name : null,
        book_name: b ? b.book_name : null
      };
    });

    if (cleanSql.includes('n.email LIKE') && params.length >= 4) {
      const term = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter(n => (n.email && n.email.toLowerCase().includes(term)) || (n.subject && n.subject.toLowerCase().includes(term)));
    }
    if (cleanSql.includes('n.notification_type = ?')) {
      const type = params.find(p => ['Book Issued', 'Due Reminder', 'Book Returned', 'Overdue Reminder', 'General Notice'].includes(p));
      if (type) list = list.filter(n => n.notification_type === type);
    }
    if (cleanSql.includes('n.status = ?')) {
      const status = params.find(p => ['Sent', 'Failed', 'Pending', 'Simulated'].includes(p));
      if (status) list = list.filter(n => n.status === status);
    }

    list.sort((a, b) => b.id - a.id);
    return [list];
  }

  if (lower.startsWith('insert into notifications')) {
    const newId = fallbackStore.notifications.length > 0 ? Math.max(...fallbackStore.notifications.map(n => n.id)) + 1 : 1;
    const notif = {
      id: newId,
      student_id: params[0],
      issue_id: params[1],
      email: params[2],
      notification_type: params[3],
      subject: params[4],
      message: params[5],
      status: params[6],
      sent_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    fallbackStore.notifications.unshift(notif);
    return [{ insertId: newId }];
  }

  return [[]];
}

module.exports = {
  pool,
  initializeDatabase
};
