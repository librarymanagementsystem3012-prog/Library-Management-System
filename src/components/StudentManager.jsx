import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../services/api';

const StudentManager = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Student Form State
  const initialNewStudent = { student_name: '', email: '', phone_number: '' };
  const [newStudent, setNewStudent] = useState(initialNewStudent);
  const [formErrors, setFormErrors] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ student_name: '', email: '', phone_number: '' });
  const [editError, setEditError] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudents({ search: searchTerm });
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchTerm]);

  // Validation
  const validate = (data) => {
    const errors = {};
    if (!data.student_name.trim()) errors.student_name = 'Student name is required';
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = 'Please enter a valid email format (e.g. student@college.edu)';
    }
    if (!data.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    }
    return errors;
  };

  // Add Student
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(newStudent);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      const res = await addStudent(newStudent);
      if (res.data && res.data.success) {
        setActionMessage(`Student "${newStudent.student_name}" registered successfully.`);
        setNewStudent(initialNewStudent);
        setFormErrors({});
        setShowAddForm(false);
        fetchStudents();
      }
    } catch (err) {
      alert(err.message || 'Failed to add student');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit
  const openEdit = (stu) => {
    setEditingStudent(stu);
    setEditFormData({
      student_name: stu.student_name,
      email: stu.email,
      phone_number: stu.phone_number
    });
    setEditError('');
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(editFormData);
    if (Object.keys(errors).length > 0) {
      setEditError(Object.values(errors)[0]);
      return;
    }

    try {
      setActionLoading(true);
      const res = await updateStudent(editingStudent.id, editFormData);
      if (res.data && res.data.success) {
        setActionMessage(`Student "${editFormData.student_name}" updated successfully.`);
        setEditingStudent(null);
        fetchStudents();
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update student');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async (stu) => {
    if (!window.confirm(`Are you sure you want to delete student "${stu.student_name}" (${stu.email})?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await deleteStudent(stu.id);
      if (res.data && res.data.success) {
        setActionMessage(`Student "${stu.student_name}" deleted successfully.`);
        fetchStudents();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Student Management</h2>
          <p className="text-muted mb-0">
            Maintain verified student profiles for circulation and automated email alerts
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary d-flex align-items-center gap-1 mt-2 mt-sm-0"
        >
          <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-person-plus-fill'}`}></i>
          {showAddForm ? 'Close Form' : 'Register New Student'}
        </button>
      </div>

      {/* Success Notification */}
      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check2-circle me-2 fs-5"></i>
          {actionMessage}
          <button type="button" className="btn-close" onClick={() => setActionMessage('')}></button>
        </div>
      )}

      {/* Real Email Delivery Notice */}
      <div className="alert alert-info border-info-subtle py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2 small">
        <i className="bi bi-envelope-check-fill text-primary fs-5"></i>
        <div>
          <strong>Live Email Delivery Active:</strong> When issuing or returning books, automated receipts are sent to the student's email address registered here. Enter your own email or real recipient emails to receive live notifications.
        </div>
      </div>

      {/* Add Student Card Form */}
      {showAddForm && (
        <div className="custom-card p-4 mb-4 bg-light border-primary">
          <h5 className="fw-bold mb-3 text-primary">
            <i className="bi bi-person-badge me-2"></i> Register Student Profile
          </h5>
          <form onSubmit={handleAddSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Student Name *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.student_name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Student Name"
                  value={newStudent.student_name}
                  onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                />
                {formErrors.student_name && <div className="invalid-feedback">{formErrors.student_name}</div>}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Email Address (For Notifications) *</label>
                <input
                  type="email"
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  placeholder="e.g. student@college.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
                {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Phone Number *</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                  placeholder="e.g. 9876543210"
                  value={newStudent.phone_number}
                  onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })}
                />
                {formErrors.phone_number && <div className="invalid-feedback">{formErrors.phone_number}</div>}
              </div>
            </div>

            <div className="mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Student'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewStudent(initialNewStudent);
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="custom-card p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Search students by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="custom-card p-0 mb-4">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading students from MySQL...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No student records found.
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.id}>
                    <td className="fw-bold text-secondary">#{stu.id}</td>
                    <td className="fw-semibold text-dark">{stu.student_name}</td>
                    <td>
                      <a href={`mailto:${stu.email}`} className="text-decoration-none text-primary">
                        <i className="bi bi-envelope me-1"></i>
                        {stu.email}
                      </a>
                    </td>
                    <td className="text-muted">
                      <i className="bi bi-telephone me-1"></i>
                      {stu.phone_number}
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          onClick={() => navigate('/notifications', {
                            state: {
                              recipientEmail: stu.email,
                              studentName: stu.student_name,
                              studentId: stu.id
                            }
                          })}
                          className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                          title="Send direct email to this student"
                        >
                          <i className="bi bi-send"></i> Send Email
                        </button>
                        <button
                          onClick={() => openEdit(stu)}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(stu)}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                          disabled={actionLoading}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  Edit Student Profile (#{editingStudent.id})
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditingStudent(null)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  {editError && <div className="alert alert-danger py-2">{editError}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Student Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.student_name}
                      onChange={(e) => setEditFormData({ ...editFormData, student_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.phone_number}
                      onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingStudent(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
