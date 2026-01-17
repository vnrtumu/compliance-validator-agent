import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/uploadService';
import ExtractionModal from './ExtractionModal';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

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
        // Refresh invoices to get updated extraction status
        fetchInvoices();
    };

    const getStatusTag = (invoice) => {
        if (invoice.extraction_status === 'completed') {
            if (invoice.is_valid) {
                return <span className="status-tag validated">✓ Valid</span>;
            } else {
                return <span className="status-tag rejected">✗ Invalid</span>;
            }
        }
        return <span className="status-tag pending">Pending</span>;
    };

    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Scanned Invoices</h1>
                    <p className="subtitle">Click "Analyze" to run AI extraction and compliance validation.</p>
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
                                <th>Action</th>
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
                                        <td>
                                            <button
                                                className="analyze-btn"
                                                onClick={() => handleAnalyze(inv)}
                                            >
                                                🔍 Analyze
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
        </div>
    );
};

export default Invoices;

