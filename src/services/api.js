import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMessage = 'An unexpected error occurred';
    if (!error.response) {
      customMessage = 'Backend server is offline or unreachable. Please ensure the Node.js server is running on port 5000.';
    } else if (error.response.data && error.response.data.message) {
      customMessage = error.response.data.message;
    } else {
      customMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
    }
    return Promise.reject(new Error(customMessage));
  }
);

// Books API
export const getBooks = (params) => api.get('/books', { params });
export const getBookById = (id) => api.get(`/books/${id}`);
export const addBook = (bookData) => api.post('/books', bookData);
export const updateBook = (id, bookData) => api.put(`/books/${id}`, bookData);
export const deleteBook = (id) => api.delete(`/books/${id}`);
export const getCategories = () => api.get('/books/categories/list');
export const getDashboardStats = () => api.get('/books/dashboard/stats');

// Students API
export const getStudents = (params) => api.get('/students', { params });
export const getStudentById = (id) => api.get(`/students/${id}`);
export const addStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Issues API
export const getAllIssues = () => api.get('/issues');
export const getActiveIssues = () => api.get('/issues/active');
export const getOverdueIssues = () => api.get('/issues/overdue');
export const issueBook = (issueData) => api.post('/issues', issueData);

// Returns API
export const returnBook = (issueId, returnData) => api.put(`/issues/${issueId}/return`, returnData || {});

// Notifications & Email API
export const sendEmail = (data) => api.post('/notifications/send-email', data);
export const sendCustomEmail = (data) => api.post('/notifications/send-email', data);
export const sendTestEmail = (email) => api.post('/notifications/test-email', { email });
export const getNotifications = (params) => api.get('/notifications', { params });
export const getDueReminders = () => api.get('/notifications/due-reminders');
export const triggerDueReminders = () => api.post('/notifications/trigger-due-reminders');
export const triggerOverdueReminders = () => api.post('/notifications/trigger-overdue-reminders');

// System Health Check
export const checkHealth = () => api.get('/health');

export default api;
