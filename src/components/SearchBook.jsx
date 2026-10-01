import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBooks, getCategories } from '../services/api';

const SearchBook = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        getBooks({ search: searchTerm, category: selectedCategory }),
        getCategories()
      ]);
      if (bRes.data && bRes.data.success) {
        setBooks(bRes.data.data);
      }
      if (cRes.data && cRes.data.success) {
        setCategories(cRes.data.data);
      }
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchTerm, selectedCategory]);

  return (
    <div className="fade-in">
      <div className="mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-1">Search & Discover Books</h2>
        <p className="text-muted mb-0">
          Find books by title, author, subject, or availability status in real-time
        </p>
      </div>

      {/* Search Input Box */}
      <div className="custom-card p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by book name, author name, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-5">
            <select
              className="form-select form-select-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-secondary mb-0">
            Search Results ({books.length} found)
          </h5>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Searching MySQL database...</p>
          </div>
        ) : books.length === 0 && searched ? (
          <div className="custom-card p-5 text-center text-muted">
            <i className="bi bi-search fs-1 text-secondary mb-3 d-block"></i>
            <h5>No matching books found</h5>
            <p>Try searching with another keyword or selecting a different category.</p>
          </div>
        ) : (
          <div className="row g-3">
            {books.map((book) => (
              <div key={book.id} className="col-12 col-md-6 col-lg-4">
                <div className="custom-card p-3 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-light text-primary border">
                        {book.category}
                      </span>
                      <span
                        className={
                          book.available_quantity > 0 ? 'badge-available' : 'badge-overdue'
                        }
                      >
                        {book.available_quantity > 0 ? `${book.available_quantity} available` : 'Unavailable'}
                      </span>
                    </div>

                    <h5 className="fw-bold mb-1 text-dark">{book.book_name}</h5>
                    <p className="text-muted small mb-2">
                      <i className="bi bi-person me-1"></i>
                      {book.author}
                    </p>

                    <div className="d-flex gap-3 text-secondary small py-2 border-top border-bottom my-2">
                      <div>Total: <strong>{book.total_quantity}</strong></div>
                      <div>Available: <strong className="text-success">{book.available_quantity}</strong></div>
                      <div>Issued: <strong className="text-primary">{book.issued_quantity}</strong></div>
                    </div>
                  </div>

                  <div className="pt-2 d-flex gap-2">
                    {book.available_quantity > 0 ? (
                      <button
                        onClick={() => navigate('/issue-book', { state: { preselectedBookId: book.id } })}
                        className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
                      >
                        <i className="bi bi-box-arrow-up-right"></i> Issue This Book
                      </button>
                    ) : (
                      <button className="btn btn-outline-secondary btn-sm w-100" disabled>
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBook;
