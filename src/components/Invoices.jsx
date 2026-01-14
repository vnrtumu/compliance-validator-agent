import React, { useEffect, useState } from 'react';
import { getInvoices } from '../services/uploadService';
import './Invoices.css';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className="invoices-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>Scanned Invoices</h1>
                    <p className="subtitle">Detailed breakdown of 58-point compliance checks.</p>
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
                                <th>Compliance</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
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
                                            <span className="status-tag validated">
                                                Processed
                                            </span>
                                        </td>
                                        <td>
                                            <div className="compliance-bar-wrapper">
                                                <div
                                                    className="compliance-bar"
                                                    style={{ width: '80%', backgroundColor: 'var(--accent-success)' }}
                                                ></div>
                                                <span className="score-text">46/58</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button className="view-btn">View Report</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Invoices;
