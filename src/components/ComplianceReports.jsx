import React from 'react';
import './ComplianceReports.css';

const reportMetrics = [
    { label: 'GST Compliance Rate', value: '94.2%', trend: '+2.1%', status: 'good' },
    { label: 'TDS Deduction Accuracy', value: '98.5%', trend: '+0.5%', status: 'good' },
    { label: 'Average Validation Score', value: '52/58', trend: '-1.2 pt', status: 'neutral' },
    { label: 'Regulatory Flags', value: '28', trend: '-4', status: 'improving' },
];

const categories = [
    { id: 'A', name: 'Document Authenticity', points: 8, score: 7.2, icon: '📜' },
    { id: 'B', name: 'GST Compliance', points: 18, score: 16.5, icon: '🏛️' },
    { id: 'C', name: 'Arithmetic & Extraction', points: 10, score: 9.8, icon: '🔢' },
    { id: 'D', name: 'TDS Compliance', points: 12, score: 11.2, icon: '💡' },
    { id: 'E', name: 'Policy & Business Rules', points: 10, score: 8.5, icon: '📋' },
];

const ComplianceReports = () => {
    return (
        <div className="reports-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Compliance Insights</h1>
                    <p className="subtitle">High-level overview of regulatory standing and agent performance.</p>
                </div>
                <button className="primary-btn">Download PDF Summary</button>
            </header>

            <div className="metrics-row">
                {reportMetrics.map((mid, idx) => (
                    <div key={idx} className="glass-card metric-card">
                        <span className="metric-label">{mid.label}</span>
                        <div className="metric-main">
                            <span className="metric-value">{mid.value}</span>
                            <span className={`metric-trend ${mid.status}`}>{mid.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="reports-grid">
                <div className="glass-card chart-placeholder">
                    <h3>Compliance Score Trends (90 Days)</h3>
                    <div className="simple-chart">
                        {/* Visual simulation of a bar chart */}
                        {[40, 60, 45, 70, 85, 65, 90, 75, 80, 95].map((h, i) => (
                            <div key={i} className="chart-bar" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="chart-labels">
                        <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span>
                    </div>
                </div>

                <div className="glass-card categories-list">
                    <h3>Framework Breakdown (58 Points)</h3>
                    <div className="categories-container">
                        {categories.map((cat) => (
                            <div key={cat.id} className="category-item">
                                <div className="category-info">
                                    <span className="category-icon">{cat.icon}</span>
                                    <div className="category-text">
                                        <span className="category-name">{cat.name}</span>
                                        <span className="category-pts">{cat.score} / {cat.points} pts average</span>
                                    </div>
                                </div>
                                <div className="category-progress-bg">
                                    <div
                                        className="category-progress-fill"
                                        style={{ width: `${(cat.score / cat.points) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-card alert-summary">
                <h3>Critical Regulatory Alerts</h3>
                <div className="alert-item error">
                    <span className="alert-icon">⚠️</span>
                    <p>Upcoming GST filing deadline for Q4. 14 invoices require immediate review of state codes.</p>
                </div>
                <div className="alert-item warning">
                    <span className="alert-icon">ℹ️</span>
                    <p>New TDS rate change detected for Section 194J (Professional Services) starting next month.</p>
                </div>
            </div>
        </div>
    );
};

export default ComplianceReports;
