import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addBook } from '../services/api';

const AddBook = () => {
  const navigate = useNavigate();

  const initialFormState = {
    book_id: '',
    book_name: '',
    author: '',
    category: '',
    quantity: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.book_name.trim()) {
      newErrors.book_name = 'Book name is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const qty = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const handleReset = () => {
    setFormData(initialFormState);
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        book_name: formData.book_name.trim(),
        author: formData.author.trim(),
        category: formData.category.trim(),
        quantity: parseInt(formData.quantity, 10)
      };

      const res = await addBook(payload);

      if (res.data && res.data.success) {
        setSuccessMessage(`✅ Book "${formData.book_name}" added successfully to MySQL database with ${formData.quantity} copies!`);
        setFormData(initialFormState);
        setErrors({});
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add book. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-1">Add New Book</h2>
        <p className="text-muted mb-0">
          Enter publication and inventory details to register new books into MySQL
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="custom-card p-4">
            {/* Success Alert */}
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between" role="alert">
                <div>
                  <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                  {successMessage}
                </div>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm ms-3"
                  onClick={() => navigate('/books')}
                >
                  View Book List →
                </button>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="alert alert-danger fade show d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Optional Book ID info */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Book ID <span className="text-muted fw-normal">(Auto-generated primary key in MySQL)</span>
                </label>
                <input
                  type="text"
                  name="book_id"
                  className="form-control bg-light"
                  value={formData.book_id || 'Auto-assigned by MySQL on save'}
                  disabled
                />
              </div>

              {/* Book Name */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Book Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="book_name"
                  className={`form-control ${errors.book_name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Operating System Concepts"
                  value={formData.book_name}
                  onChange={handleChange}
                />
                {errors.book_name && <div className="invalid-feedback">{errors.book_name}</div>}
              </div>

              {/* Author */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Author <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  className={`form-control ${errors.author ? 'is-invalid' : ''}`}
                  placeholder="e.g. Abraham Silberschatz & Peter Baer Galvin"
                  value={formData.author}
                  onChange={handleChange}
                />
                {errors.author && <div className="invalid-feedback">{errors.author}</div>}
              </div>

              {/* Category */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Category <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  list="category-suggestions"
                  className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                  placeholder="e.g. Computer Science, Web Development, AI, Database"
                  value={formData.category}
                  onChange={handleChange}
                />
                <datalist id="category-suggestions">
                  <option value="Computer Science" />
                  <option value="Web Development" />
                  <option value="Backend Development" />
                  <option value="Data Science & AI" />
                  <option value="Database Systems" />
                  <option value="Networking" />
                  <option value="Algorithms" />
                  <option value="Cybersecurity" />
                </datalist>
                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Quantity <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                  placeholder="Enter total stock quantity (e.g. 10)"
                  value={formData.quantity}
                  onChange={handleChange}
                />
                {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                <small className="text-muted">
                  Note: Total quantity and available quantity will be initialized to this number. Issued quantity starts at 0.
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 pt-2 border-top">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary d-flex align-items-center gap-2 px-4"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Saving to MySQL...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle"></i>
                      Add Book
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-outline-secondary px-4"
                  disabled={loading}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBook;
