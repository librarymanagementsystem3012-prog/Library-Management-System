import React, { useState, useEffect } from 'react';
import { getBooks, getCategories, deleteBook, updateBook } from '../services/api';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Modal State
  const [editingBook, setEditingBook] = useState(null);
  const [editFormData, setEditFormData] = useState({
    book_name: '',
    author: '',
    category: '',
    total_quantity: 1
  });
  const [editError, setEditError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchBooksAndCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const [booksRes, catsRes] = await Promise.all([
        getBooks({ search: searchTerm, category: selectedCategory }),
        getCategories()
      ]);

      if (booksRes.data && booksRes.data.success) {
        setBooks(booksRes.data.data);
      }
      if (catsRes.data && catsRes.data.success) {
        setCategories(catsRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch books from MySQL database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksAndCategories();
  }, [searchTerm, selectedCategory]);

  // Delete Book with confirmation
  const handleDelete = async (book) => {
    if (book.issued_quantity > 0) {
      alert(`Cannot delete "${book.book_name}". There are ${book.issued_quantity} copies currently issued to students.`);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${book.book_name}" by ${book.author} from the database?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await deleteBook(book.id);
      if (res.data && res.data.success) {
        setActionMessage(`Book "${book.book_name}" deleted successfully.`);
        fetchBooksAndCategories();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete book');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (book) => {
    setEditingBook(book);
    setEditFormData({
      book_name: book.book_name,
      author: book.author,
      category: book.category,
      total_quantity: book.total_quantity
    });
    setEditError('');
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setEditingBook(null);
    setEditError('');
  };

  // Save Book Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.book_name.trim() || !editFormData.author.trim() || !editFormData.category.trim()) {
      setEditError('All text fields are required.');
      return;
    }

    const totalQty = parseInt(editFormData.total_quantity, 10);
    if (isNaN(totalQty) || totalQty < editingBook.issued_quantity) {
      setEditError(`Total quantity cannot be lower than currently issued quantity (${editingBook.issued_quantity}).`);
      return;
    }

    try {
      setActionLoading(true);
      const res = await updateBook(editingBook.id, {
        book_name: editFormData.book_name.trim(),
        author: editFormData.author.trim(),
        category: editFormData.category.trim(),
        total_quantity: totalQty
      });

      if (res.data && res.data.success) {
        setActionMessage(`Book "${editFormData.book_name}" updated successfully.`);
        closeEditModal();
        fetchBooksAndCategories();
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update book');
    } finally {
      setActionLoading(false);
    }
  };

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBooks = books.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(books.length / itemsPerPage);

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Library Catalog & Book List</h2>
          <p className="text-muted mb-0">
            Comprehensive listing of books retrieved live from MySQL database
          </p>
        </div>
        <div className="badge bg-primary fs-6 px-3 py-2 mt-2 mt-sm-0">
          Total Titles: {books.length}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-check2-circle me-2 fs-5"></i>
            {actionMessage}
          </div>
          <button type="button" className="btn-close" onClick={() => setActionMessage('')}></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            {error}
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchBooksAndCategories}>
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="custom-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-7">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by title, author, or category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-5">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="custom-card p-0 mb-4">
        <div className="table-responsive">
          <table className="table custom-table mb-0">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Book Name</th>
                <th>Author</th>
                <th>Category</th>
                <th>Total Quantity</th>
                <th>Available Quantity</th>
                <th>Issued Quantity</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading books...</span>
                    </div>
                    <p className="mt-2 text-muted">Retrieving catalog records from MySQL...</p>
                  </td>
                </tr>
              ) : currentBooks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-journal-x fs-1 text-secondary d-block mb-2"></i>
                    No books matching your query found.
                  </td>
                </tr>
              ) : (
                currentBooks.map((book) => (
                  <tr key={book.id}>
                    <td className="fw-bold text-secondary">#{book.id}</td>
                    <td>
                      <span className="fw-semibold text-dark">{book.book_name}</span>
                    </td>
                    <td className="text-muted">{book.author}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {book.category}
                      </span>
                    </td>
                    <td className="fw-bold">{book.total_quantity}</td>
                    <td>
                      <span
                        className={
                          book.available_quantity > 0 ? 'badge-available' : 'badge bg-danger-subtle text-danger border'
                        }
                      >
                        {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Out of stock'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-issued">
                        {book.issued_quantity} issued
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          onClick={() => openEditModal(book)}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                          title="Edit book details"
                        >
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(book)}
                          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                          title="Delete book"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-top d-flex justify-content-between align-items-center">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, books.length)} of {books.length} entries
            </span>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  className={`btn btn-sm ${currentPage === idx + 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Edit Book Details (#{editingBook.id})
                </h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger py-2" role="alert">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Book Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.book_name}
                      onChange={(e) => setEditFormData({ ...editFormData, book_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Author</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.author}
                      onChange={(e) => setEditFormData({ ...editFormData, author: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Total Quantity</label>
                    <input
                      type="number"
                      min={editingBook.issued_quantity}
                      className="form-control"
                      value={editFormData.total_quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, total_quantity: e.target.value })}
                      required
                    />
                    <small className="text-muted">
                      Currently Issued: <strong>{editingBook.issued_quantity}</strong>. Available will recalculate automatically.
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeEditModal}>
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

export default BookList;
