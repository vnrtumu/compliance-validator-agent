import React, { useEffect, useState, useRef } from 'react';
import { getInvoices } from '../services/uploadService';
import { getLLMSettings } from '../services/settingsService';
import { streamValidation } from '../services/validationService';
import { streamResolution } from '../services/resolverService';
import { streamReport } from '../services/reporterService';
import ExtractionModal from './ExtractionModal';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Combined Agent state (Validator + Resolver + Reporter)
    const [processingId, setProcessingId] = useState(null);
    const [agentMessages, setAgentMessages] = useState([]);
    const [currentAgent, setCurrentAgent] = useState(null); // 'validator', 'resolver', or 'reporter'
    const [validationResult, setValidationResult] = useState(null);
    const [resolverResult, setResolverResult] = useState(null);
    const [reportResult, setReportResult] = useState(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const streamContainerRef = useRef(null);

    // LLM Provider state
    const [llmProvider, setLlmProvider] = useState('groq');

    useEffect(() => {
        fetchInvoices();
        fetchLLMSettings();
    }, []);

    useEffect(() => {
        // Scroll to bottom of stream container only, not the page
        if (streamContainerRef.current) {
            streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
        }
    }, [agentMessages]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getInvoices();
            setInvoices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLLMSettings = async () => {
        try {
            const settings = await getLLMSettings();
            setLlmProvider(settings.provider);
        } catch (error) {
            console.error('Failed to fetch LLM settings:', error);
        }
    };

    const getProviderDisplayName = (provider) => {
        const names = {
            'openai': 'OpenAI',
            'groq': 'GROQ',
            'deepseek': 'DeepSeek',
            'grok': 'Grok'
        };
        return names[provider] || provider.toUpperCase();
    };

    const handleAnalyze = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleCloseModal = () => {
        setSelectedInvoice(null);
        fetchInvoices();
    };

    const handleExtractionComplete = (invoice, extractionResult) => {
        // Close extraction modal
        setSelectedInvoice(null);

        // Refresh invoices to get updated data
        fetchInvoices();

        // Automatically start the agent pipeline
        // Note: We need to get the updated invoice from the list
        // For now, trigger with the invoice we have
        const updatedInvoice = {
            ...invoice,
            extraction_result: extractionResult,
            is_valid: extractionResult.is_valid_invoice
        };

        // Start agent pipeline automatically
        handleRunAgents(updatedInvoice);
    };

    const handleRunAgents = (invoice) => {
        if (!invoice.extraction_result) {
            alert('Please run extraction (Analyze) first.');
            return;
        }

        setProcessingId(invoice.id);
        setAgentMessages([]);
        setCurrentAgent('validator');
        setValidationResult(null);
        setResolverResult(null);
        setReportResult(null);
        setShowAgentModal(true);

        // Add header for Validator
        setAgentMessages([{ step: 'header', message: '🛡️ VALIDATOR AGENT', agent: 'validator' }]);

        // Start Validator streaming
        const validatorCleanup = streamValidation(
            invoice.id,
            (data) => {
                setAgentMessages(prev => [...prev, { ...data, agent: 'validator' }]);
            },
            (result) => {
                setValidationResult(result);
                setAgentMessages(prev => [...prev,
                { step: 'complete', message: `✅ Validation complete: ${result.overall_status}`, agent: 'validator' },
                { step: 'divider', message: '─'.repeat(40), agent: 'system' },
                { step: 'header', message: '⚖️ RESOLVER AGENT', agent: 'resolver' }
                ]);

                // Automatically start Resolver after validation
                setCurrentAgent('resolver');
                startResolver(invoice.id, result);
            },
            (error) => {
                setAgentMessages(prev => [...prev, {
                    step: 'error',
                    message: `❌ Validator Error: ${error.message}`,
                    agent: 'validator'
                }]);
                setProcessingId(null);
            }
        );
    };

    const startResolver = (invoiceId, validationResult) => {
        const resolverCleanup = streamResolution(
            invoiceId,
            (data) => {
                setAgentMessages(prev => [...prev, { ...data, agent: 'resolver' }]);
            },
            (result) => {
                setResolverResult(result);
                setAgentMessages(prev => [...prev,
                { step: 'complete', message: `✅ Resolution complete: ${result.final_recommendation} (${Math.round(result.confidence_score * 100)}% confidence)`, agent: 'resolver' },
                { step: 'divider', message: '─'.repeat(40), agent: 'system' },
                { step: 'header', message: '📊 REPORTER AGENT', agent: 'reporter' }
                ]);

                // Automatically start Reporter after Resolver
                setCurrentAgent('reporter');
                startReporter(invoiceId);
            },
            (error) => {
                setAgentMessages(prev => [...prev, {
                    step: 'error',
                    message: `❌ Resolver Error: ${error.message}`,
                    agent: 'resolver'
                }]);
                setProcessingId(null);
            }
        );
    };

    const startReporter = (invoiceId) => {
        const reporterCleanup = streamReport(
            invoiceId,
            (data) => {
                setAgentMessages(prev => [...prev, { ...data, agent: 'reporter' }]);
            },
            (result) => {
                setReportResult(result);
                setAgentMessages(prev => [...prev, {
                    step: 'complete',
                    message: `✅ Report generated: ${result.decision?.status} (Risk: ${result.risk_assessment?.level})`,
                    agent: 'reporter'
                }]);
                setProcessingId(null);
                setCurrentAgent(null);
            },
            (error) => {
                setAgentMessages(prev => [...prev, {
                    step: 'error',
                    message: `❌ Reporter Error: ${error.message}`,
                    agent: 'reporter'
                }]);
                setProcessingId(null);
            }
        );
    };

    const getStatusTag = (invoice) => {
        if (invoice.validation_status && invoice.validation_status !== 'pending') {
            if (invoice.validation_status === 'APPROVED') {
                return <span className="status-tag validated">✓ Approved</span>;
            } else if (invoice.validation_status === 'REJECTED') {
                return <span className="status-tag rejected">✗ Rejected</span>;
            } else {
                return <span className="status-tag review">⚠ Review</span>;
            }
        }

        if (invoice.extraction_status === 'completed') {
            if (invoice.is_valid) {
                return <span className="status-tag validated">✓ Valid</span>;
            } else {
                return <span className="status-tag rejected">✗ Invalid</span>;
            }
        }
        return <span className="status-tag pending">Pending</span>;
    };

    const getStatusClass = (status) => {
        if (status === 'APPROVED' || status === 'APPROVE') return 'approved';
        if (status === 'REJECTED' || status === 'REJECT') return 'rejected';
        return 'review';
    };

    const getMessageClass = (msg) => {
        let classes = ['agent-msg', msg.agent];
        if (msg.step === 'header') classes.push('header');
        if (msg.step === 'complete') classes.push('complete');
        if (msg.step === 'error') classes.push('error');
        if (msg.step === 'divider') classes.push('divider');
        if (msg.step?.includes('check_failed')) classes.push('failed');
        if (msg.step?.includes('check_warning') || msg.step?.includes('conflict')) classes.push('warning');
        if (msg.step?.includes('ocr')) classes.push('info');
        return classes.join(' ');
    };

    // Check if invoice has a cached report
    const hasReport = (invoice) => {
        return invoice?.validation_result?.report != null;
    };

    // View cached report without running agents
    const handleViewCachedReport = (invoice) => {
        const cachedReport = invoice.validation_result?.report;
        const cachedValidation = invoice.validation_result || {};

        setReportResult(cachedReport);
        setValidationResult(cachedValidation);
        setResolverResult(invoice.validation_result?.resolution || null);
        setShowAgentModal(true);
        setAgentMessages([{ step: 'info', message: '📋 Showing cached report', agent: 'system' }]);
    };

    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1>Scanned Invoices</h1>
                        <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            borderRadius: '1rem',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontWeight: 600
                        }}>
                            🤖 {getProviderDisplayName(llmProvider)}
                        </span>
                    </div>
                    <p className="subtitle">Run AI agents for extraction, validation, and conflict resolution.</p>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={fetchInvoices}>Refresh</button>
                    <button className="primary-btn">Export Results</button>
                </div>
            </header>

            <div className="glass-card table-container">
                {isLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoices...</div>
                ) : error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-error)' }}>
                        Error: {error}
                    </div>
                ) : (
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Filename</th>
                                <th>Upload Date</th>
                                <th>Type</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No invoices found. Upload some on the dashboard!
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="inv-id">#{inv.id}</td>
                                        <td>{inv.filename}</td>
                                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td className="gstin-code">{inv.content_type}</td>
                                        <td>{Math.round(inv.size / 1024)} KB</td>
                                        <td>{getStatusTag(inv)}</td>
                                        <td className="action-buttons">
                                            <button
                                                className="analyze-btn"
                                                onClick={() => handleAnalyze(inv)}
                                            >
                                                🔍 Extract
                                            </button>
                                            {hasReport(inv) ? (
                                                <button
                                                    className="view-report-btn"
                                                    onClick={() => handleViewCachedReport(inv)}
                                                >
                                                    📊 View Report
                                                </button>
                                            ) : (
                                                <button
                                                    className="validate-btn"
                                                    onClick={() => handleRunAgents(inv)}
                                                    disabled={processingId === inv.id || !inv.extraction_result}
                                                    title={!inv.extraction_result ? 'Run Extract first' : 'Run all agents'}
                                                >
                                                    {processingId === inv.id ? '⏳' : '🤖'} Run Agents
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Extraction Modal */}
            {selectedInvoice && (
                <ExtractionModal
                    upload={selectedInvoice}
                    onClose={handleCloseModal}
                    onExtractionComplete={handleExtractionComplete}
                />
            )}

            {/* Agent Processing Modal */}
            {showAgentModal && (
                <div className="modal-overlay" onClick={() => !processingId && setShowAgentModal(false)}>
                    <div className="agent-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🤖 Agent Processing Pipeline</h3>
                            {!processingId && (
                                <button className="close-btn" onClick={() => {
                                    setShowAgentModal(false);
                                    fetchInvoices();
                                }}>×</button>
                            )}
                        </div>
                        <div className="modal-content">
                            {/* Agent Logs */}
                            <div className="agent-stream" ref={streamContainerRef}>
                                {agentMessages.map((msg, idx) => (
                                    <div key={idx} className={getMessageClass(msg)}>
                                        {msg.message}
                                    </div>
                                ))}
                                {processingId && (
                                    <div className="agent-msg processing">
                                        <span className="spinner"></span>
                                        {currentAgent === 'validator' ? 'Validating...' :
                                            currentAgent === 'resolver' ? 'Resolving...' : 'Generating report...'}
                                    </div>
                                )}
                            </div>

                            {/* Results Summary - Show when report is ready */}
                            {reportResult && (
                                <div className={`agent-summary ${getStatusClass(reportResult.decision?.status)}`}>
                                    <div className="summary-header">
                                        <span className={`status-badge ${getStatusClass(reportResult.decision?.status)}`}>
                                            {reportResult.decision?.status}
                                        </span>
                                        <span className="risk-badge">
                                            Risk: {reportResult.risk_assessment?.level}
                                        </span>
                                    </div>

                                    <div className="exec-summary">
                                        <p>{reportResult.executive_summary}</p>
                                    </div>

                                    {validationResult && (
                                        <div className="validation-summary">
                                            <h5>Validation</h5>
                                            <div className="stats-row">
                                                <span className="stat passed">✓ {validationResult.checks_passed} Passed</span>
                                                <span className="stat failed">✗ {validationResult.checks_failed} Failed</span>
                                                <span className="stat warned">⚠ {validationResult.checks_warned} Warnings</span>
                                            </div>
                                        </div>
                                    )}

                                    {reportResult.action_items?.length > 0 && (
                                        <div className="actions-section">
                                            <h5>🚨 Action Items ({reportResult.action_items.length})</h5>
                                            {reportResult.action_items.slice(0, 3).map((action, idx) => (
                                                <div key={idx} className={`action-item ${action.priority?.toLowerCase()}`}>
                                                    <span className="priority">{action.priority}</span>
                                                    <span className="action-text">{action.action}</span>
                                                    <span className="owner">{action.owner} - {action.deadline}</span>
                                                </div>
                                            ))}
                                            {reportResult.action_items.length > 3 && (
                                                <div className="more-actions">+{reportResult.action_items.length - 3} more</div>
                                            )}
                                        </div>
                                    )}

                                    {reportResult.approval_workflow?.escalation_needed && (
                                        <div className="human-review-alert">
                                            ⚠️ Escalation Required: {reportResult.approval_workflow.required_level}
                                        </div>
                                    )}

                                    <button
                                        className="primary-btn full-width"
                                        onClick={() => {
                                            setShowAgentModal(false);
                                            fetchInvoices();
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
