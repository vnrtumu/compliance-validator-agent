import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getInvoices, updateInvoiceStatus } from '../services/uploadService';
import { getLLMSettings } from '../services/settingsService';
import { streamValidation } from '../services/validationService';
import { streamResolution } from '../services/resolverService';
import { streamReport } from '../services/reporterService';
import ExtractionModal from './ExtractionModal';
import './Invoices.css';

const Invoices = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Filter states - initialize from URL params
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [processingFilter, setProcessingFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Auto-refresh for processing status
    useEffect(() => {
        const interval = setInterval(() => {
            // Refresh if any invoice is still processing
            const hasProcessing = invoices.some(inv =>
                inv.batch_processing_status === 'processing' ||
                inv.batch_processing_status === 'pending'
            );
            if (hasProcessing) {
                fetchInvoices();
            }
        }, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [invoices]);

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

    // Filtered invoices based on filters
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            // Status filter (based on invoice_status)
            if (statusFilter !== 'all') {
                if (statusFilter === 'approved' && inv.invoice_status !== 'APPROVED') return false;
                if (statusFilter === 'rejected' && inv.invoice_status !== 'REJECTED') return false;
                if (statusFilter === 'review' && inv.invoice_status !== 'HUMAN_REVIEW_NEEDED') return false;
                if (statusFilter === 'pending' && inv.invoice_status) return false;
            }

            // Processing filter
            if (processingFilter !== 'all') {
                if (processingFilter === 'completed' && inv.batch_processing_status !== 'completed') return false;
                if (processingFilter === 'processing' && inv.batch_processing_status !== 'processing') return false;
                if (processingFilter === 'pending' && inv.batch_processing_status !== 'pending') return false;
                if (processingFilter === 'failed' && inv.batch_processing_status !== 'failed') return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return inv.filename?.toLowerCase().includes(query) ||
                    inv.id?.toString().includes(query);
            }

            return true;
        });
    }, [invoices, statusFilter, processingFilter, searchQuery]);

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

                // Refresh invoices list to show updated button
                fetchInvoices();
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
        // Primary: Use invoice_status from the database
        if (invoice.invoice_status) {
            if (invoice.invoice_status === 'APPROVED') {
                return <span className="status-tag approved">✓ Approved</span>;
            } else if (invoice.invoice_status === 'REJECTED') {
                return <span className="status-tag rejected">✗ Rejected</span>;
            } else if (invoice.invoice_status === 'HUMAN_REVIEW_NEEDED') {
                return <span className="status-tag review">⚠ Review</span>;
            }
        }

        // Show processing status if batch processing is in progress
        if (invoice.batch_processing_status === 'processing') {
            return <span className="status-tag processing">⏳ Processing</span>;
        }
        if (invoice.batch_processing_status === 'pending') {
            return <span className="status-tag pending">🕐 Pending</span>;
        }
        if (invoice.batch_processing_status === 'failed') {
            return <span className="status-tag rejected">❌ Failed</span>;
        }

        // Fallback to extraction status
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
        return invoice?.reporter_result != null;
    };

    // View cached report without running agents
    const handleViewCachedReport = (invoice) => {
        // Inject the ID into the report result so buttons can use it
        const cachedReport = { ...invoice.reporter_result, upload_id: invoice.id };
        const cachedValidation = invoice.validation_result || {};
        const cachedResolver = invoice.resolver_result || null;

        setReportResult(cachedReport);
        setValidationResult(cachedValidation);
        setResolverResult(cachedResolver);
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
                {/* Filter Section */}
                <div className="filter-section" style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="🔍 Search by filename or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            minWidth: '200px'
                        }}
                    />

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="approved">✓ Approved</option>
                        <option value="rejected">✗ Rejected</option>
                        <option value="review">⚠ Need Review</option>
                        <option value="pending">🕐 Pending</option>
                    </select>

                    {/* Processing Filter */}
                    <select
                        value={processingFilter}
                        onChange={(e) => setProcessingFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white'
                        }}
                    >
                        <option value="all">All Processing</option>
                        <option value="completed">✅ Completed</option>
                        <option value="processing">⏳ Processing</option>
                        <option value="pending">🕐 Pending</option>
                        <option value="failed">❌ Failed</option>
                    </select>

                    {/* Stats */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#4ade80' }}>✓ {invoices.filter(i => i.invoice_status === 'APPROVED').length} Approved</span>
                        <span style={{ color: '#f87171' }}>✗ {invoices.filter(i => i.invoice_status === 'REJECTED').length} Rejected</span>
                        <span style={{ color: '#fbbf24' }}>⚠ {invoices.filter(i => i.invoice_status === 'HUMAN_REVIEW_NEEDED').length} Review</span>
                        <span style={{ color: '#60a5fa' }}>📋 {filteredInvoices.length}/{invoices.length}</span>
                    </div>
                </div>

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
                                <th>Score</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        {invoices.length === 0
                                            ? 'No invoices found. Upload some on the dashboard!'
                                            : 'No invoices match your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="inv-id">#{inv.id}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {inv.filename}
                                        </td>
                                        <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {inv.compliance_score ? (
                                                <span style={{
                                                    color: inv.compliance_score >= 80 ? '#4ade80' :
                                                        inv.compliance_score >= 60 ? '#fbbf24' : '#f87171',
                                                    fontWeight: 600
                                                }}>
                                                    {inv.compliance_score}%
                                                </span>
                                            ) : '-'}
                                        </td>
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
                                                    disabled={processingId === inv.id || !inv.extraction_result || inv.batch_processing_status === 'processing'}
                                                    title={!inv.extraction_result ? 'Run Extract first' : 'Run all agents'}
                                                >
                                                    {processingId === inv.id || inv.batch_processing_status === 'processing' ? '⏳' : '🤖'} Run Agents
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
                                    {/* Report Header with ID and Timestamp */}
                                    <div className="report-meta" style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
                                        <div>📋 {reportResult.report_id} | {reportResult.report_type}</div>
                                        <div>🕐 Generated: {new Date(reportResult.generated_at).toLocaleString()}</div>
                                    </div>

                                    {/* Decision & Risk Header */}
                                    <div className="summary-header">
                                        <span className={`status-badge ${getStatusClass(reportResult.decision?.status)}`}>
                                            {reportResult.decision?.status}
                                        </span>
                                        <span className="risk-badge">
                                            Risk: {reportResult.risk_assessment?.level} ({reportResult.risk_assessment?.score}/100)
                                        </span>
                                        {reportResult.decision?.confidence && (
                                            <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
                                                Confidence: {(reportResult.decision.confidence * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Executive Summary */}
                                    <div className="exec-summary">
                                        <p>{reportResult.executive_summary}</p>
                                    </div>

                                    {/* Decision Rationale */}
                                    {reportResult.decision?.rationale && (
                                        <div style={{ background: '#2a2a2a', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>💡 Decision Rationale</h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>{reportResult.decision.rationale}</p>
                                        </div>
                                    )}

                                    {/* Invoice Details */}
                                    {reportResult.invoice_details && (
                                        <div style={{ background: '#1e3a5f', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>📄 Invoice Details</h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <div><strong>Number:</strong> {reportResult.invoice_details.number}</div>
                                                <div><strong>Date:</strong> {reportResult.invoice_details.date}</div>
                                                <div><strong>Vendor:</strong> {reportResult.invoice_details.vendor}</div>
                                                <div><strong>Total:</strong> ₹{reportResult.invoice_details.total?.toLocaleString()}</div>
                                                {reportResult.invoice_details.gstin && (
                                                    <div style={{ gridColumn: 'span 2' }}><strong>GSTIN:</strong> {reportResult.invoice_details.gstin}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Compliance Stats */}
                                    {reportResult.compliance_stats && (
                                        <div className="validation-summary" style={{ marginTop: '0.75rem' }}>
                                            <h5>📊 Compliance Statistics</h5>
                                            <div className="stats-row">
                                                <span className="stat">Total: {reportResult.compliance_stats.total_checks}</span>
                                                <span className="stat passed">✓ {reportResult.compliance_stats.passed} Passed</span>
                                                <span className="stat failed">✗ {reportResult.compliance_stats.failed} Failed</span>
                                                <span className="stat warned">⚠ {reportResult.compliance_stats.warnings} Warnings</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                <span>GST: {reportResult.compliance_stats.gst_compliance}</span>
                                                <span>TDS: {reportResult.compliance_stats.tds_compliance}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Risk Factors */}
                                    {reportResult.risk_assessment?.factors?.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <h5 style={{ fontSize: '0.9rem' }}>⚠️ Risk Factors</h5>
                                            <ul style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.85rem', color: '#ffaa66' }}>
                                                {reportResult.risk_assessment.factors.map((factor, idx) => (
                                                    <li key={idx}>{factor}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Key Findings */}
                                    {reportResult.key_findings?.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <h5 style={{ fontSize: '0.9rem' }}>🔍 Key Findings</h5>
                                            {reportResult.key_findings.map((finding, idx) => (
                                                <div key={idx} style={{ background: '#2a2a2a', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <strong>[{finding.category}]</strong>
                                                        <span style={{ color: finding.impact === 'HIGH' ? '#ff6b6b' : finding.impact === 'MEDIUM' ? '#ffaa66' : '#66ff66' }}>
                                                            {finding.impact} Impact
                                                        </span>
                                                    </div>
                                                    <div>{finding.finding}</div>
                                                    <div style={{ color: '#66ccff', marginTop: '0.25rem' }}>→ {finding.recommendation}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Items */}
                                    {reportResult.action_items?.length > 0 && (
                                        <div className="actions-section">
                                            <h5>🚨 Action Items ({reportResult.action_items.length})</h5>
                                            {reportResult.action_items.map((action, idx) => (
                                                <div key={idx} className={`action-item ${action.priority?.toLowerCase()}`}>
                                                    <span className="priority">{action.priority}</span>
                                                    <span className="action-text">{action.action}</span>
                                                    <span className="owner">{action.owner} - {action.deadline}</span>
                                                    {action.regulatory_basis && (
                                                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                                                            📜 {action.regulatory_basis}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Recommendations */}
                                    {reportResult.recommendations?.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <h5 style={{ fontSize: '0.9rem' }}>💡 Recommendations</h5>
                                            <ul style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.85rem', color: '#66ff99' }}>
                                                {reportResult.recommendations.map((rec, idx) => (
                                                    <li key={idx}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Approval Workflow */}
                                    {reportResult.approval_workflow && (
                                        <div style={{ marginTop: '0.75rem', background: '#2a2a2a', padding: '0.75rem', borderRadius: '6px' }}>
                                            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>👤 Approval Workflow</h5>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                                <span>Current: <strong>{reportResult.approval_workflow.current_level}</strong></span>
                                                <span>Required: <strong>{reportResult.approval_workflow.required_level}</strong></span>
                                            </div>
                                            {reportResult.approval_workflow.escalation_needed && (
                                                <div className="human-review-alert" style={{ marginTop: '0.5rem' }}>
                                                    ⚠️ Escalation Required: {reportResult.approval_workflow.required_level}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* LLM Metadata */}
                                    {reportResult.llm_metadata && (
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', borderTop: '1px solid #333', paddingTop: '0.5rem' }}>
                                            🤖 Generated by: {reportResult.llm_metadata.provider.toUpperCase()} ({reportResult.llm_metadata.model})
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            className="secondary-btn"
                                            style={{
                                                borderColor: '#4ade80',
                                                color: '#4ade80'
                                            }}
                                            onClick={async () => {
                                                try {
                                                    const targetId = processingId || selectedInvoice?.id || reportResult?.upload_id || reportResult?.invoice_id;
                                                    if (!targetId) throw new Error("Invoice ID not found for action");

                                                    await updateInvoiceStatus(targetId, 'APPROVED');
                                                    setShowAgentModal(false);
                                                    fetchInvoices();
                                                } catch (e) {
                                                    alert('Failed to approve: ' + e.message);
                                                }
                                            }}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            className="secondary-btn"
                                            style={{
                                                borderColor: '#f87171',
                                                color: '#f87171'
                                            }}
                                            onClick={async () => {
                                                try {
                                                    // processingId (active), selectedInvoice (extraction), reportResult.upload_id/invoice_id (cached)
                                                    const targetId = processingId || selectedInvoice?.id || reportResult?.upload_id || reportResult?.invoice_id;
                                                    if (!targetId) throw new Error("Invoice ID not found for action");

                                                    await updateInvoiceStatus(targetId, 'REJECTED');
                                                    setShowAgentModal(false);
                                                    fetchInvoices();
                                                } catch (e) {
                                                    alert('Failed to reject: ' + e.message);
                                                }
                                            }}
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>

                                    <button
                                        className="primary-btn full-width"
                                        onClick={() => {
                                            setShowAgentModal(false);
                                            fetchInvoices();
                                        }}
                                        style={{ marginTop: '1rem' }}
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
