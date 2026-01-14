import React from 'react';
import './AgentCenter.css';

const agents = [
    { name: 'Extractor Agent', status: 'Idle', icon: '🔍', color: '--accent-primary' },
    { name: 'Validator Agent', status: 'Processing', icon: '⚖️', color: '--accent-success' },
    { name: 'Resolver Agent', status: 'Success', icon: '🧩', color: '--accent-warning' },
    { name: 'Reporter Agent', status: 'Waiting', icon: '📊', color: '--accent-secondary' },
];

const logs = [
    { agent: 'Validator', time: '10:02:15', message: 'Analyzing GSTIN format for GST/2024/001...', status: 'info' },
    { agent: 'Extractor', time: '10:02:10', message: 'Table data successfully extracted from JSON source.', status: 'success' },
    { agent: 'Validator', time: '10:02:05', message: 'Ambiguity detected in Section 194J vs 194C classification.', status: 'warning' },
    { agent: 'Resolver', time: '10:01:58', message: 'Resolving tax rate conflict based on HSN 9983.', status: 'info' },
];

const AgentCenter = () => {
    const handleAgentClick = (agentName) => {
        alert(`Accessing ${agentName} controls! You can now view detailed reasoning chains and manual overrides.`);
    };

    return (
        <div className="agent-center fade-in">
            <div className="section-header">
                <h2>Agent Control Center</h2>
                <span className="live-indicator">LIVE</span>
            </div>

            <div className="agent-grid">
                {agents.map((agent) => (
                    <div
                        key={agent.name}
                        className="glass-card agent-card"
                        onClick={() => handleAgentClick(agent.name)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="agent-header">
                            <span className="agent-icon">{agent.icon}</span>
                            <span className={`status-pill ${agent.status.toLowerCase()}`}>{agent.status}</span>
                        </div>
                        <h3>{agent.name}</h3>
                    </div>
                ))}
            </div>

            <div className="glass-card log-container">
                <h3>Reasoning Chain & Activity</h3>
                <div className="log-list">
                    {logs.map((log, index) => (
                        <div key={index} className={`log-item ${log.status}`}>
                            <span className="log-time">[{log.time}]</span>
                            <span className="log-agent">{log.agent}:</span>
                            <span className="log-message">{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentCenter;
