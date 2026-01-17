import { useState, useEffect, useRef } from 'react';
import { streamValidation } from '../services/validationService';
import './ValidationStreamPanel.css';

/**
 * ValidationStreamPanel Component
 * 
 * Shows real-time streaming validation progress with LLM analysis.
 */
const ValidationStreamPanel = ({ uploadId, extractionResult, onComplete, onViewDetails }) => {
    const [messages, setMessages] = useState([]);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const messagesEndRef = useRef(null);
    const cleanupRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);

    const startValidation = () => {
        if (isProcessing) return;

        setIsStarted(true);
        setIsProcessing(true);
        setMessages([]);
        setResult(null);

        cleanupRef.current = streamValidation(
            uploadId,
            // onMessage
            (data) => {
                setMessages((prev) => [...prev, data]);
            },
            // onComplete
            (validationResult) => {
                setResult(validationResult);
                setIsProcessing(false);
                onComplete && onComplete(validationResult);
            },
            // onError
            (error) => {
                setMessages((prev) => [...prev, {
                    step: 'error',
                    message: `❌ Error: ${error.message}`
                }]);
                setIsProcessing(false);
            }
        );
    };

    const handleClose = () => {
        if (cleanupRef.current) {
            cleanupRef.current();
        }
        onComplete && onComplete(result);
    };

    const getStatusIcon = () => {
        if (!result) return '🔍';
        if (result.overall_status === 'APPROVED') return '✅';
        if (result.overall_status === 'REJECTED') return '❌';
        return '⚠️';
    };

    const getStatusClass = () => {
        if (!result) return '';
        if (result.overall_status === 'APPROVED') return 'approved';
        if (result.overall_status === 'REJECTED') return 'rejected';
        return 'review';
    };

    if (!isStarted) {
        return (
            <div className="validation-stream-panel not-started">
                <div className="validation-prompt">
                    <div className="prompt-icon">🛡️</div>
                    <h4>Ready for Compliance Validation</h4>
                    <p>Run LLM-powered validation against 45 compliance checks including GST, TDS, and policy rules.</p>
                    <button className="start-validation-btn" onClick={startValidation}>
                        <span className="btn-icon">🤖</span>
                        Start Validation
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="validation-stream-panel">
            <div className="stream-header">
                <h4>
                    {getStatusIcon()} Validator Agent
                    {result && (
                        <span className={`status-badge ${getStatusClass()}`}>
                            {result.overall_status.replace(/_/g, ' ')}
                        </span>
                    )}
                </h4>
                <button className="close-stream-btn" onClick={handleClose}>×</button>
            </div>

            {/* Streaming Messages */}
            <div className="stream-messages">
                {messages.length === 0 && isProcessing && (
                    <div className="stream-message">
                        <span className="stream-spinner"></span>
                        Initializing Validator Agent...
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`stream-message ${msg.step}`}>
                        {msg.message}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Result Summary */}
            {result && (
                <div className={`validation-result ${getStatusClass()}`}>
                    <div className="result-score">
                        <div className="score-circle">
                            <span className="score-value">{Math.round(result.compliance_score)}</span>
                            <span className="score-label">%</span>
                        </div>
                        <div className="score-label">Compliance Score</div>
                    </div>

                    <div className="result-stats">
                        <div className="stat passed">
                            <span className="stat-value">{result.checks_passed}</span>
                            <span className="stat-label">Passed</span>
                        </div>
                        <div className="stat failed">
                            <span className="stat-value">{result.checks_failed}</span>
                            <span className="stat-label">Failed</span>
                        </div>
                        <div className="stat warned">
                            <span className="stat-value">{result.checks_warned}</span>
                            <span className="stat-label">Warnings</span>
                        </div>
                    </div>

                    {result.human_intervention?.required && (
                        <div className="human-intervention">
                            <h5>⚠️ Human Intervention Required</h5>
                            {result.human_intervention.approval_level_required && (
                                <p className="approval-level">
                                    Approval Level: <strong>{result.human_intervention.approval_level_required}</strong>
                                </p>
                            )}
                            <ul className="intervention-reasons">
                                {result.human_intervention.reasons?.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="result-actions">
                        <button
                            className="view-details-btn"
                            onClick={() => onViewDetails && onViewDetails(result)}
                        >
                            View Full Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidationStreamPanel;
