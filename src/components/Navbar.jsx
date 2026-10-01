import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkHealth } from '../services/api';

const Navbar = ({ onLogout }) => {
  const [dbStatus, setDbStatus] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (res.data && res.data.database === 'connected') {
          setDbStatus('connected');
        } else {
          setDbStatus('db_warning');
        }
      })
      .catch(() => {
        setDbStatus('offline');
      });
  }, []);

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to log out of Library Admin?')) {
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    }
  };

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center gap-3">
        <div className="nav-title">
          <i className="bi bi-book-half text-primary fs-3"></i>
          <span>Library Management System</span>
        </div>
        <span className="badge bg-light text-secondary border d-none d-md-inline-block">
          B.Tech CSE Project
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Backend & DB Status Badge */}
        <div className="d-none d-sm-flex align-items-center gap-2">
          {dbStatus === 'connected' && (
            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
              <i className="bi bi-database-check me-1"></i> MySQL Connected
            </span>
          )}
          {dbStatus === 'db_warning' && (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1" title="Backend is online, check MySQL credentials in backend/.env">
              <i className="bi bi-database-exclamation me-1"></i> Check MySQL .env
            </span>
          )}
          {dbStatus === 'offline' && (
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1" title="Backend server not responding on port 5000">
              <i className="bi bi-exclamation-triangle me-1"></i> Backend Offline
            </span>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="nav-user-badge">
          <i className="bi bi-person-circle fs-5 text-primary"></i>
          <span className="d-none d-md-inline">Librarian Admin</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
          title="Sign out of the system"
        >
          <i className="bi bi-box-arrow-right"></i>
          <span className="d-none d-sm-inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
