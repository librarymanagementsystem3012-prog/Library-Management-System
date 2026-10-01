import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    categoriesCount: 0,
    overdueBooks: 0,
    booksByCategory: [],
    monthlyIssues: [],
    monthlyReturns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();
      if (res.data && res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // 1. Doughnut Chart: Available vs Issued Books
  const availabilityChartData = {
    labels: ['Available Books', 'Issued Books'],
    datasets: [
      {
        data: [stats.availableBooks, stats.issuedBooks],
        backgroundColor: ['#10b981', '#3b82f6'],
        hoverBackgroundColor: ['#059669', '#2563eb'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // 2. Bar Chart: Books by Category
  const categoryLabels = (stats.booksByCategory || []).map((c) => c.category);
  const categoryValues = (stats.booksByCategory || []).map((c) => c.total_copies);
  const categoryChartData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No categories'],
    datasets: [
      {
        label: 'Total Copies in Catalog',
        data: categoryValues.length > 0 ? categoryValues : [0],
        backgroundColor: '#6366f1',
        borderRadius: 6
      }
    ]
  };

  // 3. Bar Chart: Monthly Issues vs Returns
  const allMonths = Array.from(
    new Set([
      ...(stats.monthlyIssues || []).map((m) => m.month_label),
      ...(stats.monthlyReturns || []).map((m) => m.month_label)
    ])
  );

  const monthlyIssueData = allMonths.map((m) => {
    const found = (stats.monthlyIssues || []).find((x) => x.month_label === m);
    return found ? found.issue_count : 0;
  });

  const monthlyReturnData = allMonths.map((m) => {
    const found = (stats.monthlyReturns || []).find((x) => x.month_label === m);
    return found ? found.return_count : 0;
  });

  const monthlyActivityChartData = {
    labels: allMonths.length > 0 ? allMonths : ['Sep 2026'],
    datasets: [
      {
        label: 'Books Issued',
        data: monthlyIssueData.length > 0 ? monthlyIssueData : [0],
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'Books Returned',
        data: monthlyReturnData.length > 0 ? monthlyReturnData : [0],
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Library Overview Dashboard</h2>
          <p className="text-muted mb-0">
            Real-time catalog metrics and circulation analytics from MySQL database
          </p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-sm-0">
          <button onClick={fetchStats} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <Link to="/issue-book" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-lg"></i> Issue New Book
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
            <strong>Database Alert:</strong> {error}
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchStats}>
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Dashboard Cards */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Books */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="custom-card stat-card" style={{ borderLeftColor: '#3b82f6' }}>
            <div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>TOTAL BOOKS</span>
              <h3 className="fw-bold my-1">{loading ? '...' : stats.totalBooks}</h3>
              <small className="text-secondary">Copies across all titles</small>
            </div>
            <div className="stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-bookshelf"></i>
            </div>
          </div>
        </div>

        {/* Card 2: Available Books */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="custom-card stat-card" style={{ borderLeftColor: '#10b981' }}>
            <div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>AVAILABLE BOOKS</span>
              <h3 className="fw-bold my-1 text-success">{loading ? '...' : stats.availableBooks}</h3>
              <small className="text-secondary">Ready for checkout</small>
            </div>
            <div className="stat-icon bg-success-subtle text-success">
              <i className="bi bi-check2-circle"></i>
            </div>
          </div>
        </div>

        {/* Card 3: Issued Books */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="custom-card stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>ISSUED BOOKS</span>
              <h3 className="fw-bold my-1 text-warning-emphasis">{loading ? '...' : stats.issuedBooks}</h3>
              <small className="text-secondary">Currently with students</small>
            </div>
            <div className="stat-icon bg-warning-subtle text-warning-emphasis">
              <i className="bi bi-bookmark-check"></i>
            </div>
          </div>
        </div>

        {/* Card 4: Categories */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="custom-card stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
            <div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>CATEGORIES</span>
              <h3 className="fw-bold my-1 text-indigo">{loading ? '...' : stats.categoriesCount}</h3>
              <small className="text-secondary">Subject classifications</small>
            </div>
            <div className="stat-icon bg-indigo-subtle text-primary" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
              <i className="bi bi-tags"></i>
            </div>
          </div>
        </div>

        {/* Card 5: Overdue Books */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="custom-card stat-card" style={{ borderLeftColor: '#ef4444' }}>
            <div>
              <span className="text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>OVERDUE BOOKS</span>
              <h3 className="fw-bold my-1 text-danger">{loading ? '...' : stats.overdueBooks}</h3>
              <small className="text-danger fw-medium">Late fee: ₹50 / day</small>
            </div>
            <div className="stat-icon bg-danger-subtle text-danger">
              <i className="bi bi-clock-history"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Available vs Issued books */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-pie-chart text-primary"></i>
              Availability Ratio
            </h5>
            <div className="d-flex justify-content-center align-items-center" style={{ height: '240px' }}>
              {stats.totalBooks === 0 && !loading ? (
                <p className="text-muted">No book records in catalog yet</p>
              ) : (
                <Doughnut
                  data={availabilityChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              )}
            </div>
            <div className="mt-3 text-center text-muted" style={{ fontSize: '0.85rem' }}>
              <span>Total Catalog Volume: <strong>{stats.totalBooks}</strong> copies</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Books by category */}
        <div className="col-12 col-lg-8">
          <div className="custom-card p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-bar-chart-fill text-indigo" style={{ color: '#6366f1' }}></i>
              Books Distribution by Category
            </h5>
            <div style={{ height: '260px' }}>
              <Bar
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 2 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Issue/Return Statistics & Quick Actions */}
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="custom-card p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-graph-up-arrow text-success"></i>
              Circulation Activity: Issues vs Returns
            </h5>
            <div style={{ height: '260px' }}>
              <Bar
                data={monthlyActivityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="col-12 col-lg-4">
          <div className="custom-card p-4 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-lightning-charge-fill text-warning"></i>
              Quick Actions
            </h5>
            <div className="d-flex flex-column gap-2">
              <Link to="/add-book" className="btn btn-outline-primary text-start d-flex align-items-center justify-content-between p-3">
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-plus-square-fill fs-5"></i>
                  Add New Book Title
                </span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              <Link to="/issue-book" className="btn btn-outline-success text-start d-flex align-items-center justify-content-between p-3">
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-box-arrow-up-right fs-5"></i>
                  Issue Book to Student
                </span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              <Link to="/return-book" className="btn btn-outline-info text-start d-flex align-items-center justify-content-between p-3">
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-arrow-return-left fs-5"></i>
                  Process Book Return & Fine
                </span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
              <Link to="/notifications" className="btn btn-outline-secondary text-start d-flex align-items-center justify-content-between p-3">
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-envelope-check-fill fs-5"></i>
                  Dispatch Email Reminders
                </span>
                <i className="bi bi-chevron-right text-muted"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
