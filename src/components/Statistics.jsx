import React, { useState, useEffect } from 'react';
import { getDashboardStats, getAllIssues } from '../services/api';
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
import { Doughnut, Bar, Line } from 'react-chartjs-2';

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

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, issuesRes] = await Promise.all([
        getDashboardStats(),
        getAllIssues()
      ]);

      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (issuesRes.data && issuesRes.data.success) {
        setAllIssues(issuesRes.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve analytical statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Aggregating library metrics...</p>
      </div>
    );
  }

  // Calculate total fines collected from returned issues
  const totalFineCollected = allIssues
    .filter((i) => i.status === 'Returned')
    .reduce((acc, curr) => acc + (parseFloat(curr.fine) || 0), 0);

  const totalCirculationCount = allIssues.length;
  const returnedCount = allIssues.filter((i) => i.status === 'Returned').length;
  const returnRate = totalCirculationCount > 0 ? ((returnedCount / totalCirculationCount) * 100).toFixed(1) : 0;

  // Chart 1: Availability Doughnut
  const doughnutData = {
    labels: ['Available for Loan', 'Currently Issued'],
    datasets: [
      {
        data: [stats?.availableBooks || 0, stats?.issuedBooks || 0],
        backgroundColor: ['#10b981', '#3b82f6'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 2: Category Breakdown
  const catLabels = (stats?.booksByCategory || []).map((c) => c.category);
  const catData = (stats?.booksByCategory || []).map((c) => c.total_copies);
  const categoryBarData = {
    labels: catLabels.length > 0 ? catLabels : ['None'],
    datasets: [
      {
        label: 'Total Volumes in Collection',
        data: catData.length > 0 ? catData : [0],
        backgroundColor: '#6366f1',
        borderRadius: 6
      }
    ]
  };

  // Chart 3: Monthly trend
  const allMonths = Array.from(
    new Set([
      ...(stats?.monthlyIssues || []).map((m) => m.month_label),
      ...(stats?.monthlyReturns || []).map((m) => m.month_label)
    ])
  );

  const monthlyTrendData = {
    labels: allMonths.length > 0 ? allMonths : ['Sep 2026'],
    datasets: [
      {
        label: 'Books Issued',
        data: allMonths.map((m) => {
          const found = (stats?.monthlyIssues || []).find((x) => x.month_label === m);
          return found ? found.issue_count : 0;
        }),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Books Returned',
        data: allMonths.map((m) => {
          const found = (stats?.monthlyReturns || []).find((x) => x.month_label === m);
          return found ? found.return_count : 0;
        }),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Library Analytics & Statistics</h2>
          <p className="text-muted mb-0">
            Real-time visual reports of inventory distribution, circulation cycles, and fine revenue
          </p>
        </div>
        <button onClick={loadStatistics} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 mt-2 mt-sm-0">
          <i className="bi bi-arrow-clockwise"></i> Refresh Analytics
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* KPI Highlight Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="custom-card p-3 border-start border-4 border-primary">
            <span className="text-muted small fw-semibold">TOTAL COLLECTION</span>
            <h3 className="fw-bold my-1 text-primary">{stats?.totalBooks}</h3>
            <small className="text-muted">Total physical copies</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="custom-card p-3 border-start border-4 border-success">
            <span className="text-muted small fw-semibold">RETURN RATE</span>
            <h3 className="fw-bold my-1 text-success">{returnRate}%</h3>
            <small className="text-muted">{returnedCount} of {totalCirculationCount} loans returned</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="custom-card p-3 border-start border-4 border-warning">
            <span className="text-muted small fw-semibold">ACTIVE OVERDUE</span>
            <h3 className="fw-bold my-1 text-warning-emphasis">{stats?.overdueBooks}</h3>
            <small className="text-danger">Pending overdue loans</small>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="custom-card p-3 border-start border-4 border-danger">
            <span className="text-muted small fw-semibold">FINES COLLECTED</span>
            <h3 className="fw-bold my-1 text-danger">₹{totalFineCollected.toFixed(2)}</h3>
            <small className="text-muted">Overdue penalties recorded</small>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-5">
          <div className="custom-card p-4 h-100">
            <h5 className="fw-bold mb-3">Inventory Circulation Status</h5>
            <div style={{ height: '260px' }} className="d-flex justify-content-center align-items-center">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="custom-card p-4 h-100">
            <h5 className="fw-bold mb-3">Inventory per Department / Subject</h5>
            <div style={{ height: '260px' }}>
              <Bar
                data={categoryBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="custom-card p-4">
            <h5 className="fw-bold mb-3">Monthly Circulation Trends (Issue vs Return)</h5>
            <div style={{ height: '280px' }}>
              <Line
                data={monthlyTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
