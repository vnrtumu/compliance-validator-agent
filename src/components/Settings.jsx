import React from 'react';
import './Settings.css';

const Settings = () => {
    return (
        <div className="settings-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>System Settings</h1>
                    <p className="subtitle">Configure AI engine, compliance rules, and API integrations.</p>
                </div>
                <button className="primary-btn">Save Changes</button>
            </header>

            <div className="settings-grid">
                <section className="settings-section glass-card">
                    <h3>AI Engine Configuration</h3>
                    <div className="setting-item">
                        <label>Primary Model</label>
                        <select className="setting-select">
                            <option>GPT-4o (High Accuracy)</option>
                            <option>Claude 3.5 Sonnet</option>
                            <option>Gemini 1.5 Pro</option>
                            <option>Llama 3 (Local)</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>Agent Reasoning Depth</label>
                        <input type="range" className="setting-range" min="1" max="5" defaultValue="3" />
                    </div>
                    <div className="setting-item toggle">
                        <label>Human-in-the-Loop Escalation</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                </section>

                <section className="settings-section glass-card">
                    <h3>Compliance Gateways</h3>
                    <div className="setting-item">
                        <label>GST Portal API Cache</label>
                        <select className="setting-select">
                            <option>Real-time (Live)</option>
                            <option>Cached (High Performance)</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>HSN/SAC Database</label>
                        <button className="secondary-btn btn-sm">Refresh Database</button>
                    </div>
                </section>

                <section className="settings-section glass-card">
                    <h3>API Keys & Security</h3>
                    <div className="setting-item">
                        <label>OCR Engine Key</label>
                        <input type="password" value="••••••••••••••••" readOnly className="setting-input" />
                    </div>
                    <div className="setting-item">
                        <label>FinanceGuard Client Secret</label>
                        <input type="password" value="••••••••••••••••" readOnly className="setting-input" />
                    </div>
                </section>

                <section className="settings-section glass-card">
                    <h3>Notification Preferences</h3>
                    <div className="setting-item toggle">
                        <label>Critical Compliance Failure Alerts</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item toggle">
                        <label>Weekly Summary Reports</label>
                        <input type="checkbox" />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
