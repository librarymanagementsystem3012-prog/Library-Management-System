import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getNotifications,
  getDueReminders,
  triggerDueReminders,
  triggerOverdueReminders,
  sendEmail,
  getStudents,
  checkHealth
} from '../services/api';

const Notifications = () => {
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [dueApproaching, setDueApproaching] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Action status message
  const [actionStatus, setActionStatus] = useState({ type: '', message: '' });
  const [processingAction, setProcessingAction] = useState(false);

  // Send Email Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    studentId: '',
    email: '',
    studentName: '',
    subject: 'Library Notice',
    bookName: '',
    dueDate: '',
    message: ''
  });

  // Selected Notification details modal
  const [viewMessage, setViewMessage] = useState(null);

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notifRes, dueRes, healthRes, studentRes] = await Promise.all([
        getNotifications({
          search: searchTerm,
          type: typeFilter,
          status: statusFilter,
          date: dateFilter
        }),
        getDueReminders(),
        checkHealth().catch(() => ({ data: { status: 'offline', emailConfigured: false } })),
        getStudents().catch(() => ({ data: { data: [] } }))
      ]);

      if (notifRes.data && notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
      if (dueRes.data && dueRes.data.success) {
        setDueApproaching(dueRes.data.data);
      }
      if (healthRes.data) {
        setSystemHealth(healthRes.data);
      }
      if (studentRes.data && studentRes.data.data) {
        setStudents(studentRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, [searchTerm, typeFilter, statusFilter, dateFilter]);

  // Handle prefill if opened from Student Manager or another page
  useEffect(() => {
    if (location.state?.recipientEmail) {
      setEmailForm((prev) => ({
        ...prev,
        email: location.state.recipientEmail || '',
        studentName: location.state.studentName || '',
        studentId: location.state.studentId || ''
      }));
      setShowSendModal(true);
    }
  }, [location.state]);

  // Handle student selection in Send Email modal
  const handleStudentSelect = (e) => {
    const sId = e.target.value;
    if (!sId) {
      setEmailForm({
        ...emailForm,
        studentId: '',
        email: '',
        studentName: ''
      });
      return;
    }

    const found = students.find((s) => s.id === Number(sId));
    if (found) {
      setEmailForm({
        ...emailForm,
        studentId: found.id,
        email: found.email,
        studentName: found.student_name
      });
    }
  };

  // Trigger Due Date Reminders for Tomorrow
  const handleTriggerDueReminders = async () => {
    if (!window.confirm('Send automatic email reminders to all students whose books are due tomorrow? (Duplicate sends today will be skipped)')) {
      return;
    }

    try {
      setProcessingAction(true);
      const res = await triggerDueReminders();
      if (res.data && res.data.success) {
        setActionStatus({
          type: 'success',
          message: res.data.message
        });
        fetchNotificationData();
      }
    } catch (err) {
      setActionStatus({
        type: 'danger',
        message: 'Failed to dispatch due reminders: ' + err.message
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Trigger Overdue Reminders
  const handleTriggerOverdueReminders = async () => {
    if (!window.confirm('Send overdue email reminders with penalty notice (₹50/day) to all overdue borrowers?')) {
      return;
    }

    try {
      setProcessingAction(true);
      const res = await triggerOverdueReminders();
      if (res.data && res.data.success) {
        setActionStatus({
          type: 'success',
          message: res.data.message
        });
        fetchNotificationData();
      }
    } catch (err) {
      setActionStatus({
        type: 'danger',
        message: 'Failed to dispatch overdue reminders: ' + err.message
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Send Email Submit Handler
  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.email.trim()) {
      alert('Recipient email address is required.');
      return;
    }

    try {
      setProcessingAction(true);
      const res = await sendEmail(emailForm);
      if (res.data && res.data.success) {
        setActionStatus({
          type: 'success',
          message: res.data.message || `Email successfully dispatched to ${emailForm.email.trim()}`
        });
        setShowSendModal(false);
        setEmailForm({
          studentId: '',
          email: '',
          studentName: '',
          subject: 'Library Notice',
          bookName: '',
          dueDate: '',
          message: ''
        });
        fetchNotificationData();
      }
    } catch (err) {
      setActionStatus({
        type: 'danger',
        message: 'Email failed to send: ' + (err.message || 'Network error')
      });
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Email Notifications & Reminder System</h2>
          <p className="text-muted mb-0">
            Nodemailer Gmail SMTP dispatch history, due-date reminder automation, and delivery logs
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-2 mt-sm-0">
          <button
            onClick={() => setShowSendModal(true)}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1"
          >
            <i className="bi bi-send-fill"></i> Send Email
          </button>
          <button
            onClick={handleTriggerDueReminders}
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            disabled={processingAction}
          >
            <i className="bi bi-bell-fill"></i> Run Due Reminders
          </button>
          <button
            onClick={handleTriggerOverdueReminders}
            className="btn btn-danger btn-sm d-flex align-items-center gap-1"
            disabled={processingAction}
          >
            <i className="bi bi-exclamation-triangle-fill"></i> Send Overdue Alerts
          </button>
        </div>
      </div>

      {/* SMTP Connection Info Banner */}
      <div className="alert alert-light border shadow-sm p-3 mb-4 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success p-2">
            <i className="bi bi-shield-check fs-6"></i>
          </span>
          <div>
            <strong className="d-block text-dark">
              SMTP Status: {systemHealth?.emailConfigured ? 'Gmail SMTP Active (Live Delivery)' : 'Checking SMTP Status...'}
            </strong>
            <small className="text-muted">
              Sender Account: <code>library.system1230@gmail.com</code> &bull; Real HTML receipts & reminders are delivered directly to student email inboxes.
            </small>
          </div>
        </div>
        <div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
            <i className="bi bi-info-circle me-1"></i> Tip: Use real student emails in Student Manager to receive emails
          </span>
        </div>
      </div>

      {/* Action Status Feedback */}
      {actionStatus.message && (
        <div
          className={`alert alert-${actionStatus.type} alert-dismissible fade show d-flex align-items-center justify-content-between`}
          role="alert"
        >
          <div>
            <i className={`bi me-2 fs-5 ${actionStatus.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
            {actionStatus.message}
          </div>
          <button type="button" className="btn-close" onClick={() => setActionStatus({ type: '', message: '' })}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            {error}
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchNotificationData}>
            Retry
          </button>
        </div>
      )}

      {/* Approaching Due Date Banner */}
      {dueApproaching.length > 0 && (
        <div className="alert alert-warning border-warning p-3 mb-4 custom-card">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold text-warning-emphasis mb-0">
              <i className="bi bi-clock-history me-2"></i>
              {dueApproaching.length} Book(s) Approaching Due Date (Due within 3 days)
            </h6>
            <button
              onClick={handleTriggerDueReminders}
              className="btn btn-warning btn-sm fw-semibold"
              disabled={processingAction}
            >
              Dispatch Reminders Now
            </button>
          </div>
          <div className="row g-2 mt-1">
            {dueApproaching.map((item) => (
              <div key={item.issue_id} className="col-12 col-md-6 col-lg-4">
                <div className="p-2 bg-white rounded border small">
                  <strong>{item.student_name}</strong> ({item.email})
                  {item.email.includes('@example.com') && (
                    <span className="badge bg-warning-subtle text-warning-emphasis ms-1" style={{ fontSize: '0.7rem' }}>
                      Sample Email
                    </span>
                  )}
                  <br />
                  <span className="text-secondary">Book: {item.book_name}</span><br />
                  <span className="text-danger fw-semibold">Due: {item.due_date} ({item.days_left} day(s) left)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="custom-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Search Records</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by student, email, book, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Notification Type</label>
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Book Issued">Book Issued</option>
              <option value="Due Reminder">Due Reminder</option>
              <option value="Book Returned">Book Returned</option>
              <option value="Overdue Reminder">Overdue Reminder</option>
              <option value="Direct Email">Direct Email</option>
              <option value="General Notice">General Notice</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted">Delivery Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Sent">Sent (Live SMTP)</option>
              <option value="Simulated">Simulated</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label small fw-semibold text-muted">Date Filter</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Notification History Table */}
      <div className="custom-card p-0 mb-4">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Book Name / Topic</th>
                <th>Notification Type</th>
                <th>Sent Date</th>
                <th>Delivery Status</th>
                <th className="text-center">View Content</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading email audit logs from database...</p>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No email notification logs found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td className="text-secondary fw-bold">#{notif.id}</td>
                    <td className="fw-semibold text-dark">
                      {notif.student_name || 'Direct Recipient'}
                    </td>
                    <td className="text-primary small">
                      <i className="bi bi-envelope me-1"></i>
                      {notif.email}
                      {notif.email.includes('@example.com') && (
                        <span className="badge bg-light text-secondary border ms-1" title="Sample placeholder email address">
                          Sample
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-dark small">
                        {notif.book_name || notif.subject || 'Direct Notification'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          notif.notification_type === 'Book Issued'
                            ? 'bg-primary-subtle text-primary border border-primary-subtle'
                            : notif.notification_type === 'Book Returned'
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : notif.notification_type === 'Overdue Reminder'
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : notif.notification_type === 'Direct Email'
                            ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                            : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        }`}
                      >
                        {notif.notification_type}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {notif.sent_at}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          notif.status === 'Sent'
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : notif.status === 'Simulated'
                            ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                            : notif.status === 'Failed'
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : 'bg-secondary-subtle text-secondary'
                        }`}
                      >
                        {notif.status === 'Sent' && <i className="bi bi-check-circle me-1"></i>}
                        {notif.status === 'Simulated' && <i className="bi bi-laptop me-1"></i>}
                        {notif.status === 'Failed' && <i className="bi bi-x-circle me-1"></i>}
                        {notif.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => setViewMessage(notif)}
                        className="btn btn-outline-secondary btn-sm"
                        title="View sent email subject & text"
                      >
                        <i className="bi bi-eye"></i> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-send-fill text-primary me-2"></i>
                  Send Email to Student / User
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSendModal(false)}></button>
              </div>
              <form onSubmit={handleSendEmailSubmit}>
                <div className="modal-body p-4">
                  {/* Student Selector Dropdown */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Select Registered Student <span className="text-muted fw-normal">(Optional: Auto-fills email & name)</span>
                    </label>
                    <select
                      className="form-select"
                      value={emailForm.studentId}
                      onChange={handleStudentSelect}
                    >
                      <option value="">-- Choose student or enter custom email below --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          #{s.id} - {s.student_name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Recipient Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. student@gmail.com"
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Recipient / Student Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Swetha Sharma"
                        value={emailForm.studentName}
                        onChange={(e) => setEmailForm({ ...emailForm, studentName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Important Library Announcement / Book Notice"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Book Name (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Introduction to Algorithms"
                        value={emailForm.bookName}
                        onChange={(e) => setEmailForm({ ...emailForm, bookName: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Due Date (Optional)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={emailForm.dueDate}
                        onChange={(e) => setEmailForm({ ...emailForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Message Content <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows="4"
                      className="form-control"
                      placeholder="Type the message or notification body you wish to send to the recipient..."
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      required
                    ></textarea>
                    <small className="text-muted">
                      This message will be styled and delivered directly to the recipient's inbox via Gmail SMTP.
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowSendModal(false)}
                    disabled={processingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                    disabled={processingAction}
                  >
                    {processingAction ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        Send Email Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Full Email Content */}
      {viewMessage && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-envelope-paper text-primary me-2"></i>
                  {viewMessage.subject}
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewMessage(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between mb-3 text-muted small pb-2 border-bottom">
                  <span>To: <strong>{viewMessage.email}</strong></span>
                  <span>Date: {viewMessage.sent_at}</span>
                </div>
                <div className="bg-light p-3 rounded border font-monospace small" style={{ whiteSpace: 'pre-wrap' }}>
                  {viewMessage.message}
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setViewMessage(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
