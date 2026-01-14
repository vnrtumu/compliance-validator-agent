import React from 'react';
import './Invoices.css';

const invoiceData = [
    { id: 'INV-2024-001', vendor: 'TechNova Solutions', date: '2024-01-12', amount: '₹14,500', gstin: '27AAACT1234A1Z5', status: 'Validated', score: 58 },
    { id: 'INV-2024-002', vendor: 'Global Logistics', date: '2024-01-11', amount: '₹8,400', gstin: '07BBBCS5678B2Z2', status: 'Flagged', score: 42 },
    { id: 'INV-2024-003', vendor: 'Office Supplies Inc', date: '2024-01-10', amount: '₹2,100', gstin: '19CCCCR9012C3Z9', status: 'Validated', score: 56 },
    { id: 'INV-2024-004', vendor: 'Swift Repairs', date: '2024-01-09', amount: '₹5,600', gstin: '33DDDDM3456D4Z8', status: 'Pending', score: 0 },
    { id: 'INV-2024-005', vendor: 'Cyber Security Svc', date: '2024-01-08', amount: '₹22,000', gstin: '27AAACT1234A1Z5', status: 'Flagged', score: 38 },
];

const Invoices = () => {
    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Scanned Invoices</h1>
                    <p className="subtitle">Detailed breakdown of 58-point compliance checks.</p>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn">Filter</button>
                    <button className="primary-btn">Export Results</button>
                </div>
            </header>

            <div className="glass-card table-container">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Vendor</th>
                            <th>Date</th>
                            <th>GSTIN</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Compliance</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceData.map((inv) => (
                            <tr key={inv.id}>
                                <td className="inv-id">{inv.id}</td>
                                <td>{inv.vendor}</td>
                                <td>{inv.date}</td>
                                <td className="gstin-code">{inv.gstin}</td>
                                <td>{inv.amount}</td>
                                <td>
                                    <span className={`status-tag ${inv.status.toLowerCase()}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="compliance-bar-wrapper">
                                        <div
                                            className="compliance-bar"
                                            style={{ width: `${(inv.score / 58) * 100}%`, backgroundColor: inv.score > 50 ? 'var(--accent-success)' : inv.score > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}
                                        ></div>
                                        <span className="score-text">{inv.score}/58</span>
                                    </div>
                                </td>
                                <td>
                                    <button className="view-btn">View Report</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Invoices;
