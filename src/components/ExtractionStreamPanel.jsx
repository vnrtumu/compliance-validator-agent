import { useState, useEffect, useRef } from 'react';
import { streamExtraction } from '../services/extractionService';
import './ExtractionStreamPanel.css';

/**
 * ExtractionStreamPanel Component
 * 
 * Shows real-time streaming extraction progress after file upload.
 */
const ExtractionStreamPanel = ({ uploadResults, onComplete, onViewDetails }) => {
    const [messages, setMessages] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef(null);
    const cleanupRef = useRef(null);

    useEffect(() => {
        if (uploadResults && uploadResults.length > 0 && !isProcessing) {
            processNextFile(0);
        }

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, [uploadResults]);

    useEffect(() => {
        // Auto-scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const processNextFile = (index) => {
        if (index >= uploadResults.length) {
            setIsProcessing(false);
            onComplete && onComplete(results);
            return;
        }

        const file = uploadResults[index];
        if (!file.id) {
            // Skip files that failed to upload
            processNextFile(index + 1);
            return;
        }

        setIsProcessing(true);
        setCurrentFile(file);
        setCurrentIndex(index);
        setMessages([]);

        // Start streaming extraction
        cleanupRef.current = streamExtraction(
            file.id,
            // onMessage
            (data) => {
                setMessages((prev) => [...prev, data]);
            },
            // onComplete
            (result) => {
                setResults((prev) => ({ ...prev, [file.id]: result }));
                setMessages((prev) => [...prev, {
                    step: 'complete',
                    message: result.decision === 'ACCEPT'
                        ? '✅ Analysis complete - Document ACCEPTED!'
                        : '❌ Analysis complete - Document REJECTED'
                }]);

                // Process next file after a short delay
                setTimeout(() => {
                    processNextFile(index + 1);
                }, 1000);
            },
            // onError
            (error) => {
                setMessages((prev) => [...prev, {
                    step: 'error',
                    message: `❌ Error: ${error.message}`
                }]);
                setResults((prev) => ({ ...prev, [file.id]: { error: error.message } }));

                // Continue with next file
                setTimeout(() => {
                    processNextFile(index + 1);
                }, 1000);
            }
        );
    };

    const handleClose = () => {
        if (cleanupRef.current) {
            cleanupRef.current();
        }
        onComplete && onComplete(results);
    };

    const getResult = (fileId) => results[fileId];

    return (
        <div className="extraction-stream-panel">
            <div className="stream-header">
                <h4>
                    🤖 AI Extractor Agent
                    {currentFile && (
                        <span className="file-name">— {currentFile.filename}</span>
                    )}
                </h4>
                <button className="close-stream-btn" onClick={handleClose}>×</button>
            </div>

            {/* File Queue */}
            {uploadResults.length > 1 && (
                <div className="stream-queue">
                    {uploadResults.map((file, idx) => {
                        const result = getResult(file.id);
                        let className = 'queue-item';
                        if (idx === currentIndex && isProcessing) className += ' active';
                        else if (result?.decision === 'ACCEPT') className += ' completed';
                        else if (result?.decision === 'REJECT' || result?.error) className += ' failed';

                        return (
                            <div key={file.id || idx} className={className}>
                                {idx === currentIndex && isProcessing && <span className="stream-spinner"></span>}
                                {file.filename}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Streaming Messages */}
            <div className="stream-messages">
                {messages.length === 0 && (
                    <div className="stream-message">
                        <span className="stream-spinner"></span>
                        Initializing AI agent...
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`stream-message ${msg.step}`}>
                        {msg.message}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Result Summary (when complete) */}
            {currentFile && results[currentFile.id] && !results[currentFile.id].error && (
                <div className={`stream-result ${results[currentFile.id].decision?.toLowerCase()}`}>
                    <div className="result-icon">
                        {results[currentFile.id].decision === 'ACCEPT' ? '✓' : '✗'}
                    </div>
                    <div className="result-details">
                        <h5>
                            {results[currentFile.id].decision === 'ACCEPT'
                                ? 'Document Accepted'
                                : 'Document Rejected'}
                        </h5>
                        <p>
                            Confidence: {(results[currentFile.id].confidence_score * 100).toFixed(1)}%
                            {results[currentFile.id].document_type &&
                                ` • Type: ${results[currentFile.id].document_type.replace(/_/g, ' ')}`}
                        </p>
                    </div>
                    <div className="result-actions">
                        <button
                            className="view-details-btn"
                            onClick={() => onViewDetails && onViewDetails(currentFile, results[currentFile.id])}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExtractionStreamPanel;
