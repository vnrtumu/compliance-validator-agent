import React, { useRef, useState } from 'react';
import { uploadFiles } from '../services/uploadService';
import './Dashboard.css';

const Dashboard = () => {
    const fileInputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

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
            console.log('Selected files:', files.map(f => f.name));
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        setUploadResults(null);

        try {
            const results = await uploadFiles(selectedFiles);
            setUploadResults(results);
            setSelectedFiles([]); // Clear selection on successful upload
            alert('Upload completed successfully!');
        } catch (error) {
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
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
                                {isUploading ? 'Uploading...' : 'Run GST/TDS Check'}
                            </button>
                        )}
                    </div>

                    {uploadResults && (
                        <div className="upload-results" style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
                            <h4>Recent Upload Results:</h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {uploadResults.map((result, index) => (
                                    <li key={index} style={{ marginBottom: '5px' }}>
                                        ✅ {result.filename} ({Math.round(result.size / 1024)} KB) - {result.status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
