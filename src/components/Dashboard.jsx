import React, { useRef, useState } from 'react';
import { uploadFiles } from '../services/uploadService';
import ExtractionStreamPanel from './ExtractionStreamPanel';
import ValidationStreamPanel from './ValidationStreamPanel';
import ResolverStreamPanel from './ResolverStreamPanel';
import ReporterStreamPanel from './ReporterStreamPanel';
import ExtractionModal from './ExtractionModal';
import './Dashboard.css';

const Dashboard = () => {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const [showStreamPanel, setShowStreamPanel] = useState(false);
    const [selectedForDetails, setSelectedForDetails] = useState(null);

    // Extraction and Validation state
    const [extractionComplete, setExtractionComplete] = useState(false);
    const [extractionResults, setExtractionResults] = useState({});
    const [currentUploadId, setCurrentUploadId] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [validationComplete, setValidationComplete] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);

    // Resolver state
    const [resolverResult, setResolverResult] = useState(null);
    const [resolverComplete, setResolverComplete] = useState(false);
    const [showResolverModal, setShowResolverModal] = useState(false);

    // Reporter state
    const [reportResult, setReportResult] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    const handleAction = (action) => {
        alert(`${action} triggered! The agent is now preparing the requested data.`);
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            setSelectedFiles(files);
            setUploadResults(null);
            setShowStreamPanel(false);
            setExtractionComplete(false);
            setExtractionResults({});
            setValidationResult(null);
            setValidationComplete(false);
            setResolverResult(null);
            setResolverComplete(false);
            setReportResult(null);
            console.log('Selected files:', files.map(f => f.name));
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        setUploadResults(null);
        setShowStreamPanel(false);
        setExtractionComplete(false);
        setValidationResult(null);

        try {
            const results = await uploadFiles(selectedFiles);
            setUploadResults(results);
            setSelectedFiles([]);

            // Check for duplicates
            const duplicates = results.filter(r => r.status === 'duplicate');
            if (duplicates.length > 0) {
                const duplicateNames = duplicates.map(d => `• ${d.filename} (already exists as ID: ${d.id})`).join('\n');
                alert(`⚠️ Duplicate File(s) Detected:\n\n${duplicateNames}\n\nThese files were not uploaded again. Check the Invoices page to view existing records.`);
                setShowStreamPanel(false);
                return;
            }

            setShowStreamPanel(true);

            // Track the first upload ID for validation
            if (results.length > 0 && results[0].id) {
                setCurrentUploadId(results[0].id);
            }
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleStreamComplete = (results) => {
        console.log('Extraction complete:', results);
        setExtractionResults(results);
        setExtractionComplete(true);
    };

    const handleViewDetails = (file, result) => {
        setSelectedForDetails({ ...file, extraction_result: result });
    };

    const handleCloseModal = () => {
        setSelectedForDetails(null);
    };

    const handleValidationComplete = (result) => {
        console.log('Validation complete:', result);
        setValidationResult(result);
        setValidationComplete(true);
    };

    const handleViewValidationDetails = (result) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowValidationModal(true);
    };

    const handleResolverComplete = (result) => {
        console.log('Resolver complete:', result);
        setResolverResult(result);
        setResolverComplete(true);
    };

    const handleViewResolverDetails = (result) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowResolverModal(true);
    };

    const handleReportComplete = (result) => {
        console.log('Report complete:', result);
        setReportResult(result);
    };

    const handleViewReportDetails = (result) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowReportModal(true);
    };

    return (
        <div className="dashboard-content fade-in">
            <header className="dashboard-header">
                <div>
                    <h1>Compliance Overview</h1>
                    <p className="subtitle">Welcome back, John. Here is what's happening today.</p>
                </div>
                <button className="primary-btn" onClick={() => handleAction('Generate Full Report')}>
                    Generate Full Report
                </button>
            </header>

            <div className="stats-grid">
                <div className="glass-card stat-card" onClick={() => handleAction('Invoices Detail')} style={{ cursor: 'pointer' }}>
                    <span className="stat-label">Invoices Processed</span>
                    <span className="stat-value">1,284</span>
                    <span className="stat-trend positive">+12% from last month</span>
                </div>
                <div className="glass-card stat-card" onClick={() => handleAction('Compliance Detail')} style={{ cursor: 'pointer' }}>
                    <span className="stat-label">Compliance Rate</span>
                    <span className="stat-value">99.2%</span>
                    <span className="stat-trend positive">Stable</span>
                </div>
                <div className="glass-card stat-card" onClick={() => handleAction('Flagged Invoices')} style={{ cursor: 'pointer' }}>
                    <span className="stat-label">Active Flags</span>
                    <span className="stat-value">14</span>
                    <span className="stat-trend negative">+2 since yesterday</span>
                </div>
                <div className="glass-card stat-card" onClick={() => handleAction('Review Queue')} style={{ cursor: 'pointer' }}>
                    <span className="stat-label">Pending Review</span>
                    <span className="stat-value">5</span>
                    <span className="stat-trend">Needs attention</span>
                </div>
            </div>

            <div className="glass-card upload-section">
                <div className="upload-inner">
                    <span className="upload-icon">📤</span>
                    <h3>{selectedFiles.length > 0 ? `${selectedFiles.length} File(s) Selected` : 'Upload Invoices for Validation'}</h3>
                    <p>
                        {selectedFiles.length > 0
                            ? `Ready to validate: ${selectedFiles.map(f => f.name).join(', ')}`
                            : 'Drag and drop PDF, images (JPEG/PNG), or data files (JSON/CSV)'}
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg,.json,.csv"
                        multiple
                    />

                    <div className="upload-actions">
                        <button className="secondary-btn" onClick={handleBrowseClick} disabled={isUploading}>
                            {selectedFiles.length > 0 ? 'Add More Files' : 'Browse Files'}
                        </button>
                        {selectedFiles.length > 0 && (
                            <button className="primary-btn" onClick={handleUpload} disabled={isUploading}>
                                {isUploading ? 'Uploading...' : '🚀 Upload & Analyze'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Streaming Extraction Panel */}
                {showStreamPanel && uploadResults && uploadResults.length > 0 && (
                    <ExtractionStreamPanel
                        uploadResults={uploadResults}
                        onComplete={handleStreamComplete}
                        onViewDetails={handleViewDetails}
                    />
                )}

                {/* Validation Panel - Shows after extraction is complete */}
                {extractionComplete && currentUploadId && (
                    <ValidationStreamPanel
                        uploadId={currentUploadId}
                        extractionResult={extractionResults[currentUploadId]}
                        onComplete={handleValidationComplete}
                        onViewDetails={handleViewValidationDetails}
                    />
                )}

                {/* Resolver Panel - Shows after validation is complete */}
                {validationComplete && currentUploadId && (
                    <ResolverStreamPanel
                        uploadId={currentUploadId}
                        validationResult={validationResult}
                        onComplete={handleResolverComplete}
                        onViewDetails={handleViewResolverDetails}
                    />
                )}

                {/* Reporter Panel - Shows after resolver is complete */}
                {resolverComplete && currentUploadId && (
                    <ReporterStreamPanel
                        uploadId={currentUploadId}
                        resolverResult={resolverResult}
                        onComplete={handleReportComplete}
                        onViewDetails={handleViewReportDetails}
                    />
                )}
            </div>

            {/* Extraction Modal for viewing details */}
            {selectedForDetails && (
                <ExtractionModal
                    upload={selectedForDetails}
                    onClose={handleCloseModal}
                />
            )}

            {/* Validation Result Modal */}
            {showValidationModal && validationResult && (
                <div className="modal-overlay" onClick={() => setShowValidationModal(false)}>
                    <div className="validation-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Validation Report</h3>
                            <button className="close-btn" onClick={() => setShowValidationModal(false)}>×</button>
                        </div>
                        <div className="modal-content">
                            <div className="validation-summary">
                                <div className={`status-badge large ${validationResult.overall_status?.toLowerCase()}`}>
                                    {validationResult.overall_status?.replace(/_/g, ' ')}
                                </div>
                                <div className="score-display">
                                    <span className="score">{Math.round(validationResult.compliance_score)}%</span>
                                    <span className="label">Compliance Score</span>
                                </div>
                            </div>

                            {validationResult.llm_reasoning && (
                                <div className="reasoning-section">
                                    <h4>AI Analysis</h4>
                                    <p>{validationResult.llm_reasoning}</p>
                                </div>
                            )}

                            {validationResult.validation_results?.length > 0 && (
                                <div className="failed-checks">
                                    <h4>Issues Found ({validationResult.validation_results.length})</h4>
                                    {validationResult.validation_results.map((check, idx) => (
                                        <div key={idx} className={`check-item ${check.status?.toLowerCase()}`}>
                                            <span className="check-code">{check.check_code}</span>
                                            <span className="check-message">{check.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {validationResult.detected_anomalies?.length > 0 && (
                                <div className="anomalies-section">
                                    <h4>⚠️ Anomalies Detected</h4>
                                    <ul>
                                        {validationResult.detected_anomalies.map((a, idx) => (
                                            <li key={idx}>{a}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Resolver Result Modal */}
            {showResolverModal && resolverResult && (
                <div className="modal-overlay" onClick={() => setShowResolverModal(false)}>
                    <div className="resolver-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚖️ Resolver Report</h3>
                            <button className="close-btn" onClick={() => setShowResolverModal(false)}>×</button>
                        </div>
                        <div className="modal-content">
                            <div className="resolver-summary">
                                <div className={`status-badge large ${resolverResult.final_recommendation?.toLowerCase()}`}>
                                    {resolverResult.final_recommendation}
                                </div>
                                <div className="score-display">
                                    <span className="score">{Math.round((resolverResult.confidence_score || 0) * 100)}%</span>
                                    <span className="label">Confidence Score</span>
                                </div>
                            </div>

                            {resolverResult.reasoning && (
                                <div className="reasoning-section">
                                    <h4>🤖 AI Reasoning</h4>
                                    <p>{resolverResult.reasoning}</p>
                                </div>
                            )}

                            {resolverResult.conflict_resolutions?.length > 0 && (
                                <div className="resolutions-section">
                                    <h4>📋 Conflict Resolutions ({resolverResult.conflict_resolutions.length})</h4>
                                    {resolverResult.conflict_resolutions.map((res, idx) => (
                                        <div key={idx} className="resolution-item">
                                            <div className="res-type">{res.conflict_type}</div>
                                            <div className="res-detail">{res.resolution}</div>
                                            <div className="res-basis">📚 {res.regulatory_basis}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {resolverResult.key_risks?.length > 0 && (
                                <div className="risks-section">
                                    <h4>⚠️ Key Risks</h4>
                                    <ul>
                                        {resolverResult.key_risks.map((risk, idx) => (
                                            <li key={idx}>{risk}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {resolverResult.requires_human_review && (
                                <div className="human-review-alert">
                                    👤 Human Review Required - Confidence below 70%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && reportResult && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="report-modal glass-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📊 Compliance Report</h3>
                            <button className="close-btn" onClick={() => setShowReportModal(false)}>×</button>
                        </div>
                        <div className="modal-content">
                            {/* Summary Header */}
                            <div className="report-summary-header">
                                <div className={`status-badge large ${reportResult.decision?.status?.toLowerCase()}`}>
                                    {reportResult.decision?.status}
                                </div>
                                <div className="risk-info">
                                    <span className="risk-label">Risk Level:</span>
                                    <span className={`risk-level ${reportResult.risk_assessment?.level?.toLowerCase()}`}>
                                        {reportResult.risk_assessment?.level}
                                    </span>
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div className="report-section">
                                <h4>📋 Executive Summary</h4>
                                <p>{reportResult.executive_summary}</p>
                            </div>

                            {/* Action Items */}
                            {reportResult.action_items?.length > 0 && (
                                <div className="report-section">
                                    <h4>🚨 Action Items ({reportResult.action_items.length})</h4>
                                    <div className="action-items-list">
                                        {reportResult.action_items.map((action, idx) => (
                                            <div key={idx} className={`action-row ${action.priority?.toLowerCase()}`}>
                                                <span className="priority-badge">{action.priority}</span>
                                                <div className="action-content">
                                                    <div className="action-text">{action.action}</div>
                                                    <div className="action-meta">
                                                        <span>👤 {action.owner}</span>
                                                        <span>⏱️ {action.deadline}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key Findings */}
                            {reportResult.key_findings?.length > 0 && (
                                <div className="report-section">
                                    <h4>🔍 Key Findings</h4>
                                    {reportResult.key_findings.map((finding, idx) => (
                                        <div key={idx} className="finding-item">
                                            <span className="finding-category">{finding.category}</span>
                                            <div className="finding-text">{finding.finding}</div>
                                            <div className="finding-rec">→ {finding.recommendation}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recommendations */}
                            {reportResult.recommendations?.length > 0 && (
                                <div className="report-section">
                                    <h4>💡 Recommendations</h4>
                                    <ul className="recommendations-list">
                                        {reportResult.recommendations.map((rec, idx) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Approval Workflow */}
                            {reportResult.approval_workflow && (
                                <div className="report-section workflow">
                                    <h4>👤 Approval Workflow</h4>
                                    <div className="workflow-info">
                                        <span>Required: <strong>{reportResult.approval_workflow.required_level}</strong></span>
                                        {reportResult.approval_workflow.escalation_needed && (
                                            <span className="escalation-badge">⚠️ Escalation Needed</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;


