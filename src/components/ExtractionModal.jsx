import { useState, useEffect } from 'react';
import { extractDocument } from '../services/extractionService';
import './ExtractionModal.css';

/**
 * ExtractionModal Component
 * 
 * Displays the extraction results for an uploaded document.
 * Shows the AI agent's decision (Accept/Reject), confidence score,
 * and extracted invoice fields.
 */
const ExtractionModal = ({ upload, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        if (upload) {
            // Check if extraction_result is already available (from streaming)
            if (upload.extraction_result) {
                setResult(upload.extraction_result);
                setLoading(false);
            } else {
                runExtraction();
            }
        }
    }, [upload]);

    const runExtraction = async () => {
        setLoading(true);
        setError(null);

        try {
            const extractionResult = await extractDocument(upload.id);
            setResult(extractionResult);
        } catch (err) {
            setError(err.message || 'Extraction failed');
        } finally {
            setLoading(false);
        }
    };

    const formatFieldLabel = (key) => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const getConfidenceClass = (score) => {
        if (score >= 0.8) return 'high';
        if (score >= 0.5) return 'medium';
        return 'low';
    };

    const renderFieldValue = (value) => {
        if (value === null || value === undefined) {
            return <span className="field-value empty">Not found</span>;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="field-value empty">None</span>;
            }
            return <span className="field-value">{value.join(', ')}</span>;
        }
        if (typeof value === 'object') {
            return <span className="field-value">{JSON.stringify(value)}</span>;
        }
        return <span className="field-value">{String(value)}</span>;
    };

    const renderExtractedFields = (fields) => {
        if (!fields || Object.keys(fields).length === 0) {
            return <p style={{ color: 'rgba(255,255,255,0.5)' }}>No fields extracted</p>;
        }

        const simpleFields = {};
        let items = null;

        Object.entries(fields).forEach(([key, value]) => {
            if (key === 'items' && Array.isArray(value)) {
                items = value;
            } else {
                simpleFields[key] = value;
            }
        });

        return (
            <>
                <div className="fields-grid">
                    {Object.entries(simpleFields).map(([key, value]) => (
                        <div key={key} className="field-item">
                            <div className="field-label">{formatFieldLabel(key)}</div>
                            {renderFieldValue(value)}
                        </div>
                    ))}
                </div>

                {items && items.length > 0 && (
                    <div className="items-section">
                        <h5>Line Items</h5>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Rate</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.quantity || '-'}</td>
                                        <td>{item.rate ? `₹${item.rate}` : '-'}</td>
                                        <td>{item.amount ? `₹${item.amount}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="extraction-modal-overlay" onClick={onClose}>
            <div className="extraction-modal" onClick={(e) => e.stopPropagation()}>
                <div className="extraction-modal-header">
                    <h2>
                        📄 Document Analysis
                        {result && (
                            <span className="document-type">
                                {result.document_type?.replace(/_/g, ' ')}
                            </span>
                        )}
                    </h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="extraction-modal-content">
                    {loading && (
                        <div className="extraction-loading">
                            <div className="spinner"></div>
                            <p>Analyzing document with AI...</p>
                            <p style={{ fontSize: '0.8rem', marginTop: '8px', opacity: 0.6 }}>
                                {upload?.filename}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="extraction-error">
                            <p>❌ {error}</p>
                            <button className="retry-button" onClick={runExtraction}>
                                Retry Analysis
                            </button>
                        </div>
                    )}

                    {!loading && !error && result && (
                        <>
                            {/* Decision Banner */}
                            <div className={`decision-banner ${result.decision?.toLowerCase()}`}>
                                <div className="decision-icon">
                                    {result.decision === 'ACCEPT' ? '✓' : '✗'}
                                </div>
                                <div className="decision-info">
                                    <h3>
                                        {result.decision === 'ACCEPT'
                                            ? 'Document Accepted'
                                            : 'Document Rejected'}
                                    </h3>
                                    <p>
                                        {result.is_valid_invoice
                                            ? 'This is a valid GST invoice suitable for compliance processing.'
                                            : 'This document does not meet GST invoice requirements.'}
                                    </p>
                                </div>
                            </div>

                            {/* Confidence Score */}
                            <div className="confidence-section">
                                <div className="confidence-label">
                                    Confidence Score: {(result.confidence_score * 100).toFixed(1)}%
                                </div>
                                <div className="confidence-bar">
                                    <div
                                        className={`confidence-fill ${getConfidenceClass(result.confidence_score)}`}
                                        style={{ width: `${result.confidence_score * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Rejection Reasons */}
                            {result.rejection_reasons && result.rejection_reasons.length > 0 && (
                                <div className="rejection-reasons">
                                    <h4>⚠️ Issues Found</h4>
                                    <ul>
                                        {result.rejection_reasons.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Extracted Fields */}
                            <div className="extracted-fields">
                                <h4>📋 Extracted Information</h4>
                                {renderExtractedFields(result.extracted_fields)}
                            </div>

                            {/* JSON Toggle Section */}
                            <div className="json-section">
                                <button
                                    className="json-toggle-btn"
                                    onClick={() => setShowJson(!showJson)}
                                >
                                    {showJson ? '📋 Hide JSON' : '{ } View Raw JSON'}
                                </button>

                                {showJson && (
                                    <div className="json-viewer">
                                        <div className="json-header">
                                            <span>Raw Extraction Result</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                                                    alert('JSON copied to clipboard!');
                                                }}
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                        <pre className="json-content">
                                            {JSON.stringify(result, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExtractionModal;
