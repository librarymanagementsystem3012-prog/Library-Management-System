import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudents, getBooks, issueBook } from '../services/api';

const IssueBook = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(location.state?.preselectedBookId || '');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default 14 days lending period
    return d.toISOString().split('T')[0];
  });

  // Selected Student Details Display
  const [studentDetails, setStudentDetails] = useState(null);
  // Selected Book Details Display
  const [bookDetails, setBookDetails] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load students and available books from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingInitial(true);
        const [studentsRes, booksRes] = await Promise.all([
          getStudents(),
          getBooks()
        ]);

        if (studentsRes.data && studentsRes.data.success) {
          setStudents(studentsRes.data.data);
        }

        if (booksRes.data && booksRes.data.success) {
          // Show only books with available_quantity > 0
          const availableOnly = booksRes.data.data.filter((b) => b.available_quantity > 0);
          setBooks(availableOnly);

          // If preselected from location state
          if (location.state?.preselectedBookId) {
            const found = availableOnly.find((b) => b.id === Number(location.state.preselectedBookId));
            if (found) {
              setBookDetails(found);
            }
          }
        }
      } catch (err) {
        setFeedback({
          type: 'danger',
          message: err.message || 'Failed to load student/book lists from server'
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [location.state]);

  // When student selection changes, automatically update student info
  const handleStudentChange = (e) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    if (!id) {
      setStudentDetails(null);
      return;
    }
    const found = students.find((s) => s.id === Number(id));
    setStudentDetails(found || null);
  };

  // When book selection changes, update book details preview
  const handleBookChange = (e) => {
    const id = e.target.value;
    setSelectedBookId(id);
    if (!id) {
      setBookDetails(null);
      return;
    }
    const found = books.find((b) => b.id === Number(id));
    setBookDetails(found || null);
  };

  // Submit Issue
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!selectedStudentId) {
      setFeedback({ type: 'warning', message: 'Please select a student.' });
      return;
    }
    if (!selectedBookId) {
      setFeedback({ type: 'warning', message: 'Please select an available book.' });
      return;
    }
    if (!dueDate) {
      setFeedback({ type: 'warning', message: 'Please specify a return due date.' });
      return;
    }
    if (new Date(dueDate) < new Date(issueDate)) {
      setFeedback({ type: 'warning', message: 'Due date cannot be earlier than the issue date.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await issueBook({
        student_id: selectedStudentId,
        book_id: selectedBookId,
        issue_date: issueDate,
        due_date: dueDate
      });

      if (res.data && res.data.success) {
        // As per requirements: handle both email success or failure messaging
        const msg = res.data.message;
        const isEmailFail = msg.toLowerCase().includes('email notification failed');

        setFeedback({
          type: isEmailFail ? 'warning' : 'success',
          message: msg
        });

        // Reset fields
        setSelectedStudentId('');
        setSelectedBookId('');
        setStudentDetails(null);
        setBookDetails(null);

        // Refresh available books count
        const booksRes = await getBooks();
        if (booksRes.data && booksRes.data.success) {
          setBooks(booksRes.data.data.filter((b) => b.available_quantity > 0));
        }
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.message || 'Error occurred while issuing book'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-1">Issue Book to Student</h2>
        <p className="text-muted mb-0">
          Assign library inventory to registered students and trigger automatic email confirmation
        </p>
      </div>

      {feedback.message && (
        <div
          className={`alert alert-${feedback.type} alert-dismissible fade show d-flex align-items-center justify-content-between`}
          role="alert"
        >
          <div>
            <i className={`bi me-2 fs-5 ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            {feedback.message}
          </div>
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      {loadingInitial ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading students and book inventory...</p>
        </div>
      ) : (
        <div className="row g-4">
          {/* Main Issue Form */}
          <div className="col-12 col-lg-7">
            <div className="custom-card p-4">
              <h5 className="fw-bold mb-3 text-primary">
                <i className="bi bi-journal-plus me-2"></i> Issue Book Form
              </h5>

              <form onSubmit={handleSubmit}>
                {/* 1. Student Selection */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Select Student <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={handleStudentChange}
                    required
                  >
                    <option value="">-- Choose a registered student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} - {s.student_name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Book Selection (Only Available Books) */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Select Book <span className="text-danger">* (Showing only books with available copies)</span>
                  </label>
                  <select
                    className="form-select"
                    value={selectedBookId}
                    onChange={handleBookChange}
                    required
                  >
                    <option value="">-- Choose an available book --</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} - {b.book_name} by {b.author} [{b.available_quantity} available]
                      </option>
                    ))}
                  </select>
                  {books.length === 0 && (
                    <small className="text-danger d-block mt-1">
                      No books currently available in catalog. Please add stock in Book List.
                    </small>
                  )}
                </div>

                {/* 3. Issue Date & Due Date */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Issue Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Due Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                    <small className="text-muted">Standard period: 14 days</small>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center gap-2"
                    disabled={submitting || books.length === 0}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Processing & Sending Email...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-up-right"></i>
                        Confirm & Issue Book
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSelectedStudentId('');
                      setSelectedBookId('');
                      setStudentDetails(null);
                      setBookDetails(null);
                      setFeedback({ type: '', message: '' });
                    }}
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Verification & Live Preview Panel */}
          <div className="col-12 col-lg-5">
            {/* Student Preview Card */}
            <div className="custom-card p-4 mb-3">
              <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-person-lines-fill text-primary"></i>
                Student Information
              </h6>
              {studentDetails ? (
                <div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Student Name</small>
                    <strong className="fs-6 text-dark">{studentDetails.student_name}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Email (Receipt will be sent here)</small>
                    <span className="text-primary fw-medium">{studentDetails.email}</span>
                  </div>
                  <div className="mb-0">
                    <small className="text-muted d-block">Phone Number</small>
                    <span className="text-dark">{studentDetails.phone_number}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Select a student from the dropdown to automatically retrieve their registered details.
                </p>
              )}
            </div>

            {/* Book Preview Card */}
            <div className="custom-card p-4 mb-3">
              <h6 className="fw-bold text-secondary mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-book text-primary"></i>
                Selected Book Details
              </h6>
              {bookDetails ? (
                <div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Title</small>
                    <strong className="fs-6 text-dark">{bookDetails.book_name}</strong>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Author</small>
                    <span className="text-dark">{bookDetails.author}</span>
                  </div>
                  <div className="d-flex gap-2">
                    <span className="badge bg-light text-dark border">{bookDetails.category}</span>
                    <span className="badge-available">{bookDetails.available_quantity} copies remaining</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                  Select a book from the dropdown to preview stock and category details.
                </p>
              )}
            </div>

            {/* Email Notification Notice */}
            <div className="alert alert-info d-flex align-items-start gap-2 mb-0" style={{ fontSize: '0.86rem' }}>
              <i className="bi bi-info-circle-fill mt-1"></i>
              <div>
                <strong>Automated Nodemailer Integration:</strong>
                <p className="mb-0 mt-1">
                  Upon clicking confirm, the student will receive an email issue receipt with book title, author, and due date.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueBook;
