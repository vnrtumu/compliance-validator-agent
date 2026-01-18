import React, { useState, useEffect, useRef } from 'react';
import { streamReport } from '../services/reporterService';
import './ReporterStreamPanel.css';

/**
 * Reporter Stream Panel
 * 
 * Displays real-time streaming of Report generation progress.
 * Shows executive summary, action items, and risk assessment.
 */
const ReporterStreamPanel = ({ uploadId, resolverResult, onComplete, onViewDetails }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [result, setResult] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);
    const streamContainerRef = useRef(null);

    useEffect(() => {
        if (streamContainerRef.current) {
            streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // **AUTO-START** report generation when component mounts
        if (!hasStarted && uploadId) {
            handleStart();
        }
    }, []); // Run once on mount

    const handleStart = () => {
        if (!uploadId) return;

        setIsProcessing(true);
        setHasStarted(true);
        setMessages([]);
        setResult(null);

        const cleanup = streamReport(
            uploadId,
            (data) => {
                setMessages(prev => [...prev, data]);
            },
            (reportResult) => {
                setResult(reportResult);
                setIsProcessing(false);
                onComplete && onComplete(reportResult);
            },
            (error) => {
                setMessages(prev => [...prev, {
                    step: 'error',
                    message: `❌ Error: ${error.message}`
                }]);
                setIsProcessing(false);
            }
        );

        return cleanup;
    };

    const getStatusClass = () => {
        if (!hasStarted) return 'not-started';
        if (isProcessing) return 'processing';
        if (result) return 'complete';
        return '';
    };

    const getMessageClass = (msg) => {
        let classes = ['stream-msg'];
        if (msg.step?.includes('error')) classes.push('error');
        if (msg.step?.includes('complete')) classes.push('complete');
        if (msg.step === 'decision') classes.push('decision');
        if (msg.step === 'risk') classes.push('risk');
        if (msg.step === 'actions') classes.push('actions');
        return classes.join(' ');
    };

    const getDecisionEmoji = (status) => {
        return { APPROVE: '✅', REJECT: '❌', REVIEW: '⚠️' }[status] || '❓';
    };

    const getRiskColor = (level) => {
        return { LOW: '#22c55e', MEDIUM: '#fbbf24', HIGH: '#f97316', CRITICAL: '#ef4444' }[level] || '#6b7280';
    };

    return (
        <div className={`reporter-stream-panel ${getStatusClass()}`}>
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-icon">📊</span>
                    <h4>Reporter Agent</h4>
                    <span className="panel-subtitle">Compliance Report Generation</span>
                </div>
                {!hasStarted && (
                    <button className="start-btn reporter" onClick={handleStart} disabled={!uploadId}>
                        📋 Generate Report
                    </button>
                )}
            </div>

            {hasStarted && (
                <div className="stream-area">
                    <div className="stream-messages" ref={streamContainerRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={getMessageClass(msg)}>
                                {msg.message}
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="stream-msg processing">
                                <span className="spinner"></span> Generating report...
                            </div>
                        )}
                    </div>

                    {result && (
                        <div className="report-preview">
                            {/* Summary Header */}
                            <div className="report-header">
                                <div className="decision-badge">
                                    <span className="emoji">{getDecisionEmoji(result.decision?.status)}</span>
                                    <span className="status">{result.decision?.status}</span>
                                </div>
                                <div className="risk-badge" style={{ borderColor: getRiskColor(result.risk_assessment?.level) }}>
                                    <span className="label">Risk</span>
                                    <span className="level" style={{ color: getRiskColor(result.risk_assessment?.level) }}>
                                        {result.risk_assessment?.level}
                                    </span>
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div className="executive-summary">
                                <h5>Executive Summary</h5>
                                <p>{result.executive_summary}</p>
                            </div>

                            {/* Compliance Stats */}
                            {result.compliance_stats && (
                                <div className="compliance-stats">
                                    <div className="stat passed">
                                        <span className="value">{result.compliance_stats.passed}</span>
                                        <span className="label">Passed</span>
                                    </div>
                                    <div className="stat failed">
                                        <span className="value">{result.compliance_stats.failed}</span>
                                        <span className="label">Failed</span>
                                    </div>
                                    <div className="stat warnings">
                                        <span className="value">{result.compliance_stats.warnings}</span>
                                        <span className="label">Warnings</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Items Preview */}
                            {result.action_items?.length > 0 && (
                                <div className="action-preview">
                                    <h5>🚨 {result.action_items.length} Action Items</h5>
                                    <div className="action-list">
                                        {result.action_items.slice(0, 3).map((action, idx) => (
                                            <div key={idx} className={`action-item ${action.priority?.toLowerCase()}`}>
                                                <span className="priority">{action.priority}</span>
                                                <span className="action">{action.action}</span>
                                            </div>
                                        ))}
                                        {result.action_items.length > 3 && (
                                            <div className="more-actions">+{result.action_items.length - 3} more</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button className="view-full-btn" onClick={() => onViewDetails && onViewDetails(result)}>
                                View Full Report
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReporterStreamPanel;
