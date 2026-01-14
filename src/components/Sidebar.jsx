import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeItem, setActiveItem }) => {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'agents', label: 'Agent Center', icon: '🤖' },
    { id: 'reports', label: 'Compliance Reports', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">🛡️</div>
        <h1>FinanceGuard</h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => setActiveItem(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">JD</div>
          <div className="user-info">
            <p className="user-name">John Doe</p>
            <p className="user-role">Compliance Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
