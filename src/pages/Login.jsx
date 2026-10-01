import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);

    // College project credentials: admin / admin123 (or any valid credentials)
    setTimeout(() => {
      if (
        (username.trim().toLowerCase() === 'admin' && password === 'admin123') ||
        (username.trim().toLowerCase() === 'librarian' && password === 'librarian123') ||
        (username.trim() && password.length >= 4)
      ) {
        if (onLogin) {
          onLogin({
            username: username.trim(),
            role: 'Head Librarian',
            token: 'college-lms-jwt-simulated-token'
          });
        }
        navigate('/dashboard');
      } else {
        setError('Invalid username or password. Default demo: admin / admin123');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="custom-card p-4 p-sm-5" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3"
            style={{ width: '64px', height: '64px', fontSize: '2rem' }}
          >
            <i className="bi bi-book-half"></i>
          </div>
          <h3 className="fw-bold text-dark mb-1">Library Management</h3>
          <p className="text-muted small mb-0">
            B.Tech CSE Project • Admin & Librarian Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-person text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-shield-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        {/* Project Credentials Helper Box */}
        <div className="mt-4 p-3 bg-light border rounded text-center small text-muted">
          <strong className="text-dark d-block mb-1">Demo Credentials:</strong>
          <span>Username: <code>admin</code></span> &bull; <span>Password: <code>admin123</code></span>
        </div>

        <div className="mt-3 text-center text-muted" style={{ fontSize: '0.78rem' }}>
          React JS • Node.js • MySQL • Nodemailer
        </div>
      </div>
    </div>
  );
};

export default Login;
