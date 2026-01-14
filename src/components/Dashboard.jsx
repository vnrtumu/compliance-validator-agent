import React, { useRef, useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleAction = (action) => {
        alert(`${action} triggered! The agent is now preparing the requested data.`);
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            console.log('Selected file:', file.name);
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
                    <h3>{selectedFile ? 'File Selected' : 'Upload Invoice for Validation'}</h3>
                    <p>{selectedFile ? `Ready to validate: ${selectedFile.name}` : 'Drag and drop PDF, images (JPEG/PNG), or data files (JSON/CSV)'}</p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg,.json,.csv"
                    />

                    <div className="upload-actions">
                        <button className="secondary-btn" onClick={handleBrowseClick}>
                            {selectedFile ? 'Change File' : 'Browse Files'}
                        </button>
                        {selectedFile && (
                            <button className="primary-btn" onClick={() => handleAction('Validate Invoice')}>
                                Run GST/TDS Check
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
