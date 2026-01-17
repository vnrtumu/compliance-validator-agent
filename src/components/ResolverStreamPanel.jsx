import React, { useState, useEffect, useRef } from 'react';
import { streamResolution } from '../services/resolverService';
import './ResolverStreamPanel.css';

/**
 * Resolver Stream Panel
 * 
 * Displays real-time streaming of Resolver Agent progress.
 * Handles conflicts, OCR errors, temporal rules, and LLM resolution.
 */
const ResolverStreamPanel = ({ uploadId, validationResult, onComplete, onViewDetails }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState([]);
    const [result, setResult] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);
    const streamContainerRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom of stream container
        if (streamContainerRef.current) {
            streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleStart = () => {
        if (!uploadId) return;

        setIsProcessing(true);
        setHasStarted(true);
        setMessages([]);
        setResult(null);

        const cleanup = streamResolution(
            uploadId,
            // onMessage
            (data) => {
                setMessages(prev => [...prev, data]);
            },
            // onComplete
            (resolverResult) => {
                setResult(resolverResult);
                setIsProcessing(false);
                onComplete && onComplete(resolverResult);
            },
            // onError
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
        if (result) {
            if (result.final_recommendation === 'APPROVE') return 'approved';
            if (result.final_recommendation === 'REJECT') return 'rejected';
            return 'review';
        }
        return '';
    };

    const getMessageClass = (msg) => {
        let classes = ['stream-msg'];
        if (msg.step?.includes('error')) classes.push('error');
        if (msg.step?.includes('complete')) classes.push('complete');
        if (msg.step?.includes('conflict')) classes.push('warning');
        if (msg.step?.includes('ocr')) classes.push('info');
        if (msg.step?.includes('temporal_warn')) classes.push('warning');
        return classes.join(' ');
    };

    return (
        <div className={`resolver-stream-panel ${getStatusClass()}`}>
            <div className="panel-header">
                <div className="panel-title">
                    <span className="panel-icon">⚖️</span>
                    <h4>Resolver Agent</h4>
                    <span className="panel-subtitle">Conflict Resolution & OCR Correction</span>
                </div>
                {!hasStarted && (
                    <button className="start-btn resolver" onClick={handleStart} disabled={!uploadId}>
                        🤖 Start Resolution
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
                                <span className="spinner"></span> Resolving...
                            </div>
                        )}
                    </div>

                    {result && (
                        <div className={`result-summary ${result.final_recommendation?.toLowerCase()}`}>
                            <div className="result-header">
                                <span className={`status-badge ${result.final_recommendation?.toLowerCase()}`}>
                                    {result.final_recommendation}
                                </span>
                                <span className="confidence">
                                    {Math.round((result.confidence_score || 0) * 100)}% Confidence
                                </span>
                            </div>

                            {result.conflict_resolutions?.length > 0 && (
                                <div className="resolutions-count">
                                    📋 {result.conflict_resolutions.length} resolutions applied
                                </div>
                            )}

                            {result.key_risks?.length > 0 && (
                                <div className="risks-count">
                                    ⚠️ {result.key_risks.length} risk(s) identified
                                </div>
                            )}

                            {result.requires_human_review && (
                                <div className="human-review-badge">
                                    👤 Human Review Required
                                </div>
                            )}

                            <button className="view-details-btn" onClick={() => onViewDetails && onViewDetails(result)}>
                                View Full Report
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResolverStreamPanel;
