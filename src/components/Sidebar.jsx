import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'bi-grid-1x2-fill' },
    { name: 'Add Book', path: '/add-book', icon: 'bi-plus-circle-fill' },
    { name: 'Book List', path: '/books', icon: 'bi-journal-bookmark-fill' },
    { name: 'Search Book', path: '/search-book', icon: 'bi-search' },
    { name: 'Students', path: '/students', icon: 'bi-people-fill' },
    { name: 'Issue Book', path: '/issue-book', icon: 'bi-box-arrow-up-right' },
    { name: 'Return Book', path: '/return-book', icon: 'bi-box-arrow-in-down-left' },
    { name: 'Statistics', path: '/statistics', icon: 'bi-pie-chart-fill' },
    { name: 'Notifications', path: '/notifications', icon: 'bi-bell-fill' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <i className="bi bi-book"></i>
        <span>LIBRARY MENU</span>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path} className="sidebar-menu-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-3 text-center border-top border-secondary-subtle" style={{ fontSize: '0.78rem', color: '#64748b' }}>
        <span>Library Portal v2.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
