import React, { useEffect, useState, useRef } from 'react';
import { getInvoices } from '../services/uploadService';
import { streamValidation } from '../services/validationService';
import { streamResolution } from '../services/resolverService';
import ExtractionModal from './ExtractionModal';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Combined Agent state (Validator + Resolver)
    const [processingId, setProcessingId] = useState(null);
    const [agentMessages, setAgentMessages] = useState([]);
    const [currentAgent, setCurrentAgent] = useState(null); // 'validator' or 'resolver'
    const [validationResult, setValidationResult] = useState(null);
    const [resolverResult, setResolverResult] = useState(null);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const streamContainerRef = useRef(null);

    useEffect(() => {
        fetchInvoices();
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

    const handleAnalyze = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleCloseModal = () => {
        setSelectedInvoice(null);
        fetchInvoices();
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
                setAgentMessages(prev => [...prev, {
                    step: 'complete',
                    message: `✅ Resolution complete: ${result.final_recommendation} (${Math.round(result.confidence_score * 100)}% confidence)`,
                    agent: 'resolver'
                }]);
                setProcessingId(null);
                setCurrentAgent(null);
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

    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Scanned Invoices</h1>
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
                                            <button
                                                className="validate-btn"
                                                onClick={() => handleRunAgents(inv)}
                                                disabled={processingId === inv.id || !inv.extraction_result}
                                                title={!inv.extraction_result ? 'Run Extract first' : 'Run Validator + Resolver'}
                                            >
                                                {processingId === inv.id ? '⏳' : '🤖'} Run Agents
                                            </button>
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
                                        {currentAgent === 'validator' ? 'Validating...' : 'Resolving...'}
                                    </div>
                                )}
                            </div>

                            {/* Results Summary */}
                            {resolverResult && (
                                <div className={`agent-summary ${getStatusClass(resolverResult.final_recommendation)}`}>
                                    <div className="summary-header">
                                        <span className={`status-badge ${getStatusClass(resolverResult.final_recommendation)}`}>
                                            {resolverResult.final_recommendation}
                                        </span>
                                        <span className="confidence">
                                            {Math.round(resolverResult.confidence_score * 100)}% Confidence
                                        </span>
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

                                    {resolverResult.conflict_resolutions?.length > 0 && (
                                        <div className="resolution-summary">
                                            <h5>Resolutions ({resolverResult.conflict_resolutions.length})</h5>
                                            {resolverResult.conflict_resolutions.map((res, idx) => (
                                                <div key={idx} className="resolution-item">
                                                    <strong>{res.conflict_type}</strong>
                                                    <p>{res.resolution}</p>
                                                    <small>📚 {res.regulatory_basis}</small>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {resolverResult.key_risks?.length > 0 && (
                                        <div className="risks-section">
                                            <h5>⚠️ Key Risks</h5>
                                            <ul>
                                                {resolverResult.key_risks.map((risk, idx) => (
                                                    <li key={idx}>{risk}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {resolverResult.requires_human_review && (
                                        <div className="human-review-alert">
                                            👤 Human Review Required (Confidence below 70%)
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
