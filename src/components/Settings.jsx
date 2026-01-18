import React, { useState, useEffect } from 'react';
import { getLLMSettings, updateLLMSettings } from '../services/settingsService';
import './Settings.css';

const Settings = () => {
    const [llmProvider, setLlmProvider] = useState('groq');
    const [availableProviders, setAvailableProviders] = useState([]);
    const [currentModel, setCurrentModel] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchLLMSettings();
    }, []);

    const fetchLLMSettings = async () => {
        try {
            const settings = await getLLMSettings();
            setLlmProvider(settings.provider);
            setCurrentModel(settings.model);
            setAvailableProviders(settings.available_providers);
        } catch (error) {
            console.error('Failed to fetch LLM settings:', error);
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            const updated = await updateLLMSettings(llmProvider);
            setCurrentModel(updated.model);
            setSaveMessage('✅ Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage(`❌ Error: ${error.message}`);
            setTimeout(() => setSaveMessage(''), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const getProviderDisplayName = (provider) => {
        const names = {
            'openai': 'OpenAI (GPT-4o)',
            'groq': 'GROQ (Llama 3.3 70B)',
            'deepseek': 'DeepSeek',
            'grok': 'Grok (xAI)'
        };
        return names[provider] || provider;
    };

    return (
        <div className="settings-screen fade-in">
            <header className="screen-header">
                <div>
                    <h1>System Settings</h1>
                    <p className="subtitle">Configure AI engine, compliance rules, and API integrations.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {saveMessage && <span style={{ color: saveMessage.startsWith('✅') ? '#22c55e' : '#ef4444' }}>{saveMessage}</span>}
                    <button className="primary-btn" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            <div className="settings-grid">
                <section className="settings-section glass-card">
                    <h3>AI Engine Configuration</h3>
                    <div className="setting-item">
                        <label>LLM Provider</label>
                        <select
                            className="setting-select"
                            value={llmProvider}
                            onChange={(e) => setLlmProvider(e.target.value)}
                        >
                            {availableProviders.map(provider => (
                                <option key={provider} value={provider}>
                                    {getProviderDisplayName(provider)}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#9ca3af', marginTop: '0.5rem', display: 'block' }}>
                            Current model: {currentModel}
                        </small>
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
