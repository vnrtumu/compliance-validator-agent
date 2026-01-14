import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AgentCenter from './components/AgentCenter';
import Invoices from './components/Invoices';
import ComplianceReports from './components/ComplianceReports';
import Settings from './components/Settings';
import './App.css';

function App() {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <>
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <main className="main-content">
        {activeItem === 'dashboard' && <Dashboard />}
        {activeItem === 'invoices' && <Invoices />}
        {activeItem === 'agents' && <AgentCenter />}
        {activeItem === 'reports' && <ComplianceReports />}
        {activeItem === 'settings' && <Settings />}
      </main>
    </>
  );
}

export default App;
