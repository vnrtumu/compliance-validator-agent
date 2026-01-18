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
    const trendChartData = trend_data && trend_data.length > 0
        ? trend_data.slice(-10).map(d => ({
            height: Math.round((d.score / totalPoints) * 100),
            label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
        : [40, 60, 45, 70, 85, 65, 90, 75, 80, 95].map((h, i) => ({ height: h, label: `Day ${i + 1}` }));

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
                    <h3>Compliance Score Trends {trend_data?.length > 0 ? `(Last ${trend_data.length} Days)` : '(Sample Data)'}</h3>
                    <div className="simple-chart">
                        {trendChartData.map((item, i) => (
                            <div key={i} className="chart-bar" style={{ height: `${item.height}%` }}></div>
                        ))}
                    </div>
                    <div className="chart-labels">
                        {trendChartData.slice(0, 4).map((item, i) => (
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
        </div>
    );
};

export default ComplianceReports;
