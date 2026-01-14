import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AgentCenter from './components/AgentCenter';
import Invoices from './components/Invoices';
import ComplianceReports from './components/ComplianceReports';
import Settings from './components/Settings';
import './App.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'invoices',
        element: <Invoices />,
      },
      {
        path: 'agents',
        element: <AgentCenter />,
      },
      {
        path: 'reports',
        element: <ComplianceReports />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;
