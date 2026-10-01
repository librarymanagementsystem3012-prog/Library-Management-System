import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// App Feature Components
import Dashboard from './components/Dashboard';
import AddBook from './components/AddBook';
import BookList from './components/BookList';
import SearchBook from './components/SearchBook';
import StudentManager from './components/StudentManager';
import IssueBook from './components/IssueBook';
import ReturnBook from './components/ReturnBook';
import Statistics from './components/Statistics';
import Notifications from './components/Notifications';

// Pages
import Login from './pages/Login';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('library_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('library_admin_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('library_admin_user');
  };

  // Protected Route Wrapper Component
  const ProtectedLayout = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="app-container">
        <Navbar onLogout={handleLogout} />
        <div className="layout-body">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
        <Footer />
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
          }
        />

        {/* Protected Dashboard & Operations Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/add-book"
          element={
            <ProtectedLayout>
              <AddBook />
            </ProtectedLayout>
          }
        />

        <Route
          path="/books"
          element={
            <ProtectedLayout>
              <BookList />
            </ProtectedLayout>
          }
        />

        <Route
          path="/search-book"
          element={
            <ProtectedLayout>
              <SearchBook />
            </ProtectedLayout>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedLayout>
              <StudentManager />
            </ProtectedLayout>
          }
        />

        <Route
          path="/issue-book"
          element={
            <ProtectedLayout>
              <IssueBook />
            </ProtectedLayout>
          }
        />

        <Route
          path="/return-book"
          element={
            <ProtectedLayout>
              <ReturnBook />
            </ProtectedLayout>
          }
        />

        <Route
          path="/statistics"
          element={
            <ProtectedLayout>
              <Statistics />
            </ProtectedLayout>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedLayout>
              <Notifications />
            </ProtectedLayout>
          }
        />

        {/* Fallback & Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
