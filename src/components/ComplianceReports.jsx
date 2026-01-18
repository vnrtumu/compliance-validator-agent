import React, { useState, useEffect } from 'react';
import { getReportsStatistics } from '../services/reportsService';
import './ComplianceReports.css';

const ComplianceReports = () => {
    const [reportsData, setReportsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportsData();
    }, []);

    const fetchReportsData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getReportsStatistics();
            setReportsData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="reports-screen fade-in">
                <header className="screen-header">
                    <div>
                        <h1>Compliance Insights</h1>
                        <p className="subtitle">Loading reports data...</p>
                    </div>
                </header>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p>Fetching compliance statistics...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="reports-screen fade-in">
                <header className="screen-header">
                    <div>
                        <h1>Compliance Insights</h1>
                        <p className="subtitle">Error loading reports</p>
                    </div>
                </header>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-error)' }}>
                    <p>❌ {error}</p>
                    <button className="primary-btn" onClick={fetchReportsData} style={{ marginTop: '1rem' }}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Extract data
    const { overview, category_breakdown, trend_data, alerts } = reportsData || {};

    // Map category data to display format
    const categories = [
        {
            id: 'A',
            name: 'Document Authenticity',
            points: category_breakdown?.document_authenticity?.max || 8,
            score: category_breakdown?.document_authenticity?.score || 0,
            icon: '📜'
        },
        {
            id: 'B',
            name: 'GST Compliance',
            points: category_breakdown?.gst_compliance?.max || 18,
            score: category_breakdown?.gst_compliance?.score || 0,
            icon: '🏛️'
        },
        {
            id: 'C',
            name: 'Arithmetic & Extraction',
            points: category_breakdown?.arithmetic_extraction?.max || 10,
            score: category_breakdown?.arithmetic_extraction?.score || 0,
            icon: '🔢'
        },
        {
            id: 'D',
            name: 'TDS Compliance',
            points: category_breakdown?.tds_compliance?.max || 12,
            score: category_breakdown?.tds_compliance?.score || 0,
            icon: '💡'
        },
        {
            id: 'E',
            name: 'Policy & Business Rules',
            points: category_breakdown?.policy_rules?.max || 10,
            score: category_breakdown?.policy_rules?.score || 0,
            icon: '📋'
        },
    ];

    const totalPoints = categories.reduce((sum, cat) => sum + cat.points, 0);

    // Report metrics
    const reportMetrics = [
        {
            label: 'GST Compliance Rate',
            value: `${overview?.gst_compliance_rate || 0}%`,
            trend: overview?.trend_7d || '0%',
            status: overview?.gst_compliance_rate >= 90 ? 'good' : 'neutral'
        },
        {
            label: 'TDS Deduction Accuracy',
            value: `${overview?.tds_accuracy || 0}%`,
            trend: overview?.trend_7d || '0%',
            status: overview?.tds_accuracy >= 90 ? 'good' : 'neutral'
        },
        {
            label: 'Average Validation Score',
            value: `${Math.round(overview?.avg_validation_score || 0)}/${totalPoints}`,
            trend: overview?.trend_7d || '0%',
            status: 'neutral'
        },
        {
            label: 'Regulatory Flags',
            value: `${overview?.regulatory_flags || 0}`,
            trend: overview?.regulatory_flags > 0 ? 'needs attention' : 'stable',
            status: overview?.regulatory_flags > 10 ? 'warning' : 'improving'
        },
    ];

    // Prepare trend chart data - normalize to percentage for display
    // Use sample data if we only have 1 or 2 data points
    const trendChartData = trend_data && trend_data.length > 2
        ? trend_data.slice(-10).map(d => ({
            height: Math.max(10, Math.round((d.score / 100) * 100)), // Use % directly, min 10%
            score: d.score,
            label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        : [65, 72, 68, 78, 82, 75, 88, 80, 83, 85].map((h, i) => ({
            height: h,
            score: h,
            label: `Day ${i + 1}`
        }));

    return (
        <div className="reports-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Compliance Insights</h1>
                    <p className="subtitle">
                        {overview?.total_invoices || 0} invoices analyzed |
                        High-level overview of regulatory standing and agent performance.
                    </p>
                </div>
                <button className="primary-btn" onClick={fetchReportsData}>Refresh Data</button>
            </header>

            <div className="metrics-row">
                {reportMetrics.map((metric, idx) => (
                    <div key={idx} className="glass-card metric-card">
                        <span className="metric-label">{metric.label}</span>
                        <div className="metric-main">
                            <span className="metric-value">{metric.value}</span>
                            <span className={`metric-trend ${metric.status}`}>{metric.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="reports-grid">
                <div className="glass-card chart-placeholder">
                    <h3>Compliance Trend {trend_data?.length > 2 ? `(Last ${trend_data.length} Days)` : '(Sample)'}</h3>
                    <div className="simple-chart">
                        {trendChartData.map((item, i) => (
                            <div
                                key={i}
                                className="chart-bar"
                                style={{ height: `${item.height}%` }}
                                title={`${item.label}: ${item.score}%`}
                            ></div>
                        ))}
                    </div>
                    <div className="chart-labels">
                        {trendChartData.filter((_, i) => i % 2 === 0 || trendChartData.length <= 5).slice(0, 5).map((item, i) => (
                            <span key={i}>{item.label}</span>
                        ))}
                    </div>
                </div>

                <div className="glass-card categories-list">
                    <h3>Framework Breakdown ({totalPoints} Points)</h3>
                    <div className="categories-container">
                        {categories.map((cat) => (
                            <div key={cat.id} className="category-item">
                                <div className="category-info">
                                    <span className="category-icon">{cat.icon}</span>
                                    <div className="category-text">
                                        <span className="category-name">{cat.name}</span>
                                        <span className="category-pts">{cat.score.toFixed(1)} / {cat.points} pts average</span>
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
                {alerts && alerts.length > 0 ? (
                    alerts.map((alert, idx) => (
                        <div key={idx} className={`alert-item ${alert.type}`}>
                            <span className="alert-icon">{alert.icon}</span>
                            <p>{alert.message}</p>
                        </div>
                    ))
                ) : (
                    <div className="alert-item info">
                        <span className="alert-icon">ℹ️</span>
                        <p>No alerts available. Upload and validate invoices to see compliance insights.</p>
                    </div>
                )}
            </div>

            {/* Recent Invoices Section */}
            {reportsData?.recent_invoices && reportsData.recent_invoices.length > 0 && (
                <div className="glass-card recent-invoices-section" style={{ marginTop: '1.5rem' }}>
                    <h3>Recent Invoices</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#888', fontSize: '0.8rem' }}>ID</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#888', fontSize: '0.8rem' }}>FILENAME</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#888', fontSize: '0.8rem' }}>STATUS</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#888', fontSize: '0.8rem' }}>SCORE</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#888', fontSize: '0.8rem' }}>DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportsData.recent_invoices.map((inv) => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem', color: '#60a5fa' }}>#{inv.id}</td>
                                        <td style={{ padding: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {inv.filename}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: inv.invoice_status === 'APPROVED' ? 'rgba(74, 222, 128, 0.15)' :
                                                    inv.invoice_status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' :
                                                        'rgba(251, 191, 36, 0.15)',
                                                color: inv.invoice_status === 'APPROVED' ? '#4ade80' :
                                                    inv.invoice_status === 'REJECTED' ? '#f87171' : '#fbbf24'
                                            }}>
                                                {inv.invoice_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding: '0.75rem',
                                            color: inv.compliance_score >= 80 ? '#4ade80' :
                                                inv.compliance_score >= 60 ? '#fbbf24' : '#f87171',
                                            fontWeight: 600
                                        }}>
                                            {inv.compliance_score ? `${inv.compliance_score}%` : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem', color: '#888' }}>
                                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceReports;
