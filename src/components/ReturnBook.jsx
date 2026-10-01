import React, { useState, useEffect } from 'react';
import { getActiveIssues, returnBook } from '../services/api';

const ReturnBook = () => {
  const [activeIssues, setActiveIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Return Modal State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [calculatedFine, setCalculatedFine] = useState(0);
  const [overdueDays, setOverdueDays] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active filter tab: 'all' | 'overdue'
  const [filterTab, setFilterTab] = useState('all');

  // Load active issued records
  const fetchActiveIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getActiveIssues();
      if (res.data && res.data.success) {
        setActiveIssues(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch issued books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveIssues();
  }, []);

  // Calculate fine whenever selectedIssue or returnDate changes
  useEffect(() => {
    if (!selectedIssue) return;

    const due = new Date(selectedIssue.due_date);
    due.setHours(0, 0, 0, 0);

    const ret = new Date(returnDate);
    ret.setHours(0, 0, 0, 0);

    const diffTime = ret.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      setOverdueDays(diffDays);
      setCalculatedFine(diffDays * 50);
    } else {
      setOverdueDays(0);
      setCalculatedFine(0);
    }
  }, [selectedIssue, returnDate]);

  // Open Return Modal
  const openReturnModal = (issue) => {
    setSelectedIssue(issue);
    setReturnDate(new Date().toISOString().split('T')[0]);
  };

  // Close Return Modal
  const closeReturnModal = () => {
    setSelectedIssue(null);
  };

  // Process return submission
  const handleConfirmReturn = async () => {
    if (!selectedIssue) return;

    try {
      setIsProcessing(true);
      const res = await returnBook(selectedIssue.id, { return_date: returnDate });

      if (res.data && res.data.success) {
        setActionMessage({
          type: res.data.emailSent ? 'success' : 'warning',
          text: res.data.message
        });
        closeReturnModal();
        fetchActiveIssues();
      }
    } catch (err) {
      alert(err.message || 'Failed to process book return');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter list based on selected tab
  const displayedIssues = activeIssues.filter((issue) => {
    if (filterTab === 'overdue') {
      return issue.current_overdue_days > 0;
    }
    return true;
  });

  const overdueCount = activeIssues.filter((i) => i.current_overdue_days > 0).length;

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Return Book & Fine Management</h2>
          <p className="text-muted mb-0">
            Process returned books, compute overdue penalty (₹50/day), and dispatch email receipts
          </p>
        </div>
        <button onClick={fetchActiveIssues} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 mt-2 mt-sm-0">
          <i className="bi bi-arrow-clockwise"></i> Refresh List
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage.text && (
        <div
          className={`alert alert-${actionMessage.type} alert-dismissible fade show d-flex align-items-center justify-content-between`}
          role="alert"
        >
          <div>
            <i className={`bi me-2 fs-5 ${actionMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            {actionMessage.text}
          </div>
          <button type="button" className="btn-close" onClick={() => setActionMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            {error}
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchActiveIssues}>
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilterTab('all')}
        >
          <i className="bi bi-journal-check me-1"></i>
          All Active Issues ({activeIssues.length})
        </button>
        <button
          className={`btn btn-sm ${filterTab === 'overdue' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setFilterTab('overdue')}
        >
          <i className="bi bi-exclamation-octagon-fill me-1"></i>
          Overdue Books ({overdueCount})
        </button>
      </div>

      {/* Active Issues Table */}
      <div className="custom-card p-0 mb-4">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th>Issue ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Book Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Current Fine</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Retrieving circulation records from MySQL...</p>
                  </td>
                </tr>
              ) : displayedIssues.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="bi bi-check2-circle fs-1 text-success d-block mb-2"></i>
                    {filterTab === 'overdue'
                      ? 'No books are currently overdue!'
                      : 'No active issued books found.'}
                  </td>
                </tr>
              ) : (
                displayedIssues.map((item) => (
                  <tr key={item.id} className={item.current_overdue_days > 0 ? 'table-warning-subtle' : ''}>
                    <td className="fw-bold text-secondary">#{item.id}</td>
                    <td className="fw-semibold text-dark">{item.student_name}</td>
                    <td className="text-muted small">
                      <i className="bi bi-envelope me-1"></i>
                      {item.email}
                    </td>
                    <td>
                      <span className="fw-semibold text-primary">{item.book_name}</span>
                    </td>
                    <td className="text-muted">{item.issue_date}</td>
                    <td>
                      <span className={item.current_overdue_days > 0 ? 'text-danger fw-bold' : 'text-dark'}>
                        {item.due_date}
                        {item.current_overdue_days > 0 && (
                          <span className="d-block small text-danger">
                            ({item.current_overdue_days} days late)
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={item.current_overdue_days > 0 ? 'badge-overdue' : 'badge-issued'}>
                        {item.current_overdue_days > 0 ? 'Overdue' : 'Issued'}
                      </span>
                    </td>
                    <td>
                      {item.current_fine > 0 ? (
                        <span className="fw-bold text-danger fs-6">
                          ₹{item.current_fine}
                        </span>
                      ) : (
                        <span className="text-success fw-medium">₹0</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => openReturnModal(item)}
                        className={`btn btn-sm d-flex align-items-center gap-1 mx-auto ${
                          item.current_overdue_days > 0 ? 'btn-danger' : 'btn-primary'
                        }`}
                      >
                        <i className="bi bi-arrow-return-left"></i> Return Book
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation & Fine Modal */}
      {selectedIssue && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-box-arrow-in-down-left text-primary me-2"></i>
                  Process Book Return (#{selectedIssue.id})
                </h5>
                <button type="button" className="btn-close" onClick={closeReturnModal}></button>
              </div>

              <div className="modal-body p-4">
                {/* Summary */}
                <div className="bg-light p-3 rounded mb-3 border">
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">Student</small>
                      <strong className="text-dark">{selectedIssue.student_name}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Email</small>
                      <span className="text-primary small">{selectedIssue.email}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Book</small>
                      <strong className="text-dark">{selectedIssue.book_name}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Due Date</small>
                      <strong className="text-danger">{selectedIssue.due_date}</strong>
                    </div>
                  </div>
                </div>

                {/* Return Date Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Return Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                  <small className="text-muted">Change date to simulate or test overdue return calculations</small>
                </div>

                {/* Fine Breakdown */}
                <div className={`p-3 rounded border mb-3 ${calculatedFine > 0 ? 'bg-danger-subtle border-danger' : 'bg-success-subtle border-success'}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-bold d-block">
                        {calculatedFine > 0 ? '⚠️ Overdue Fine Applicable' : '✅ No Fine (On Time)'}
                      </span>
                      <small className="text-secondary">
                        {overdueDays > 0
                          ? `${overdueDays} day(s) overdue × ₹50/day`
                          : 'Returned on or before due date'}
                      </small>
                    </div>
                    <div className="fs-3 fw-bold">
                      ₹{calculatedFine}
                    </div>
                  </div>
                </div>

                <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-envelope-check me-1"></i>
                  A confirmation return receipt with fine details will be automatically emailed to <strong>{selectedIssue.email}</strong>.
                </div>
              </div>

              <div className="modal-footer border-top">
                <button type="button" className="btn btn-outline-secondary" onClick={closeReturnModal} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-1"
                  onClick={handleConfirmReturn}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Updating MySQL & Emailing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2"></i>
                      Confirm Return
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnBook;
