import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/uploadService';
import { streamValidation } from '../services/validationService';
import ExtractionModal from './ExtractionModal';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Validation state
    const [validatingId, setValidatingId] = useState(null);
    const [validationMessages, setValidationMessages] = useState([]);
    const [validationResult, setValidationResult] = useState(null);
    const [showValidationModal, setShowValidationModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

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

    const handleValidate = (invoice) => {
        if (!invoice.extraction_result) {
            alert('Please run extraction (Analyze) first before validation.');
            return;
        }

        setValidatingId(invoice.id);
        setValidationMessages([]);
        setValidationResult(null);
        setShowValidationModal(true);

        const cleanup = streamValidation(
            invoice.id,
            (data) => {
                setValidationMessages(prev => [...prev, data]);
            },
            (result) => {
                setValidationResult(result);
                setValidatingId(null);
            },
            (error) => {
                setValidationMessages(prev => [...prev, {
                    step: 'error',
                    message: `❌ Error: ${error.message}`
                }]);
                setValidatingId(null);
            }
        );
    };

    const getStatusTag = (invoice) => {
        // Show validation status if available
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
        if (status === 'APPROVED') return 'approved';
        if (status === 'REJECTED') return 'rejected';
        return 'review';
    };

    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Scanned Invoices</h1>
                    <p className="subtitle">Click "Analyze" to extract, then "Validate" for compliance check.</p>
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
                                        <td>
                                            {getStatusTag(inv)}
                                        </td>
                                        <td className="action-buttons">
                                            <button
                                                className="analyze-btn"
                                                onClick={() => handleAnalyze(inv)}
                                            >
                                                🔍 Analyze
                                            </button>
                                            <button
                                                className="validate-btn"
                                                onClick={() => handleValidate(inv)}
                                                disabled={validatingId === inv.id || !inv.extraction_result}
                                                title={!inv.extraction_result ? 'Run Analyze first' : 'Run compliance validation'}
                                            >
                                                {validatingId === inv.id ? '⏳' : '🛡️'} Validate
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

            {/* Validation Modal */}
            {showValidationModal && (
                <div className="modal-overlay" onClick={() => !validatingId && setShowValidationModal(false)}>
                    <div className="validation-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🛡️ Compliance Validation</h3>
                            {!validatingId && (
                                <button className="close-btn" onClick={() => setShowValidationModal(false)}>×</button>
                            )}
                        </div>
                        <div className="modal-content">
                            {/* Streaming Messages */}
                            <div className="validation-stream">
                                {validationMessages.map((msg, idx) => (
                                    <div key={idx} className={`stream-msg ${msg.step}`}>
                                        {msg.message}
                                    </div>
                                ))}
                                {validatingId && (
                                    <div className="stream-msg processing">
                                        <span className="spinner"></span> Processing...
                                    </div>
                                )}
                            </div>

                            {/* Result */}
                            {validationResult && (
                                <div className={`validation-result ${getStatusClass(validationResult.overall_status)}`}>
                                    <div className="result-header">
                                        <span className={`status-badge ${getStatusClass(validationResult.overall_status)}`}>
                                            {validationResult.overall_status?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="score">
                                            {Math.round(validationResult.compliance_score)}% Compliance
                                        </span>
                                    </div>

                                    <div className="result-stats">
                                        <span className="stat passed">✓ {validationResult.checks_passed} Passed</span>
                                        <span className="stat failed">✗ {validationResult.checks_failed} Failed</span>
                                        <span className="stat warned">⚠ {validationResult.checks_warned} Warnings</span>
                                    </div>

                                    {validationResult.llm_reasoning && (
                                        <div className="reasoning">
                                            <strong>AI Analysis:</strong> {validationResult.llm_reasoning}
                                        </div>
                                    )}

                                    {validationResult.human_intervention?.required && (
                                        <div className="intervention-alert">
                                            <strong>⚠️ Human Review Required</strong>
                                            {validationResult.human_intervention.approval_level_required && (
                                                <p>Approval Level: {validationResult.human_intervention.approval_level_required}</p>
                                            )}
                                            <ul>
                                                {validationResult.human_intervention.reasons?.map((r, i) => (
                                                    <li key={i}>{r}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        className="primary-btn"
                                        onClick={() => {
                                            setShowValidationModal(false);
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


